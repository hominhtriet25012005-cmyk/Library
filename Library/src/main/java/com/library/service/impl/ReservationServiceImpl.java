package com.library.service.impl;

import com.library.domain.ReservationStatus;
import com.library.domain.UserRole;
import com.library.exception.ReservationException;
import com.library.mapper.ReservationMapper;
import com.library.model.Book;
import com.library.model.Reservation;
import com.library.model.User;
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
    private final ReservationLifecycleService reservationLifecycleService;
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
        userRepository.findLockedById(userId).orElseThrow(() -> new ReservationException("Không tìm thấy người dùng."));
        Book book = bookRepository.findLockedById(bookId)
                .orElseThrow(() -> new ReservationException("Không tìm thấy sách."));
        entityManager.refresh(book, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        return book;
    }

    private Reservation ownedReservation(Long id) throws Exception {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Không tìm thấy lượt đặt giữ."));
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
        boolean alreadyHasLoan = bookLoanRepository.hasActiveCheckout(userId, book.getId());
        if (alreadyHasLoan) {
            throw new ReservationException("Bạn đang mượn cuốn sách này.");
        }

        // 1. validate user exist
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ReservationException("Không tìm thấy người dùng."));

        // 2. validate book exist
        if (!Boolean.TRUE.equals(book.getActive())) {
            throw new ReservationException("Sách hiện không hoạt động.");
        }

        // 3.
        if (reservationRepository.hasActiveReservation(userId, book.getId())) {
            throw new ReservationException("Bạn đã đặt giữ cuốn sách này.");
        }

        // 4. Check if book is already available
        if (book.getAvailableCopies() > 0) {
            throw new ReservationException("Sách hiện đang có sẵn, bạn không cần đặt giữ.");
        }

        // 5. check user's active reservation limit
        long activeReservations = reservationRepository
                .countActiveReservationsByUser(userId);

        if (activeReservations >= MAX_RESERVATIONS) {
            throw new ReservationException("Bạn đã đạt giới hạn " + MAX_RESERVATIONS + " lượt đặt giữ.");
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
                    "Không thể hủy lượt đặt giữ ở trạng thái hiện tại."
            );
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        LocalDateTime cancelledAt = LocalDateTime.now();
        reservation.setCancelledAt(cancelledAt);
        reservation.setQueuePosition(null);

        Reservation savedReservation = reservationRepository.save(reservation);
        reservationLifecycleService.activateNextPendingForBook(
                reservation.getBook().getId(), cancelledAt);

        return reservationMapper.toDTO(savedReservation);
    }

    @Override
    public ReservationDTO fulfillReservation(Long reservationId) throws Exception {
        requireAdmin();
        Reservation reservation = ownedReservation(reservationId);

        if (reservation.getStatus() != ReservationStatus.AVAILABLE) {
            throw new ReservationException("Lượt đặt giữ hiện chưa sẵn sàng để nhận sách.");
        }
        if (reservation.hasExpired()) {
            throw new ReservationException("Thời hạn nhận sách của lượt đặt giữ đã hết.");
        }

        if (reservation.getBook().getAvailableCopies() <= 0) {
            throw new ReservationException(
                    "Sách hiện không còn bản sẵn để nhận lượt đặt giữ."
            );
        }

        List<Reservation> queue = reservationRepository.findActiveQueue(reservation.getBook().getId());
        if (queue.isEmpty() || !queue.get(0).getId().equals(reservation.getId())) {
            throw new ReservationException("Chỉ có thể hoàn tất lượt đặt giữ đầu tiên trong hàng chờ.");
        }

        CheckoutRequest request = new CheckoutRequest();
        request.setBookId(reservation.getBook().getId());
        Integer maxDays = subscriptionService.getUsersActiveSubscription(
                reservation.getUser().getId()).getMaxDaysPerBook();
        if (maxDays == null || maxDays < 1) {
            throw new ReservationException("Giới hạn số ngày mượn theo gói thành viên không hợp lệ.");
        }
        // Approved reservation policy; ordinary checkout defaults remain unchanged.
        request.setCheckoutDays(Math.min(14, maxDays));
        request.setNotes("Assign Booked by Admin");

        bookLoanService.checkoutReservedBookForUser(
                reservation.getUser().getId(),
                request
        );

        LocalDateTime fulfilledAt = LocalDateTime.now();
        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(fulfilledAt);
        reservation.setQueuePosition(null);
        Reservation savedReservation = reservationRepository.save(reservation);
        reservationLifecycleService.activateNextPendingForBook(
                reservation.getBook().getId(), fulfilledAt);

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
