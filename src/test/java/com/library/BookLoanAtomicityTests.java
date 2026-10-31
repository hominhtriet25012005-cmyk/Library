package com.library;

import com.library.domain.*;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.modal.*;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.*;
import com.library.repository.*;
import com.library.service.*;
import com.library.service.impl.BookLoanServiceImpl;
import jakarta.persistence.EntityManager;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.orm.jpa.*;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.AdditionalAnswers.delegatesTo;

/** Committed transactions/races on isolated H2 only. Does not connect to library_db1. */
class BookLoanAtomicityTests {
    org.hibernate.SessionFactory factory;
    EntityManager em;
    JpaTransactionManager manager;
    TransactionTemplate tx;
    BookLoanRepository loans;
    BookRepository books;
    UserRepository users;
    UserService userService;
    SubscriptionService subscriptions;
    Long userId, otherId, bookId, otherBook;
    ThreadLocal<Long> actor = new ThreadLocal<>();

    @BeforeEach void setup() throws Exception {
        var config = new Configuration().setProperty("hibernate.connection.driver_class", "org.h2.Driver")
            .setProperty("hibernate.connection.url", "jdbc:h2:mem:loan_"+UUID.randomUUID()+";LOCK_TIMEOUT=10000")
            .setProperty("hibernate.hbm2ddl.auto", "create-drop")
            .setProperty("hibernate.connection.handling_mode", "DELAYED_ACQUISITION_AND_HOLD");
        for (Class<?> type : new Class<?>[]{User.class,Genre.class,Book.class,BookLoan.class,Fine.class,
                Reservation.class,Wishlist.class,SubscriptionPlan.class,Subscription.class,Payment.class}) config.addAnnotatedClass(type);
        factory=config.buildSessionFactory(); em=SharedEntityManagerCreator.createSharedEntityManager(factory);
        manager=new JpaTransactionManager(factory);
        manager.setJpaDialect(new org.springframework.orm.jpa.vendor.HibernateJpaDialect());
        tx=new TransactionTemplate(manager);
        var repos=new JpaRepositoryFactory(em);
        loans=repos.getRepository(BookLoanRepository.class); books=repos.getRepository(BookRepository.class); users=repos.getRepository(UserRepository.class);
        tx.executeWithoutResult(status -> {
            User first=User.builder().email("first@test.invalid").fullName("First").role(UserRole.ROLE_USER).build(); em.persist(first);
            User second=User.builder().email("second@test.invalid").fullName("Second").role(UserRole.ROLE_USER).build(); em.persist(second);
            Genre genre=Genre.builder().code("TEST").name("Test genre").build(); em.persist(genre);
            Book a=Book.builder().isbn("TEST-A").title("A").author("Test").genre(genre).totalCopies(1).availableCopies(1).build(); em.persist(a);
            Book b=Book.builder().isbn("TEST-B").title("B").author("Test").genre(genre).totalCopies(1).availableCopies(1).build(); em.persist(b);
            em.flush(); userId=first.getId(); otherId=second.getId(); bookId=a.getId(); otherBook=b.getId();
        });
        userService=mock(UserService.class); subscriptions=mock(SubscriptionService.class);
        when(userService.getCurrentUser()).thenAnswer(call -> em.find(User.class, actor.get()==null ? userId : actor.get()));
        SubscriptionDTO dto=new SubscriptionDTO(); dto.setMaxBooksAllowed(1); dto.setMaxDaysPerBook(7);
        when(subscriptions.getUsersActiveSubscription(anyLong())).thenReturn(dto);
    }
    @AfterEach void close() { actor.remove(); if(factory!=null) factory.close(); }
    @SuppressWarnings("deprecation")
    BookLoanServiceImpl service(BookLoanRepository repository) {
        var target=new BookLoanServiceImpl(repository,userService,subscriptions,books,new BookLoanMapper(),users);
        org.springframework.test.util.ReflectionTestUtils.setField(target,"entityManager",em);
        var proxy=new ProxyFactory(target); proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(manager,new AnnotationTransactionAttributeSource()));
        return (BookLoanServiceImpl)proxy.getProxy();
    }
    long checkout(BookLoanServiceImpl service, long book) throws Exception {
        CheckoutRequest request=new CheckoutRequest(); request.setBookId(book); request.setCheckoutDays(7);
        return service.checkoutBook(request).getId();
    }
    void checkin(BookLoanServiceImpl service, long loan) throws Exception {
        CheckinRequest request=new CheckinRequest(); request.setBookLoanId(loan); service.checkinBook(request);
    }
    int available(long id) { return tx.execute(s -> em.find(Book.class,id).getAvailableCopies()); }
    long count() { return tx.execute(s -> loans.count()); }
    List<Boolean> race(Callable<Boolean> first, Callable<Boolean> second) throws Exception {
        ExecutorService pool=Executors.newFixedThreadPool(2); CountDownLatch start=new CountDownLatch(1);
        try {
            Future<Boolean> a=pool.submit(() -> {start.await(); return first.call();});
            Future<Boolean> b=pool.submit(() -> {start.await(); return second.call();});
            start.countDown(); return List.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS));
        } finally { pool.shutdownNow(); assertTrue(pool.awaitTermination(5,TimeUnit.SECONDS)); }
    }
    boolean tryCheckout(BookLoanServiceImpl service,long user,long book) throws Exception {
        actor.set(user);
        try { checkout(service,book); return true; }
        catch(BookException expected) { return false; }
        finally { actor.remove(); }
    }
    @Test void failedLoanInsertRollsBackInventory() {
        var failing=mock(BookLoanRepository.class,delegatesTo(loans));
        doAnswer(call -> {em.flush(); throw new IllegalStateException("injected loan failure");}).when(failing).save(any(BookLoan.class));
        assertThrows(IllegalStateException.class, () -> checkout(service(failing),bookId));
        assertEquals(1,available(bookId)); assertEquals(0,count());
    }
    @Test void failedReturnRollsBackBothLoanAndInventory() throws Exception {
        long loan=checkout(service(loans),bookId);
        var failing=mock(BookLoanRepository.class,delegatesTo(loans));
        doAnswer(call -> {em.flush(); throw new IllegalStateException("injected return failure");}).when(failing).save(any(BookLoan.class));
        assertThrows(IllegalStateException.class, () -> checkin(service(failing),loan));
        assertEquals(0,available(bookId));
        assertEquals(BookLoanStatus.CHECKED_OUT,tx.execute(s -> em.find(BookLoan.class,loan).getStatus()));
        assertNull(tx.execute(s -> em.find(BookLoan.class,loan).getReturnDate()));
    }
    @Test void lastCopyOnlyOneBorrowerSucceeds() throws Exception {
        var service=service(loans);
        var results=race(() -> tryCheckout(service,userId,bookId), () -> tryCheckout(service,otherId,bookId));
        assertEquals(1,results.stream().filter(Boolean::booleanValue).count());
        assertEquals(1,count()); assertEquals(0,available(bookId));
    }
    @Test void simultaneousDifferentBooksRespectBorrowerQuota() throws Exception {
        var service=service(loans);
        var results=race(() -> tryCheckout(service,userId,bookId), () -> tryCheckout(service,userId,otherBook));
        assertEquals(1,results.stream().filter(Boolean::booleanValue).count());
        assertEquals(1,count()); assertEquals(1,available(bookId)+available(otherBook));
    }
    @Test void simultaneousReturnRestocksExactlyOnce() throws Exception {
        var service=service(loans); long loan=checkout(service,bookId);
        Callable<Boolean> giveBack=() -> {try {checkin(service,loan); return true;} catch(BookException expected){return false;}};
        assertEquals(1,race(giveBack,giveBack).stream().filter(Boolean::booleanValue).count());
        assertEquals(1,available(bookId));
        assertEquals(BookLoanStatus.RETURNED,tx.execute(s -> em.find(BookLoan.class,loan).getStatus()));
    }
    @Test void simultaneousRenewalsNeverExceedLimit() throws Exception {
        var service=service(loans); long loan=checkout(service,bookId);
        tx.executeWithoutResult(s -> em.find(BookLoan.class,loan).setRenewalCount(1));
        Callable<Boolean> renew=() -> {
            RenewRequest request=new RenewRequest(); request.setBookLoanId(loan); request.setExtensionDays(1);
            try {service.renewCheckout(request); return true;} catch(BookException expected){return false;}
        };
        assertEquals(1,race(renew,renew).stream().filter(Boolean::booleanValue).count());
        Integer renewals=tx.execute(s -> em.find(BookLoan.class,loan).getRenewalCount());
        assertEquals(2,renewals.intValue());
    }

    @Test void overdueKeysetQueryExcludesReturnedLoansAndContinuesAfterLastId() {
        tx.executeWithoutResult(status -> {
            User borrower=em.find(User.class,userId);
            Book book=em.find(Book.class,bookId);
            for (int index=0; index<3; index++) {
                em.persist(BookLoan.builder().user(borrower).book(book).type(BookLoanType.CHECKOUT)
                    .status(BookLoanStatus.CHECKED_OUT).checkoutDate(java.time.LocalDate.now().minusDays(10))
                    .dueDate(java.time.LocalDate.now().minusDays(3)).build());
            }
            em.persist(BookLoan.builder().user(borrower).book(book).type(BookLoanType.CHECKOUT)
                .status(BookLoanStatus.RETURNED).checkoutDate(java.time.LocalDate.now().minusDays(10))
                .dueDate(java.time.LocalDate.now().minusDays(3)).returnDate(java.time.LocalDate.now()).build());
        });
        var first=loans.findOverdueBookLoansAfterId(java.time.LocalDate.now(),0,
            org.springframework.data.domain.PageRequest.of(0,2));
        assertEquals(2,first.size());
        var second=loans.findOverdueBookLoansAfterId(java.time.LocalDate.now(),first.get(1).getId(),
            org.springframework.data.domain.PageRequest.of(0,2));
        assertEquals(1,second.size());
        assertTrue(second.get(0).getId()>first.get(1).getId());
        tx.executeWithoutResult(status -> em.find(User.class,userId).setRole(UserRole.ROLE_ADMIN));
        var subject=service(loans);
        assertEquals(3,subject.updateOverdueBookLoan());
        assertEquals(0,subject.updateOverdueBookLoan());
        long overdueCount=tx.execute(status -> em.createQuery(
            "select count(bl) from BookLoan bl where bl.status = :state",Long.class)
            .setParameter("state",BookLoanStatus.OVERDUE).getSingleResult());
        assertEquals(3L,overdueCount);
    }

    @Test void adminCanRenewAndReturnAnotherUsersLoanButOrdinaryUserCannot() throws Exception {
        var subject=service(loans);
        long loan=checkout(subject,bookId);
        actor.set(otherId);
        RenewRequest renew=new RenewRequest(); renew.setBookLoanId(loan); renew.setExtensionDays(1);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
            () -> subject.renewCheckout(renew));
        tx.executeWithoutResult(status -> em.find(User.class,otherId).setRole(UserRole.ROLE_ADMIN));
        assertEquals(1,subject.renewCheckout(renew).getRenewalCount());
        checkin(subject,loan);
        assertEquals(BookLoanStatus.RETURNED,tx.execute(s -> em.find(BookLoan.class,loan).getStatus()));
        assertEquals(1,available(bookId));
        actor.remove();
    }

}
