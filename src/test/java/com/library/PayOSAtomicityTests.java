package com.library;

import com.library.domain.*;
import com.library.modal.*;
import com.library.repository.*;
import com.library.service.impl.PayOSSettlementService;
import jakarta.persistence.EntityManager;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.SharedEntityManagerCreator;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.AdditionalAnswers.delegatesTo;

/** Real transaction/locking tests against a unique in-memory H2 database, never library_db1. */
class PayOSAtomicityTests {
    private org.hibernate.SessionFactory factory;
    private EntityManager em;
    private JpaTransactionManager manager;
    private TransactionTemplate tx;
    private PaymentRepository payments;
    private SubscriptionRepository subscriptions;
    private Long paymentId;
    private Long subscriptionId;

    @BeforeEach void setup() {
        var config = new Configuration()
                .setProperty("hibernate.connection.driver_class", "org.h2.Driver")
                .setProperty("hibernate.connection.url", "jdbc:h2:mem:payos_c1_" + UUID.randomUUID() + ";LOCK_TIMEOUT=10000")
                .setProperty("hibernate.hbm2ddl.auto", "create-drop");
        for (Class<?> entity : new Class<?>[]{User.class, Genre.class, Book.class, BookLoan.class, Fine.class,
                Reservation.class, Wishlist.class, SubscriptionPlan.class, Subscription.class, Payment.class}) {
            config.addAnnotatedClass(entity);
        }
        factory = config.buildSessionFactory();
        em = SharedEntityManagerCreator.createSharedEntityManager(factory);
        manager = new JpaTransactionManager(factory);
        tx = new TransactionTemplate(manager);
        var repositories = new JpaRepositoryFactory(em);
        payments = repositories.getRepository(PaymentRepository.class);
        subscriptions = repositories.getRepository(SubscriptionRepository.class);
        tx.executeWithoutResult(status -> {
            User user = User.builder().fullName("Test User").email("test@example.test").role(UserRole.ROLE_USER).build();
            em.persist(user);
            SubscriptionPlan plan = SubscriptionPlan.builder().planCode("TEST").name("Test Plan")
                    .price(new BigDecimal("100000.00")).currency("VND").durationDays(30)
                    .maxBooksAllowed(3).maxDaysPerBook(14).build();
            em.persist(plan);
            Subscription sub = Subscription.builder().user(user).plan(plan).isActive(false).build();
            sub.initializeFromPlan(); em.persist(sub);
            Payment payment = Payment.builder().user(user).subscription(sub).amount(100000L).currency("VND")
                    .gateway(PaymentGateway.PAYOS).paymentType(PaymentType.MEMBERSHIP)
                    .status(PaymentStatus.PROCESSING).gatewayOrderId("link").build();
            em.persist(payment); em.flush();
            paymentId = payment.getId(); subscriptionId = sub.getId();
        });
    }
    @AfterEach void close() { if (factory != null) factory.close(); }

    private Long createFine() {
        return tx.execute(status -> {
            var user = em.find(Payment.class, paymentId).getUser();
            var genre = Genre.builder().code("TEST").name("Test").build(); em.persist(genre);
            var book = Book.builder().isbn("TEST-ISBN").title("Test").author("Test").genre(genre).build(); em.persist(book);
            var loan = BookLoan.builder().user(user).book(book).type(BookLoanType.CHECKOUT)
                    .status(BookLoanStatus.OVERDUE).checkoutDate(LocalDate.now().minusDays(20))
                    .dueDate(LocalDate.now().minusDays(5)).build(); em.persist(loan);
            var fine = Fine.builder().user(user).bookLoan(loan).type(FineType.OVERDUE)
                    .amount(100000L).amountPaid(20000L).status(FineStatus.PARTIALLY_PAID).build(); em.persist(fine);
            em.flush(); return fine.getId();
        });
    }

    @SuppressWarnings("deprecation")
    private <T> T transactional(T target) {
        org.springframework.test.util.ReflectionTestUtils.setField(target, "entityManager", em);
        var proxy = new ProxyFactory(target); proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        @SuppressWarnings("unchecked") T result = (T) proxy.getProxy();
        return result;
    }

    private com.library.service.impl.PayOSFineOrderStore fineStore() {
        return transactional(new com.library.service.impl.PayOSFineOrderStore(
                new JpaRepositoryFactory(em).getRepository(FineRepository.class), payments));
    }
    private com.library.service.impl.PayOSFineSettlementService fineSettlement(PaymentRepository repository) {
        return transactional(new com.library.service.impl.PayOSFineSettlementService(repository,
                new JpaRepositoryFactory(em).getRepository(FineRepository.class)));
    }
    private Long ownerId() { return tx.execute(status -> em.find(Payment.class, paymentId).getUser().getId()); }

    @Test void fineOrderUsesOutstandingBalanceOwnerAndExistingOrder() {
        Long fineId = createFine(); var store = fineStore(); Long owner = ownerId();
        assertThatThrownBy(() -> store.prepare(fineId, owner + 100))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var first = store.prepare(fineId, owner);
        assertThat(first.newlyCreated()).isTrue();
        assertThat(first.payment().getAmount()).isEqualTo(80000L);
        assertThat(first.payment().getCurrency()).isEqualTo("VND");
        var second = store.prepare(fineId, owner);
        assertThat(second.newlyCreated()).isFalse();
        assertThat(second.payment().getId()).isEqualTo(first.payment().getId());
        tx.executeWithoutResult(status -> em.find(Fine.class, fineId).setStatus(FineStatus.WAIVED));
        assertThatThrownBy(() -> store.prepare(fineId, owner)).isInstanceOf(IllegalStateException.class);
    }

    @Test void simultaneousFineCreationProducesOneOrder() throws Exception {
        Long fineId = createFine(); Long owner = ownerId(); var store = fineStore();
        var executor = Executors.newFixedThreadPool(2);
        try {
            var start = new CountDownLatch(1);
            Callable<Long> create = () -> { start.await(); return store.prepare(fineId, owner).payment().getId(); };
            var first = executor.submit(create); var second = executor.submit(create); start.countDown();
            assertThat(first.get(20, TimeUnit.SECONDS)).isEqualTo(second.get(20, TimeUnit.SECONDS));
        } finally { executor.shutdownNow(); }
    }

    @Test void concurrentFineCallbacksAndReplayCountReceiptExactlyOnce() throws Exception {
        Long fineId = createFine(); Long order = fineStore().prepare(fineId, ownerId()).payment().getId();
        var service = fineSettlement(payments); var executor = Executors.newFixedThreadPool(2);
        try {
            var start = new CountDownLatch(1);
            Callable<Void> callback = () -> { start.await(); service.complete(order, "fine-link", 80000L, "VND", "receipt"); return null; };
            var first = executor.submit(callback); var second = executor.submit(callback); start.countDown();
            first.get(20, TimeUnit.SECONDS); second.get(20, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        service.complete(order, "fine-link", 80000L, "VND", "receipt");
        assertThatThrownBy(() -> service.complete(order, "fine-link", 80000L, "VND", "other-receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        tx.executeWithoutResult(status -> {
            var fine = em.find(Fine.class, fineId);
            assertThat(fine.getAmountPaid()).isEqualTo(100000L);
            assertThat(fine.getStatus()).isEqualTo(FineStatus.PAID);
            assertThat(fine.getPaidAt()).isNotNull();
            assertThat(em.find(Payment.class, order).getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(em.find(Subscription.class, subscriptionId).getIsActive()).isFalse();
        });
    }

    @Test void fineWriteFailureRollsBackBothRows() {
        Long fineId = createFine(); Long order = fineStore().prepare(fineId, ownerId()).payment().getId();
        PaymentRepository failing = mock(PaymentRepository.class, delegatesTo(payments));
        doThrow(new IllegalStateException("simulated write failure")).when(failing).saveAndFlush(any(Payment.class));
        assertThatThrownBy(() -> fineSettlement(failing).complete(order, "fine-link", 80000L, "VND", "receipt"))
                .isInstanceOf(IllegalStateException.class);
        tx.executeWithoutResult(status -> {
            assertThat(em.find(Fine.class, fineId).getAmountPaid()).isEqualTo(20000L);
            assertThat(em.find(Fine.class, fineId).getStatus()).isEqualTo(FineStatus.PARTIALLY_PAID);
            assertThat(em.find(Payment.class, order).getStatus()).isEqualTo(PaymentStatus.PENDING);
        });
    }

    @Test void invalidEvidenceOrWaivedFineCannotBeMarkedPaid() {
        Long fineId = createFine(); Long order = fineStore().prepare(fineId, ownerId()).payment().getId();
        var service = fineSettlement(payments);
        assertThatThrownBy(() -> service.complete(order, "fine-link", 1L, "VND", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.complete(order, "fine-link", 80000L, "INR", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        tx.executeWithoutResult(status -> em.find(Fine.class, fineId).setStatus(FineStatus.WAIVED));
        assertThatThrownBy(() -> service.complete(order, "fine-link", 80000L, "VND", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        tx.executeWithoutResult(status -> {
            assertThat(em.find(Fine.class, fineId).getAmountPaid()).isEqualTo(20000L);
            assertThat(em.find(Payment.class, order).getStatus()).isEqualTo(PaymentStatus.PENDING);
        });
    }
    @SuppressWarnings("deprecation")
    private PayOSSettlementService proxied(PaymentRepository repository) {
        var target = new PayOSSettlementService(repository, subscriptions);
        org.springframework.test.util.ReflectionTestUtils.setField(target, "entityManager", em);
        var proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        return (PayOSSettlementService) proxy.getProxy();
    }
    @Test void failureAfterSubscriptionFlushRollsBackBothRows() {
        PaymentRepository failing = mock(PaymentRepository.class, delegatesTo(payments));
        doThrow(new IllegalStateException("simulated payment write failure")).when(failing).saveAndFlush(any(Payment.class));
        assertThatThrownBy(() -> proxied(failing).complete(paymentId, "link", 100000L, "VND", "receipt"))
                .isInstanceOf(IllegalStateException.class);
        tx.executeWithoutResult(status -> {
            assertThat(em.find(Payment.class, paymentId).getStatus()).isEqualTo(PaymentStatus.PROCESSING);
            assertThat(em.find(Subscription.class, subscriptionId).getIsActive()).isFalse();
        });
    }
    @Test void concurrentCallbacksSettleOnceAndReplayDoesNotReactivateCancelledMembership() throws Exception {
        var service = proxied(payments);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var start = new CountDownLatch(1);
            Callable<Void> callback = () -> { start.await(); service.complete(paymentId, "link", 100000L, "VND", "receipt"); return null; };
            var first = executor.submit(callback); var second = executor.submit(callback); start.countDown();
            first.get(20, TimeUnit.SECONDS); second.get(20, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        tx.executeWithoutResult(status -> {
            assertThat(em.find(Payment.class, paymentId).getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            var sub = em.find(Subscription.class, subscriptionId);
            assertThat(sub.getIsActive()).isTrue();
            assertThat(sub.getEndDate()).isEqualTo(LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(30));
            sub.setIsActive(false); sub.setCancelledAt(java.time.LocalDateTime.now());
        });
        service.complete(paymentId, "link", 100000L, "VND", "receipt");
        tx.executeWithoutResult(status -> assertThat(em.find(Subscription.class, subscriptionId).getIsActive()).isFalse());
    }

    @Test void invalidEvidenceOrCancelledDraftCannotGrantMembership() {
        var service = proxied(payments);
        assertThatThrownBy(() -> service.complete(paymentId, "link", 1L, "VND", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.complete(paymentId, "other-link", 100000L, "VND", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.complete(paymentId, "link", 100000L, "INR", "receipt"))
                .isInstanceOf(IllegalArgumentException.class);
        tx.executeWithoutResult(status -> em.find(Subscription.class, subscriptionId).setCancelledAt(java.time.LocalDateTime.now()));
        assertThatThrownBy(() -> service.complete(paymentId, "link", 100000L, "VND", "receipt"))
                .isInstanceOf(IllegalStateException.class);
        tx.executeWithoutResult(status -> {
            assertThat(em.find(Payment.class, paymentId).getStatus()).isEqualTo(PaymentStatus.PROCESSING);
            assertThat(em.find(Subscription.class, subscriptionId).getIsActive()).isFalse();
        });
    }

    @Test void lateCreateResponseDoesNotDowngradeSuccess() {
        proxied(payments).complete(paymentId, "link", 100000L, "VND", "receipt");
        var store = new com.library.service.impl.PayOSOrderStore(payments, subscriptions,
                mock(UserRepository.class), mock(SubscriptionPlanRepository.class));
        org.springframework.test.util.ReflectionTestUtils.setField(store, "entityManager", em);
        tx.executeWithoutResult(status -> {
            store.attachLink(paymentId, "link");
            assertThat(em.find(Payment.class, paymentId).getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        });
    }
}
