package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.ReservationStatus;
import com.library.domain.UserRole;
import com.library.exception.ReservationException;
import com.library.mapper.ReservationMapper;
import com.library.modal.Book;
import com.library.modal.Reservation;
import com.library.modal.User;
import com.library.payload.dto.ReservationDTO;
import com.library.payload.request.CheckoutRequest;
import com.library.payload.request.ReservationRequest;
import com.library.payload.request.ReservationSearchRequest;
import com.library.payload.response.PageResponse;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRepository;
import com.library.service.BookLoanService;
import com.library.service.ReservationService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class,
        isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class ReservationServiceImpl implements ReservationService {

    private final BookLoanRepository bookLoanRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final BookLoanService bookLoanService;
    private final com.library.repository.UserRepository userRepository;
    private final com.library.service.SubscriptionService subscriptionService;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private void requireOwnerOrAdmin(Long ownerId) throws Exception {
        User actor = userService.getCurrentUser();
        if (actor.getRole() != UserRole.ROLE_ADMIN && !actor.getId().equals(ownerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Reservation access denied");
        }
    }

    private void requireAdmin() {
        try {
            if (userService.getCurrentUser().getRole() != UserRole.ROLE_ADMIN) {
                throw new org.springframework.security.access.AccessDeniedException("Admin access required");
            }
        } catch (org.springframework.security.access.AccessDeniedException error) {
            throw error;
        } catch (Exception error) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
    }

    // Same lock order as checkout: borrower, then book. All queue mutations lock the book.
    private Book lockBook(Long userId, Long bookId) throws ReservationException {
        userRepository.findLockedById(userId).orElseThrow(() -> new ReservationException("User not found"));
        Book book = bookRepository.findLockedById(bookId)
                .orElseThrow(() -> new ReservationException("Book not found"));
        entityManager.refresh(book, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return book;
    }

    private Reservation ownedReservation(Long id) throws Exception {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reservation not found"));
        requireOwnerOrAdmin(reservation.getUser().getId());
        lockBook(reservation.getUser().getId(), reservation.getBook().getId());
        entityManager.refresh(reservation, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return reservation;
    }

    private void reorderQueue(Long bookId) {
        int position = 1;
        for (Reservation queued : reservationRepository.findActiveQueue(bookId)) {
            queued.setQueuePosition(position++);
        }
    }

    int MAX_RESERVATIONS = 5;

    @Override
    public ReservationDTO createReservation(ReservationRequest reservationRequest) throws Exception {

        User user = userService.getCurrentUser();

        return createReservationForUser(reservationRequest, user.getId());
    }

    @Override
    public ReservationDTO createReservationForUser(
            ReservationRequest reservationRequest, Long userId) throws Exception {

        requireOwnerOrAdmin(userId);
        Book book = lockBook(userId, reservationRequest.getBookId());
        boolean alreadyHasLoan = bookLoanRepository.existsByUserIdAndBookIdAndStatus(
                userId, book.getId(), BookLoanStatus.CHECKED_OUT);
        if (alreadyHasLoan) {
            throw new ReservationException("you already have loan on this book");
        }

        // 1. validate user exist
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ReservationException("User not found"));

        // 2. validate book exist
        if (!Boolean.TRUE.equals(book.getActive())) {
            throw new ReservationException("Book is inactive");
        }

        // 3.
        if (reservationRepository.hasActiveReservation(userId, book.getId())) {
            throw new ReservationException("you have already reservation on this book");
        }

        // 4. Check if book is already available
        if (book.getAvailableCopies() > 0) {
            throw new ReservationException("book is already available");
        }

        // 5. check user's active reservation limit
        long activeReservations = reservationRepository
                .countActiveReservationsByUser(userId);

        if (activeReservations >= MAX_RESERVATIONS) {
            throw new ReservationException("you have reserved " + MAX_RESERVATIONS + " times");
        }

        // 6. create reservation
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setReservedAt(LocalDateTime.now());
        reservation.setNotificationSent(false);
        reservation.setNotes(reservationRequest.getNotes());

        reorderQueue(book.getId());
        long pendingCount = reservationRepository.findActiveQueue(book.getId()).size();
        reservation.setQueuePosition((int) pendingCount + 1);

        Reservation savedReservation = reservationRepository.save(reservation);

        return reservationMapper.toDTO(savedReservation);
    }

    // user 5
    // r user 4

    @Override
    public ReservationDTO cancelReservation(Long reservationId) throws Exception {

        Reservation reservation = ownedReservation(reservationId);

        if (!reservation.canBeCancelled()) {
            throw new ReservationException(
                    "Reservation cannot be cancelled (current status: "
                            + reservation.getStatus() + ")"
            );
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());

        Reservation savedReservation = reservationRepository.save(reservation);

        reorderQueue(reservation.getBook().getId());

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    public ReservationDTO fulfillReservation(Long reservationId) throws Exception {
        requireAdmin();
        Reservation reservation = ownedReservation(reservationId);

        if (!reservation.canBeCancelled() || reservation.hasExpired()) {
            throw new ReservationException("Reservation is cancelled, fulfilled or expired");
        }

        if (reservation.getBook().getAvailableCopies() <= 0) {
            throw new ReservationException(
                    "Reservation is not available for pickup (current status: "
                            + reservation.getStatus() + ")"
            );
        }

        List<Reservation> queue = reservationRepository.findActiveQueue(reservation.getBook().getId());
        if (queue.isEmpty() || !queue.get(0).getId().equals(reservation.getId())) {
            throw new ReservationException("Only the first reservation in the queue can be fulfilled");
        }

        CheckoutRequest request = new CheckoutRequest();
        request.setBookId(reservation.getBook().getId());
        Integer maxDays = subscriptionService.getUsersActiveSubscription(
                reservation.getUser().getId()).getMaxDaysPerBook();
        if (maxDays == null || maxDays < 1) {
            throw new ReservationException("Invalid membership day limit");
        }
        // Approved reservation policy; ordinary checkout defaults remain unchanged.
        request.setCheckoutDays(Math.min(14, maxDays));
        request.setNotes("Assign Booked by Admin");

        bookLoanService.checkoutBookForUser(
                reservation.getUser().getId(),
                request
        );

        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(LocalDateTime.now());
        Reservation savedReservation = reservationRepository.save(reservation);
        reorderQueue(reservation.getBook().getId());

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    public PageResponse<ReservationDTO> getMyReservations(ReservationSearchRequest searchRequest) throws Exception {

        User user = userService.getCurrentUser();
        searchRequest.setUserId(user.getId());
        return queryReservations(searchRequest);
    }

    @Override
    public PageResponse<ReservationDTO> searchReservations(ReservationSearchRequest searchRequest) {
        requireAdmin();
        return queryReservations(searchRequest);
    }

    private PageResponse<ReservationDTO> queryReservations(ReservationSearchRequest searchRequest) {
        Pageable pageable = createPageable(searchRequest);

        Page<Reservation> reservationPage = reservationRepository
                .searchReservationsWithFilters(
                searchRequest.getUserId(),
                searchRequest.getBookId(),
                searchRequest.getStatus(),
                searchRequest.getActiveOnly() != null ? searchRequest.getActiveOnly() : false,
                pageable
        );

        return buildPageResponse(reservationPage);
    }

    private PageResponse<ReservationDTO> buildPageResponse(Page<Reservation> reservationPage) {
        List<ReservationDTO> dtos = reservationPage.getContent().stream()
                .map(reservationMapper::toDTO)
                .toList();

        PageResponse<ReservationDTO> response = new PageResponse<>();
        response.setContent(dtos);
        response.setPageNumber(reservationPage.getNumber());
        response.setPageSize(reservationPage.getSize());
        response.setTotalElements(reservationPage.getTotalElements());
        response.setTotalPages(reservationPage.getTotalPages());
        response.setLast(reservationPage.isLast());

        return response;
    }

    private Pageable createPageable(ReservationSearchRequest searchRequest) {
        if (searchRequest == null || searchRequest.getPage() < 0
                || searchRequest.getSize() < 1 || searchRequest.getSize() > 100
                || searchRequest.getSortBy() == null
                || !Set.of("id", "reservedAt", "availableAt", "queuePosition", "status")
                        .contains(searchRequest.getSortBy())
                || !("ASC".equalsIgnoreCase(searchRequest.getSortDirection())
                     || "DESC".equalsIgnoreCase(searchRequest.getSortDirection()))) {
            throw new IllegalArgumentException("Invalid reservation pagination or sorting");
        }
        Sort sort = "ASC".equalsIgnoreCase(searchRequest.getSortDirection())
                ? Sort.by(searchRequest.getSortBy()).ascending()
                : Sort.by(searchRequest.getSortBy()).descending();

        return PageRequest.of(
                searchRequest.getPage(),
                searchRequest.getSize(),
                sort
        );
    }
}
