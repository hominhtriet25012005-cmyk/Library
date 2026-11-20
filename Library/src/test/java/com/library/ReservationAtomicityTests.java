package com.library;

import com.library.domain.ReservationStatus;
import com.library.exception.ReservationException;
import com.library.mapper.ReservationMapper;
import com.library.model.*;
import com.library.payload.request.ReservationRequest;
import com.library.repository.ReservationRepository;
import com.library.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.AdditionalAnswers.delegatesTo;

/** Reuses isolated H2 fixture, not the primary MySQL database. */
class ReservationAtomicityTests {
    BookLoanAtomicityTests fixture;
    ReservationRepository reservations;

    @BeforeEach void setup() throws Exception {
        fixture = new BookLoanAtomicityTests();
        fixture.setup();
        var membership = new com.library.payload.dto.SubscriptionDTO();
        membership.setMaxBooksAllowed(1); membership.setMaxDaysPerBook(30);
        when(fixture.subscriptions.getUsersActiveSubscription(anyLong())).thenReturn(membership);
        reservations = new JpaRepositoryFactory(fixture.em).getRepository(ReservationRepository.class);
        fixture.tx.executeWithoutResult(s -> fixture.em.find(Book.class, fixture.bookId).setAvailableCopies(0));
    }
    @AfterEach void close() { if (fixture != null) fixture.close(); }

    ReservationServiceImpl service(ReservationRepository repository) throws Exception {
        var target = new ReservationServiceImpl(fixture.loans, fixture.userService, fixture.books,
                repository, new ReservationMapper(), fixture.service(fixture.loans), fixture.users, fixture.subscriptions,
                mock(com.library.service.impl.ReservationLifecycleService.class),
                mock(com.library.service.NotificationPublisher.class));
        org.springframework.test.util.ReflectionTestUtils.setField(target, "entityManager", fixture.em);
        ProxyFactory proxy = new ProxyFactory(target); proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(fixture.manager, new AnnotationTransactionAttributeSource()));
        return (ReservationServiceImpl) proxy.getProxy();
    }
    long reserve(ReservationServiceImpl service) throws Exception {
        ReservationRequest request = new ReservationRequest(); request.setBookId(fixture.bookId);
        return service.createReservation(request).getId();
    }
    void makeAvailable(long reservationId) {
        fixture.tx.executeWithoutResult(s -> {
            fixture.em.find(Book.class, fixture.bookId).setAvailableCopies(1);
            Reservation reservation = fixture.em.find(Reservation.class, reservationId);
            reservation.setStatus(ReservationStatus.AVAILABLE);
            reservation.setAvailableAt(java.time.LocalDateTime.now());
            reservation.setAvailableUntil(java.time.LocalDateTime.now().plusHours(72));
        });
    }
    void makeAdmin() {
        fixture.tx.executeWithoutResult(s -> fixture.em.find(User.class, fixture.userId)
                .setRole(com.library.domain.UserRole.ROLE_ADMIN));
    }
    ReservationStatus status(long id) {
        return fixture.tx.execute(s -> fixture.em.find(Reservation.class, id).getStatus());
    }
    @Test void reservationSaveFailureRollsBackLoanAndInventory() throws Exception {
        long id = reserve(service(reservations)); makeAvailable(id); makeAdmin();
        var failing = mock(ReservationRepository.class, delegatesTo(reservations));
        doAnswer(call -> { fixture.em.flush(); throw new IllegalStateException("injected reservation save failure"); })
                .when(failing).save(any(Reservation.class));
        assertThrows(IllegalStateException.class, () -> service(failing).fulfillReservation(id));
        assertEquals(ReservationStatus.AVAILABLE, status(id));
        assertEquals(1, fixture.available(fixture.bookId)); assertEquals(0, fixture.count());
    }
    @Test void duplicateConcurrentReservationOnlyOneSucceeds() throws Exception {
        var service = service(reservations);
        var outcomes = fixture.race(() -> attemptReserve(service), () -> attemptReserve(service));
        assertEquals(1, outcomes.stream().filter(Boolean::booleanValue).count());
        assertEquals(1L, fixture.tx.execute(s -> reservations.count()).longValue());
    }

    @Test void expiryQueryNeverSelectsCompletedReservationHistory() {
        java.time.LocalDateTime now = java.time.LocalDateTime.of(2026, 11, 20, 12, 0);
        List<Reservation> completed = new ArrayList<>();
        fixture.tx.executeWithoutResult(status -> {
            User user = fixture.em.find(User.class, fixture.userId);
            Book book = fixture.em.find(Book.class, fixture.bookId);
            for (ReservationStatus terminalStatus : List.of(
                    ReservationStatus.FULFILLED, ReservationStatus.CANCELLED, ReservationStatus.EXPIRED)) {
                Reservation historical = Reservation.builder()
                        .user(user).book(book).status(terminalStatus)
                        .reservedAt(now.minusDays(5))
                        .availableAt(now.minusDays(4)).availableUntil(now.minusDays(1))
                        .fulfilledAt(terminalStatus == ReservationStatus.FULFILLED ? now.minusDays(3) : null)
                        .cancelledAt(terminalStatus == ReservationStatus.CANCELLED
                                || terminalStatus == ReservationStatus.EXPIRED ? now.minusDays(2) : null)
                        .notificationSent(true).build();
                fixture.em.persist(historical);
                completed.add(historical);
            }
            Reservation expiredAvailable = Reservation.builder()
                    .user(user).book(book).status(ReservationStatus.AVAILABLE)
                    .reservedAt(now.minusDays(4)).availableAt(now.minusDays(3))
                    .availableUntil(now.minusHours(1)).notificationSent(true).build();
            fixture.em.persist(expiredAvailable);
            fixture.em.flush();
            completed.add(expiredAvailable);
        });
        List<Long> completedIds = completed.stream().map(Reservation::getId).toList();

        List<Long> expiryCandidates = reservations.findExpiredAvailableIds(
                now, org.springframework.data.domain.PageRequest.of(0, 10));

        assertEquals(1, expiryCandidates.size());
        assertEquals(completedIds.get(3), expiryCandidates.get(0));
        assertEquals(List.of(ReservationStatus.FULFILLED, ReservationStatus.CANCELLED,
                        ReservationStatus.EXPIRED),
                fixture.tx.execute(status -> completedIds.subList(0, 3).stream()
                        .map(id -> fixture.em.find(Reservation.class, id).getStatus()).toList()));
    }

    boolean attemptReserve(ReservationServiceImpl service) throws Exception {
        try { reserve(service); return true; } catch (ReservationException expected) { return false; }
    }
    @Test void concurrentFulfillCreatesOnlyOneLoan() throws Exception {
        var service = service(reservations); long id = reserve(service); makeAvailable(id); makeAdmin();
        var outcomes = fixture.race(() -> attemptFulfill(service, id), () -> attemptFulfill(service, id));
        assertEquals(1, outcomes.stream().filter(Boolean::booleanValue).count());
        assertEquals(ReservationStatus.FULFILLED, status(id));
        assertEquals(1, fixture.count()); assertEquals(0, fixture.available(fixture.bookId));
    }
    boolean attemptFulfill(ReservationServiceImpl service, long id) throws Exception {
        try { service.fulfillReservation(id); return true; } catch (ReservationException expected) { return false; }
    }

    @Test void userCannotConfirmOwnReservation() throws Exception {
        var subject=service(reservations); long id=reserve(subject); makeAvailable(id);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> subject.fulfillReservation(id));
        assertEquals(ReservationStatus.AVAILABLE,status(id));
        assertEquals(0,fixture.count());
    }

    @Test void adminCannotSkipTheFirstPersonInQueue() throws Exception {
        var subject=service(reservations);
        long first=reserve(subject);
        fixture.actor.set(fixture.otherId);
        long second=reserve(subject);
        fixture.actor.remove();
        makeAvailable(first); makeAdmin();
        assertThrows(ReservationException.class,() -> subject.fulfillReservation(second));
        assertEquals(ReservationStatus.PENDING,status(second));
        assertEquals(0,fixture.count());
        subject.fulfillReservation(first);
        assertEquals(ReservationStatus.FULFILLED,status(first));
        assertEquals(1,fixture.count());
    }

    @Test void adminSearchesAllReservationsWhileUserReadsOnlyOwn() throws Exception {
        var subject=service(reservations);
        reserve(subject);
        fixture.actor.set(fixture.otherId); reserve(subject); fixture.actor.remove();
        assertEquals(1,subject.getMyReservations(new com.library.payload.request.ReservationSearchRequest()).getTotalElements());
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> subject.searchReservations(new com.library.payload.request.ReservationSearchRequest()));
        makeAdmin();
        assertEquals(2,subject.searchReservations(new com.library.payload.request.ReservationSearchRequest()).getTotalElements());
    }
}
