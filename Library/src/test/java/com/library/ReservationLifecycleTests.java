package com.library;

import com.library.domain.ReservationStatus;
import com.library.model.Book;
import com.library.model.Reservation;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRepository;
import com.library.service.impl.ReservationLifecycleService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReservationLifecycleTests {

    private ReservationRepository reservations;
    private BookRepository books;
    private ReservationLifecycleService subject;
    private Book book;

    @BeforeEach
    void setUp() {
        reservations = mock(ReservationRepository.class);
        books = mock(BookRepository.class);
        book = Book.builder().id(8L).totalCopies(2).availableCopies(1).build();
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));

        subject = new ReservationLifecycleService(
                reservations, books, mock(com.library.service.NotificationPublisher.class));
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
    }

    @Test
    void activatesFirstPendingReservationForSeventyTwoHours() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 31, 9, 30);
        Reservation first = pending(1L, 1);
        Reservation second = pending(2L, 2);
        when(reservations.findActiveQueue(book.getId())).thenReturn(List.of(first, second));
        when(reservations.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));

        Optional<Reservation> activated = subject.activateNextPendingForBook(book.getId(), now);

        assertTrue(activated.isPresent());
        assertAll(
                () -> assertEquals(ReservationStatus.AVAILABLE, first.getStatus()),
                () -> assertEquals(now, first.getAvailableAt()),
                () -> assertEquals(now.plusHours(72), first.getAvailableUntil()),
                () -> assertFalse(first.getNotificationSent()),
                () -> assertEquals(1, first.getQueuePosition()),
                () -> assertEquals(2, second.getQueuePosition()),
                () -> assertEquals(ReservationStatus.PENDING, second.getStatus())
        );
        verify(reservations).save(first);
    }

    @Test
    void doesNotActivateAnotherReservationWhileOneIsAlreadyAvailable() {
        Reservation available = pending(1L, 1);
        available.setStatus(ReservationStatus.AVAILABLE);
        Reservation waiting = pending(2L, 2);
        when(reservations.findActiveQueue(book.getId())).thenReturn(List.of(available, waiting));

        Optional<Reservation> activated = subject.activateNextPendingForBook(
                book.getId(), LocalDateTime.of(2026, 10, 31, 9, 30));

        assertTrue(activated.isEmpty());
        assertEquals(ReservationStatus.PENDING, waiting.getStatus());
        verify(reservations, never()).save(any(Reservation.class));
    }

    @Test
    void doesNotActivateQueueWhenNoCopyIsAvailable() {
        book.setAvailableCopies(0);
        Reservation waiting = pending(1L, 1);
        when(reservations.findActiveQueue(book.getId())).thenReturn(List.of(waiting));

        Optional<Reservation> activated = subject.activateNextPendingForBook(
                book.getId(), LocalDateTime.of(2026, 10, 31, 9, 30));

        assertTrue(activated.isEmpty());
        assertEquals(ReservationStatus.PENDING, waiting.getStatus());
        verify(reservations, never()).save(any(Reservation.class));
    }

    @Test
    void expiresAvailableReservationAndActivatesNextPerson() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 31, 12, 0);
        Reservation expired = pending(1L, 1);
        expired.setStatus(ReservationStatus.AVAILABLE);
        expired.setAvailableAt(now.minusHours(73));
        expired.setAvailableUntil(now.minusHours(1));
        Reservation next = pending(2L, 2);

        when(reservations.findExpiredAvailableIds(eq(now), any(Pageable.class)))
                .thenReturn(List.of(expired.getId()));
        when(reservations.findById(expired.getId())).thenReturn(Optional.of(expired));
        when(reservations.findLockedById(expired.getId())).thenReturn(Optional.of(expired));
        when(reservations.findActiveQueue(book.getId())).thenReturn(List.of(next));
        when(reservations.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));

        int count = subject.expireAvailableReservations(now, 100);

        assertEquals(1, count);
        assertAll(
                () -> assertEquals(ReservationStatus.EXPIRED, expired.getStatus()),
                () -> assertEquals(now, expired.getCancelledAt()),
                () -> assertNull(expired.getQueuePosition()),
                () -> assertEquals(ReservationStatus.AVAILABLE, next.getStatus()),
                () -> assertEquals(now, next.getAvailableAt()),
                () -> assertEquals(now.plusHours(72), next.getAvailableUntil()),
                () -> assertEquals(1, next.getQueuePosition())
        );
        verify(reservations).save(expired);
        verify(reservations).save(next);
    }

    @Test
    void ignoresCandidateThatIsNoLongerExpiredAfterLocking() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 31, 12, 0);
        Reservation candidate = pending(1L, 1);
        candidate.setStatus(ReservationStatus.AVAILABLE);
        candidate.setAvailableUntil(now.plusMinutes(1));
        when(reservations.findExpiredAvailableIds(eq(now), any(Pageable.class)))
                .thenReturn(List.of(candidate.getId()));
        when(reservations.findById(candidate.getId())).thenReturn(Optional.of(candidate));
        when(reservations.findLockedById(candidate.getId())).thenReturn(Optional.of(candidate));

        assertEquals(0, subject.expireAvailableReservations(now, 100));
        assertEquals(ReservationStatus.AVAILABLE, candidate.getStatus());
        verify(reservations, never()).save(any(Reservation.class));
    }

    private Reservation pending(Long id, int queuePosition) {
        return Reservation.builder()
                .id(id)
                .book(book)
                .status(ReservationStatus.PENDING)
                .reservedAt(LocalDateTime.of(2026, 10, 30, 8, 0).plusMinutes(id))
                .queuePosition(queuePosition)
                .notificationSent(false)
                .build();
    }
}
