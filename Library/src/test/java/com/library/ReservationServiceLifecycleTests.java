package com.library;

import com.library.domain.ReservationStatus;
import com.library.domain.UserRole;
import com.library.exception.ReservationException;
import com.library.mapper.ReservationMapper;
import com.library.model.Book;
import com.library.model.Reservation;
import com.library.model.User;
import com.library.payload.dto.SubscriptionDTO;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.UserRepository;
import com.library.service.BookLoanService;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import com.library.service.impl.ReservationLifecycleService;
import com.library.service.impl.ReservationServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReservationServiceLifecycleTests {

    private UserService userService;
    private BookRepository books;
    private ReservationRepository reservations;
    private BookLoanService bookLoans;
    private UserRepository users;
    private SubscriptionService subscriptions;
    private ReservationLifecycleService lifecycle;
    private ReservationServiceImpl subject;
    private User borrower;
    private User admin;
    private Book book;

    @BeforeEach
    void setUp() throws Exception {
        userService = mock(UserService.class);
        books = mock(BookRepository.class);
        reservations = mock(ReservationRepository.class);
        bookLoans = mock(BookLoanService.class);
        users = mock(UserRepository.class);
        subscriptions = mock(SubscriptionService.class);
        lifecycle = mock(ReservationLifecycleService.class);
        borrower = User.builder().id(2L).email("member@test.invalid").fullName("Member")
                .role(UserRole.ROLE_USER).build();
        admin = User.builder().id(1L).email("admin@test.invalid").fullName("Admin")
                .role(UserRole.ROLE_ADMIN).build();
        book = Book.builder().id(9L).title("Book").author("Author")
                .totalCopies(1).availableCopies(1).active(true).build();

        when(users.findLockedById(borrower.getId())).thenReturn(Optional.of(borrower));
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));
        when(reservations.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));
        SubscriptionDTO membership = new SubscriptionDTO();
        membership.setMaxDaysPerBook(30);
        when(subscriptions.getUsersActiveSubscription(borrower.getId())).thenReturn(membership);

        subject = new ReservationServiceImpl(mock(BookLoanRepository.class), userService, books,
                reservations, new ReservationMapper(), bookLoans, users, subscriptions, lifecycle);
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
    }

    @Test
    void adminCannotFulfillPendingReservationEvenWhenInventoryExists() throws Exception {
        Reservation reservation = reservation(ReservationStatus.PENDING);
        when(userService.getCurrentUser()).thenReturn(admin);
        when(reservations.findById(reservation.getId())).thenReturn(Optional.of(reservation));

        ReservationException error = assertThrows(ReservationException.class,
                () -> subject.fulfillReservation(reservation.getId()));

        assertEquals("Lượt đặt giữ hiện chưa sẵn sàng để nhận sách.", error.getMessage());
        verifyNoInteractions(bookLoans, lifecycle);
        assertEquals(ReservationStatus.PENDING, reservation.getStatus());
    }

    @Test
    void cancellingAvailableReservationPromotesNextPerson() throws Exception {
        Reservation reservation = reservation(ReservationStatus.AVAILABLE);
        when(userService.getCurrentUser()).thenReturn(borrower);
        when(reservations.findById(reservation.getId())).thenReturn(Optional.of(reservation));

        subject.cancelReservation(reservation.getId());

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        assertNotNull(reservation.getCancelledAt());
        assertNull(reservation.getQueuePosition());
        verify(lifecycle).activateNextPendingForBook(eq(book.getId()), any(LocalDateTime.class));
    }

    @Test
    void fulfillingAvailableReservationConsumesItAndPromotesNextPerson() throws Exception {
        Reservation reservation = reservation(ReservationStatus.AVAILABLE);
        when(userService.getCurrentUser()).thenReturn(admin);
        when(reservations.findById(reservation.getId())).thenReturn(Optional.of(reservation));
        when(reservations.findActiveQueue(book.getId())).thenReturn(List.of(reservation));

        subject.fulfillReservation(reservation.getId());

        assertEquals(ReservationStatus.FULFILLED, reservation.getStatus());
        assertNotNull(reservation.getFulfilledAt());
        assertNull(reservation.getQueuePosition());
        verify(bookLoans).checkoutReservedBookForUser(eq(borrower.getId()), argThat(request ->
                request.getBookId().equals(book.getId()) && request.getCheckoutDays() == 14));
        verify(lifecycle).activateNextPendingForBook(eq(book.getId()), any(LocalDateTime.class));
    }

    private Reservation reservation(ReservationStatus status) {
        LocalDateTime now = LocalDateTime.now();
        return Reservation.builder()
                .id(12L)
                .user(borrower)
                .book(book)
                .status(status)
                .reservedAt(now.minusDays(2))
                .availableAt(status == ReservationStatus.AVAILABLE ? now.minusHours(1) : null)
                .availableUntil(status == ReservationStatus.AVAILABLE ? now.plusHours(71) : null)
                .queuePosition(1)
                .notificationSent(false)
                .build();
    }
}
