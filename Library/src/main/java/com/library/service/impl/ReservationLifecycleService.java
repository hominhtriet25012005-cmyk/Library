package com.library.service.impl;

import com.library.domain.ReservationStatus;
import com.library.model.Book;
import com.library.model.Reservation;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
public class ReservationLifecycleService {

    static final int PICKUP_WINDOW_HOURS = 72;

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<Reservation> activateNextPendingForBook(Long bookId, LocalDateTime now) {
        if (bookId == null || now == null) {
            throw new IllegalArgumentException("Book ID and activation time are required");
        }

        Book book = lockBook(bookId);
        return activateNextPendingForLockedBook(book, now);
    }

    private Optional<Reservation> activateNextPendingForLockedBook(Book book, LocalDateTime now) {
        List<Reservation> activeQueue = reservationRepository.findActiveQueue(book.getId());
        reorderQueue(activeQueue);
        if (activeQueue.stream().anyMatch(item -> item.getStatus() == ReservationStatus.AVAILABLE)
                || book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            return Optional.empty();
        }

        Optional<Reservation> nextPending = activeQueue.stream()
                .filter(item -> item.getStatus() == ReservationStatus.PENDING)
                .findFirst();
        if (nextPending.isEmpty()) {
            return Optional.empty();
        }

        Reservation reservation = nextPending.get();
        reservation.setStatus(ReservationStatus.AVAILABLE);
        reservation.setAvailableAt(now);
        reservation.setAvailableUntil(now.plusHours(PICKUP_WINDOW_HOURS));
        reservation.setNotificationSent(false);
        reservationRepository.save(reservation);
        reorderQueue(activeQueue);
        return Optional.of(reservation);
    }

    public int expireAvailableReservations(LocalDateTime now, int batchSize) {
        if (now == null || batchSize < 1) {
            throw new IllegalArgumentException("Expiry time and a positive batch size are required");
        }

        int expiredCount = 0;
        while (true) {
            List<Long> candidateIds = reservationRepository.findExpiredAvailableIds(
                    now, PageRequest.of(0, batchSize));
            if (candidateIds.isEmpty()) {
                break;
            }

            for (Long reservationId : candidateIds) {
                Optional<Reservation> snapshot = reservationRepository.findById(reservationId);
                if (snapshot.isEmpty()) {
                    continue;
                }

                Book book = lockBook(snapshot.get().getBook().getId());
                Optional<Reservation> locked = reservationRepository.findLockedById(reservationId);
                if (locked.isEmpty()) {
                    continue;
                }

                Reservation reservation = locked.get();
                if (reservation.getStatus() != ReservationStatus.AVAILABLE
                        || reservation.getAvailableUntil() == null
                        || reservation.getAvailableUntil().isAfter(now)) {
                    continue;
                }

                reservation.setStatus(ReservationStatus.EXPIRED);
                reservation.setCancelledAt(now);
                reservation.setQueuePosition(null);
                reservationRepository.save(reservation);
                expiredCount++;

                activateNextPendingForLockedBook(book, now);
            }

            if (candidateIds.size() < batchSize) {
                break;
            }
        }
        return expiredCount;
    }

    public boolean hasAvailableReservationForBook(Long bookId) {
        if (bookId == null) {
            return false;
        }
        return reservationRepository.findActiveQueue(bookId).stream()
                .anyMatch(item -> item.getStatus() == ReservationStatus.AVAILABLE);
    }

    private Book lockBook(Long bookId) {
        Book book = bookRepository.findLockedById(bookId)
                .orElseThrow(() -> new IllegalStateException("Reservation book not found"));
        entityManager.refresh(book, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return book;
    }

    private void reorderQueue(List<Reservation> activeQueue) {
        int position = 1;
        for (Reservation reservation : activeQueue) {
            reservation.setQueuePosition(position++);
        }
    }
}
