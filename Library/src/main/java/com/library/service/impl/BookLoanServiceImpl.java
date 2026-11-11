package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import com.library.domain.BookDamageLevel;
import com.library.domain.FineStatus;
import com.library.domain.FineType;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.model.Book;
import com.library.model.BookLoan;
import com.library.model.Fine;
import com.library.model.User;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.*;
import com.library.payload.response.PageResponse;
import com.library.payload.response.CheckinFinePreviewResponse;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.FineRepository;
import com.library.service.BookLoanService;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(
        rollbackFor = Exception.class, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
public class BookLoanServiceImpl implements BookLoanService {

    private final BookLoanRepository bookLoanRepository;
    private final UserService userService;
    private final SubscriptionService subscriptionService;
    private final BookRepository bookRepository;
    private final BookLoanMapper bookLoanMapper;
    private final com.library.repository.UserRepository userRepository;
    private final ReservationLifecycleService reservationLifecycleService;
    private final FineRepository fineRepository;
    @org.springframework.beans.factory.annotation.Value("${app.fines.overdue-daily-rate:5000}")
    private long overdueDailyRate = 5_000L;
    @org.springframework.beans.factory.annotation.Value("${app.fines.light-damage-rate:0.25}")
    private BigDecimal lightDamageRate = new BigDecimal("0.25");
    @org.springframework.beans.factory.annotation.Value("${app.fines.severe-damage-rate:0.75}")
    private BigDecimal severeDamageRate = new BigDecimal("0.75");
    @org.springframework.beans.factory.annotation.Value("${app.fines.loss-processing-fee:20000}")
    private long lossProcessingFee = 20_000L;
    @org.springframework.beans.factory.annotation.Value("${app.fines.default-reference-price:100000}")
    private long defaultReferencePrice = 100_000L;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private void requireOwnerOrAdmin(Long ownerId) throws Exception {
        User actor = userService.getCurrentUser();
        if (actor.getRole() != com.library.domain.UserRole.ROLE_ADMIN
                && !java.util.Objects.equals(actor.getId(), ownerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Loan access denied");
        }
    }

    private void requireAdmin() throws Exception {
        if (userService.getCurrentUser().getRole() != com.library.domain.UserRole.ROLE_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Admin access required");
        }
    }

    private Book lockedBook(Long id) throws BookException {
        if (id == null) throw new BookException("Thiếu mã sách.");
        Book book = bookRepository.findLockedById(id).orElseThrow(() -> new BookException("Không tìm thấy sách."));

        // Người gọi có thể đã tải thực thể đó trước khi chờ khóa hàng.
        entityManager.refresh(book, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return book;
    }

    private BookLoan ownedLockedLoan(Long id) throws Exception {
        if (id == null) throw new BookException("Thiếu mã lượt mượn.");
        BookLoan loan = bookLoanRepository.findLockedById(id).orElseThrow(() -> new BookException("Không tìm thấy lượt mượn."));
        entityManager.refresh(loan, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        requireOwnerOrAdmin(loan.getUser().getId());
        return loan;
    }

    private BookLoan returnRequestLoan(Long id) throws Exception {
        if (id == null) throw new BookException("Thiếu mã lượt mượn.");
        BookLoan loan = bookLoanRepository.findLockedById(id)
                .orElseThrow(() -> new BookException("Không tìm thấy lượt mượn."));
        entityManager.refresh(loan, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        User actor = userService.getCurrentUser();
        if (actor.getRole() != com.library.domain.UserRole.ROLE_USER
                || !java.util.Objects.equals(actor.getId(), loan.getUser().getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không có quyền gửi yêu cầu trả cho lượt mượn này.");
        }
        return loan;
    }

    @Override
    public BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest) throws Exception {

        User user = userService.getCurrentUser();

        return checkoutBookForUser(user.getId(),checkoutRequest);
    }

    @Override
    public BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception {
        return checkoutBookForUser(userId, checkoutRequest, false);
    }

    @Override
    public BookLoanDTO checkoutReservedBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception {
        return checkoutBookForUser(userId, checkoutRequest, true);
    }

    private BookLoanDTO checkoutBookForUser(
            Long userId, CheckoutRequest checkoutRequest, boolean reservationFulfillment) throws Exception {

        // 1. Xác thực sự tồn tại của người dùng
        requireOwnerOrAdmin(userId);

        // Kiểm tra số lượng sách được phép mượn cho người mượn này theo thứ tự, bao gồm cả các cuốn sách khác nhau.
        User user = userRepository.findLockedById(userId).orElseThrow(() -> new BookException("Không tìm thấy người dùng."));

        // 2. Xác thực người dùng có gói đăng ký đang hoạt động.
        SubscriptionDTO subscription = subscriptionService
                .getUsersActiveSubscription(user.getId());
        Integer days = checkoutRequest.getCheckoutDays();
        if (days == null || days < 1 || days > subscription.getMaxDaysPerBook()) {
            throw new BookException("Số ngày mượn không hợp lệ hoặc vượt quá giới hạn của gói thành viên.");
        }
        if (checkoutRequest.getNotes() != null && checkoutRequest.getNotes().length() > 500) {
            throw new BookException("Ghi chú lượt mượn không được vượt quá 500 ký tự.");
        }

        //  3. Xác thực rằng cuốn sách tồn tại và có sẵn.
        Book book = lockedBook(checkoutRequest.getBookId());

        if (!book.getActive()) {
            throw new BookException("Sách không ở trạng thái hoạt động.");
        }
        if (book.getAvailableCopies() <= 0) {
            throw new BookException("Sách không có sẵn.");
        }
        if (!reservationFulfillment
                && reservationLifecycleService.hasAvailableReservationForBook(book.getId())) {
            throw new BookException("Sách đã được đặt giữ và đang chờ nhận.");
        }

        //  4. Kiểm tra xem người dùng đã mượn cuốn sách này chưa.
        if (bookLoanRepository.hasActiveCheckout(userId, book.getId())) {
            throw new BookException("Cuốn sách này hiện đang được mượn.");
        }

        //  5. kiểm tra hạn mức thanh toán đang hoạt động của người dùng
        long activeCheckouts = bookLoanRepository.countActiveBookLoansByUser(userId);
        int maxBooksAllowed = subscription.getMaxBooksAllowed();

        if (activeCheckouts >= maxBooksAllowed) {
            throw new BookException("Bạn đã đạt đến số lượng sách tối đa được phép.");
        }

        //  6. Kiểm tra sách quá hạn
        long overdueCount = bookLoanRepository.countOverdueBookLoansByUser(userId, LocalDate.now());
        if (overdueCount > 0) {
            throw new BookException("Trước tiên, hãy trả lại cuốn sách cũ đã quá hạn.");
        }

        //  7. Tạo khoản cho mượn sách
        BookLoan bookLoan = BookLoan
                .builder()
                .user(user)
                .book(book)
                .type(BookLoanType.CHECKOUT)
                .status(BookLoanStatus.CHECKED_OUT)
                .checkoutDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(checkoutRequest.getCheckoutDays()))
                .renewalCount(0)
                .maxRenewals(2)
                .notes(checkoutRequest.getNotes())
                .isOverdue(false)
                .overdueDays(0)
                .build();

        //  8. Cập nhật số lượng bản sách hiện có
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // 9. Lưu khoản vay sách
        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return bookLoanMapper.toDTO(savedBookLoan);
    }

    @Override
    public BookLoanDTO checkinBook(CheckinRequest checkinRequest) throws Exception {
        User admin = userService.getCurrentUser();
        if (admin.getRole() != com.library.domain.UserRole.ROLE_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Chỉ ADMIN được xác nhận tiếp nhận sách.");
        }
        if (checkinRequest == null || checkinRequest.getBookLoanId() == null) {
            throw new BookException("Thiếu mã lượt mượn.");
        }

        BookLoan bookLoan = bookLoanRepository.findLockedById(checkinRequest.getBookLoanId())
                .orElseThrow(() -> new BookException("Không tìm thấy lượt mượn."));
        entityManager.refresh(bookLoan, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        // Retry sau khi giao dịch đầu đã hoàn tất chỉ đọc lại kết quả, không tăng kho lần hai.
        if (bookLoan.getCheckedInAt() != null && !bookLoan.isActive()) {
            return bookLoanMapper.toDTO(bookLoan);
        }
        if (!bookLoan.isActive()) {
            throw new BookException("Lượt mượn này không còn hiệu lực.");
        }

        BookLoanStatus condition = checkinRequest.getCondition();
        if (condition == null) {
            condition = BookLoanStatus.RETURNED;
        }
        if (condition != BookLoanStatus.RETURNED && condition != BookLoanStatus.LOST
                && condition != BookLoanStatus.DAMAGED) {
            throw new BookException("Tình trạng sách khi trả không hợp lệ. Chọn đã trả, bị mất hoặc hư hỏng.");
        }

        LocalDateTime checkinAt = LocalDateTime.now();
        LocalDate returnDate = checkinRequest.getReceivedDate() == null
                ? checkinAt.toLocalDate() : checkinRequest.getReceivedDate();
        validateReceivedDate(bookLoan, returnDate, checkinAt.toLocalDate());
        String inspectionNote = normalizeInspectionNote(checkinRequest);
        if ((condition == BookLoanStatus.DAMAGED || condition == BookLoanStatus.LOST)
                && inspectionNote == null) {
            throw new BookException("Ghi chú kiểm tra là bắt buộc khi sách bị hư hỏng hoặc mất.");
        }
        validateDamageLevel(condition, checkinRequest.getDamageLevel());
        int recordedOverdueDays = bookLoan.getOverdueDays() == null ? 0 : bookLoan.getOverdueDays();
        int actualOverdueDays = calculateOverdueDate(bookLoan.getDueDate(), returnDate);

        CheckinFinePreviewResponse finePreview = calculateFinePreview(
                bookLoan, condition, checkinRequest.getDamageLevel(), actualOverdueDays);
        if (Boolean.TRUE.equals(finePreview.getRequiresDefaultReferencePriceConfirmation())
                && !Boolean.TRUE.equals(checkinRequest.getConfirmDefaultReferencePrice())) {
            throw new BookException(
                    "Sách chưa có giá hợp lệ. ADMIN phải xác nhận dùng giá tham chiếu 100.000đ trước khi tạo phạt.");
        }

        bookLoan.setReturnDate(returnDate);
        bookLoan.setStatus(condition);
        bookLoan.setCheckedInAt(checkinAt);
        bookLoan.setCheckedInBy(admin);
        bookLoan.setInspectionNote(inspectionNote);

        // Giữ lại overdueDays như một phần lịch sử khoản vay không thay đổi sau khi quá trình mượn trả hoàn tất.
        bookLoan.setOverdueDays(Math.max(recordedOverdueDays, actualOverdueDays));
        bookLoan.setIsOverdue(false);

        if (condition == BookLoanStatus.RETURNED) {
            Book book = lockedBook(bookLoan.getBook().getId());
            if (book.getAvailableCopies() >= book.getTotalCopies()) {
                throw new BookException("Số bản sách trong kho không khớp; vui lòng kiểm tra tồn kho trước khi trả.");
            }
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
            reservationLifecycleService.activateNextPendingForBook(book.getId(), checkinAt);
        }

        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);
        createReturnFinesIfRequired(savedBookLoan, admin, finePreview, inspectionNote);
        return bookLoanMapper.toDTO(savedBookLoan);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public CheckinFinePreviewResponse previewCheckinFines(CheckinRequest checkinRequest) throws Exception {
        requireAdmin();
        if (checkinRequest == null || checkinRequest.getBookLoanId() == null) {
            throw new BookException("Thiếu mã lượt mượn.");
        }

        BookLoan bookLoan = bookLoanRepository.findById(checkinRequest.getBookLoanId())
                .orElseThrow(() -> new BookException("Không tìm thấy lượt mượn."));
        if (!bookLoan.isActive() || bookLoan.getCheckedInAt() != null) {
            throw new BookException("Lượt mượn này không còn hiệu lực.");
        }

        BookLoanStatus condition = checkinRequest.getCondition() == null
                ? BookLoanStatus.RETURNED : checkinRequest.getCondition();
        if (condition != BookLoanStatus.RETURNED && condition != BookLoanStatus.LOST
                && condition != BookLoanStatus.DAMAGED) {
            throw new BookException("Tình trạng sách khi trả không hợp lệ. Chọn đã trả, bị mất hoặc hư hỏng.");
        }
        validateDamageLevel(condition, checkinRequest.getDamageLevel());

        LocalDate receivedDate = checkinRequest.getReceivedDate() == null
                ? LocalDate.now() : checkinRequest.getReceivedDate();
        validateReceivedDate(bookLoan, receivedDate, LocalDate.now());
        int overdueDays = calculateOverdueDate(bookLoan.getDueDate(), receivedDate);

        return calculateFinePreview(bookLoan, condition, checkinRequest.getDamageLevel(), overdueDays);
    }

    private void validateDamageLevel(BookLoanStatus condition, BookDamageLevel damageLevel)
            throws BookException {
        if (condition == BookLoanStatus.DAMAGED && damageLevel == null) {
            throw new BookException("ADMIN phải chọn mức độ hư hỏng nhẹ hoặc nặng.");
        }
        if (condition != BookLoanStatus.DAMAGED && damageLevel != null) {
            throw new BookException("Chỉ được chọn mức độ hư hỏng khi tình trạng sách là hư hỏng.");
        }
    }

    private CheckinFinePreviewResponse calculateFinePreview(
            BookLoan loan, BookLoanStatus condition, BookDamageLevel damageLevel, int overdueDays)
            throws BookException {
        boolean requiresFine = overdueDays > 0
                || condition == BookLoanStatus.DAMAGED
                || condition == BookLoanStatus.LOST;
        if (!requiresFine) {
            return CheckinFinePreviewResponse.builder()
                    .bookLoanId(loan.getId())
                    .overdueDays(overdueDays)
                    .usesDefaultReferencePrice(false)
                    .requiresDefaultReferencePriceConfirmation(false)
                    .items(List.of())
                    .totalAmount(0L)
                    .build();
        }

        BigDecimal price = loan.getBook().getPrice();
        long referencePrice;
        boolean usesDefaultPrice;
        if (price != null && price.signum() > 0) {
            try {
                referencePrice = price.setScale(0, RoundingMode.HALF_UP).longValueExact();
                usesDefaultPrice = false;
            } catch (ArithmeticException ex) {
                throw new BookException("Giá sách vượt quá phạm vi tính tiền phạt.");
            }
        } else {
            referencePrice = defaultReferencePrice;
            usesDefaultPrice = true;
        }

        List<CheckinFinePreviewResponse.Item> items = new ArrayList<>();
        if (overdueDays > 0) {
            long amount = Math.min(Math.multiplyExact((long) overdueDays, overdueDailyRate), referencePrice);
            items.add(previewItem(FineType.OVERDUE, "Quá hạn (" + overdueDays + " ngày)", amount,
                    "Phạt trả sách quá hạn " + overdueDays + " ngày."));
        }
        if (condition == BookLoanStatus.DAMAGED) {
            BigDecimal rate = damageLevel == BookDamageLevel.LIGHT ? lightDamageRate : severeDamageRate;
            long amount = BigDecimal.valueOf(referencePrice).multiply(rate)
                    .setScale(0, RoundingMode.HALF_UP).longValueExact();
            String label = damageLevel == BookDamageLevel.LIGHT ? "Hư hỏng nhẹ (25%)" : "Hư hỏng nặng (75%)";
            String reasonLabel = damageLevel == BookDamageLevel.LIGHT ? "nhẹ (25%)" : "nặng (75%)";
            items.add(previewItem(FineType.DAMAGE, label, amount,
                    "Phạt sách hư hỏng " + reasonLabel + " giá tham chiếu."));
        } else if (condition == BookLoanStatus.LOST) {
            long amount = Math.addExact(referencePrice, lossProcessingFee);
            items.add(previewItem(FineType.LOSS, "Mất sách (100% + phí xử lý)", amount,
                    "Bồi thường sách bị mất (100% giá tham chiếu + 20.000đ phí xử lý)."));
        }

        long total = 0L;
        for (CheckinFinePreviewResponse.Item item : items) {
            total = Math.addExact(total, item.getAmount());
        }
        return CheckinFinePreviewResponse.builder()
                .bookLoanId(loan.getId())
                .overdueDays(overdueDays)
                .referencePrice(referencePrice)
                .usesDefaultReferencePrice(usesDefaultPrice)
                .requiresDefaultReferencePriceConfirmation(usesDefaultPrice)
                .items(items)
                .totalAmount(total)
                .build();
    }

    private CheckinFinePreviewResponse.Item previewItem(
            FineType type, String label, long amount, String reason) {
        return CheckinFinePreviewResponse.Item.builder()
                .type(type)
                .label(label)
                .amount(amount)
                .reason(reason)
                .build();
    }

    private void createReturnFinesIfRequired(BookLoan loan, User admin,
                                              CheckinFinePreviewResponse preview,
                                              String inspectionNote) {
        for (CheckinFinePreviewResponse.Item item : preview.getItems()) {
            createFineOnce(loan, admin, item.getType(), item.getAmount(),
                    item.getReason(), inspectionNote);
        }
    }

    private void createFineOnce(BookLoan loan, User admin, FineType type, long amount,
                                String reason, String notes) {
        if (amount <= 0 || fineRepository.existsByBookLoanIdAndType(loan.getId(), type)) return;
        fineRepository.save(Fine.builder()
                .bookLoan(loan)
                .user(loan.getUser())
                .type(type)
                .amount(amount)
                .amountPaid(0L)
                .status(FineStatus.PENDING)
                .reason(reason)
                .notes(notes)
                .processedBy(admin)
                .build());
    }

    private void validateReceivedDate(BookLoan bookLoan, LocalDate receivedDate, LocalDate today)
            throws BookException {
        LocalDate earliestReceivedDate = bookLoan.getReturnRequestedAt() == null
                ? bookLoan.getCheckoutDate()
                : bookLoan.getReturnRequestedAt().toLocalDate();
        if (receivedDate.isBefore(earliestReceivedDate)) {
            if (bookLoan.getReturnRequestedAt() != null) {
                throw new BookException("Ngày nhận sách không được trước ngày người dùng gửi yêu cầu trả.");
            }
            throw new BookException("Ngày nhận sách không được trước ngày mượn.");
        }
        if (receivedDate.isAfter(today)) {
            throw new BookException("Ngày nhận sách không được ở tương lai.");
        }
    }

    @SuppressWarnings("deprecation")
    private String normalizeInspectionNote(CheckinRequest request) throws BookException {
        String note = request.getInspectionNote();
        if ((note == null || note.isBlank()) && request.getNotes() != null) {
            note = request.getNotes();
        }
        if (note == null || note.isBlank()) return null;
        String normalized = note.trim();
        if (normalized.length() > 500) {
            throw new BookException("Ghi chú kiểm tra không được vượt quá 500 ký tự.");
        }
        return normalized;
    }

    @Override
    public BookLoanDTO requestReturn(Long bookLoanId, ReturnBookRequest request) throws Exception {
        BookLoan bookLoan = returnRequestLoan(bookLoanId);
        if (bookLoan.getStatus() != BookLoanStatus.CHECKED_OUT
                && bookLoan.getStatus() != BookLoanStatus.OVERDUE) {
            throw new BookException("Chỉ có thể gửi yêu cầu trả cho lượt mượn đang hoạt động hoặc quá hạn.");
        }

        // Bấm lặp trả về chính yêu cầu đầu tiên, không đổi thời điểm hoặc ghi chú.
        if (bookLoan.isReturnPending()) {
            return bookLoanMapper.toDTO(bookLoan);
        }

        String note = request == null ? null : normalizeReturnRequestNote(request.getNote());
        bookLoan.setReturnRequestedAt(LocalDateTime.now());
        bookLoan.setReturnRequestNote(note);
        return bookLoanMapper.toDTO(bookLoanRepository.save(bookLoan));
    }

    private String normalizeReturnRequestNote(String note) throws BookException {
        if (note == null || note.isBlank()) return null;
        String normalized = note.trim();
        if (normalized.length() > 500) {
            throw new BookException("Ghi chú yêu cầu trả sách không được vượt quá 500 ký tự.");
        }
        return normalized;
    }

    @Override
    public BookLoanDTO renewCheckout(RenewRequest renewalRequest) throws Exception {

        // 1. Xác thực sự tồn tại của khoản cho mượn sách
        BookLoan bookLoan = ownedLockedLoan(renewalRequest.getBookLoanId());
        if (renewalRequest.getExtensionDays() == null || renewalRequest.getExtensionDays() < 1) {
            throw new BookException("Số ngày gia hạn phải lớn hơn 0.");
        }

        if (bookLoan.isReturnPending()) {
            throw new BookException("Không thể gia hạn khi yêu cầu trả sách đang chờ xác nhận.");
        }

        //  2. Kiểm tra xem có thể gia hạn được không
        if (!bookLoan.canRenew()) {
            throw new BookException("Lượt mượn này không thể gia hạn.");
        }

        SubscriptionDTO subscription = subscriptionService
                .getUsersActiveSubscription(bookLoan.getUser().getId());
        Integer planMaxDays = subscription == null ? null : subscription.getMaxDaysPerBook();
        if (planMaxDays == null || planMaxDays < 1) {
            throw new BookException("Gói thành viên hiện tại không có hạn mức gia hạn hợp lệ.");
        }
        int maxExtensionDays = Math.min(14, planMaxDays);
        if (renewalRequest.getExtensionDays() > maxExtensionDays) {
            throw new BookException("Mỗi lần chỉ được gia hạn tối đa " + maxExtensionDays
                    + " ngày theo gói thành viên hiện tại.");
        }

        // 3. Cập nhật ngày đến hạn
        LocalDate renewedDueDate = bookLoan.getDueDate().plusDays(renewalRequest.getExtensionDays());
        if (renewedDueDate.getYear() > 9999) {
            throw new BookException("Ngày gia hạn vượt ngoài phạm vi ngày hệ thống hỗ trợ.");
        }
        bookLoan.setDueDate(renewedDueDate);

        bookLoan.setRenewalCount(bookLoan.getRenewalCount() + 1);

        bookLoan.setNotes("book renewed by user");

        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return bookLoanMapper.toDTO(savedBookLoan);
    }

    @Override
    public PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status, int page, int size) throws Exception {
        if (page < 0 || size < 1) throw new BookException("Thông tin phân trang không hợp lệ.");
        User currentUser = userService.getCurrentUser();
        Page<BookLoan> bookLoanPage;

        if (status != null) {
            // Chỉ trả về các lượt mượn đang hoạt động, được sắp xếp theo ngày đến hạn
            Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
            bookLoanPage = bookLoanRepository.findByStatusAndUser(
                    status, currentUser, pageable);
        } else {
            // Trả về toàn bộ lịch sử (bao gồm cả các mục đang hoạt động và đã trả lại),
            // được sắp xếp theo ngày tạo theo thứ tự giảm dần
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            bookLoanPage = bookLoanRepository.findByUserId(currentUser.getId(), pageable);
        }

        return convertToPageResponse(bookLoanPage);
    }

    @Override
    public PageResponse<BookLoanDTO> getBookLoans(BookLoanSearchRequest searchRequest) {
        try { requireAdmin(); }
        catch (org.springframework.security.access.AccessDeniedException ex) { throw ex; }
        catch (Exception ex) { throw new org.springframework.security.access.AccessDeniedException("Authentication required"); }

        // 1 Xây dựng đối tượng phân trang (pageable) với các tùy chọn như sắp xếp, kích thước, v.v.
        if (searchRequest.getPage() == null || searchRequest.getSize() == null
                || searchRequest.getSortBy() == null || searchRequest.getSortDirection() == null) {
            throw new IllegalArgumentException("Pagination fields must not be null");
        }
        Pageable pageable = createPageable(
                searchRequest.getPage(),
                searchRequest.getSize(),
                searchRequest.getSortBy(),
                searchRequest.getSortDirection()
        );

        Page<BookLoan> bookLoanPage;

        // 2 Áp dụng logic lọc một cách linh hoạt
        if (Boolean.TRUE.equals(searchRequest.getOverdueOnly())) {
            // Truy xuất các khoản vay quá hạn
            bookLoanPage = bookLoanRepository.findOverdueBookLoans(LocalDate.now(), pageable);
        } else if (searchRequest.getUserId() != null) {
            // Truy xuất các khoản vay theo người dùng cụ thể
            bookLoanPage = bookLoanRepository.findByUserId(searchRequest.getUserId(), pageable);
        } else if (searchRequest.getBookId() != null) {
            // Truy xuất các khoản cho mượn theo một cuốn sách cụ thể
            bookLoanPage = bookLoanRepository.findByBookId(searchRequest.getBookId(), pageable);
        } else if (searchRequest.getStatus() != null) {
            // Truy xuất các khoản vay theo trạng thái khoản vay
            bookLoanPage = bookLoanRepository.findByStatus(searchRequest.getStatus(), pageable);
        } else if (searchRequest.getStartDate() != null && searchRequest.getEndDate() != null) {
            // Truy xuất các khoản vay trong khoảng thời gian nhất định
            bookLoanPage = bookLoanRepository.findBookLoansByDateRange(
                    searchRequest.getStartDate(),
                    searchRequest.getEndDate(),
                    pageable
            );
        } else {
            // Không thanh toán: Hoàn trả tất cả các khoản vay
            bookLoanPage = bookLoanRepository.findAll(pageable);
        }

        // 3 Chuyển đổi các thực thể (entities)
        // thành các DTO và bao gói chúng trong một đối tượng phản hồi (response object)
        return convertToPageResponse(bookLoanPage);
    }

    @Override
    public PageResponse<BookLoanDTO> getPendingReturnRequests(int page, int size) throws Exception {
        requireAdmin();
        if (page < 0 || size < 1) {
            throw new BookException("Thông tin phân trang không hợp lệ.");
        }
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return convertToPageResponse(bookLoanRepository.findPendingReturnRequests(pageable));
    }


    @Override
    public int updateOverdueBookLoan() {
        try { requireAdmin(); }
        catch (org.springframework.security.access.AccessDeniedException ex) { throw ex; }
        catch (Exception ex) { throw new org.springframework.security.access.AccessDeniedException("Authentication required"); }
        return updateOverdueBookLoan(1000);
    }

    private int updateOverdueBookLoan(int batchSize) {
        LocalDate today = LocalDate.now();
        Pageable pageable = PageRequest.of(0, batchSize);
        long afterId = 0;
        int updateCount = 0;
        while (true) {
            List<BookLoan> batch = bookLoanRepository.findOverdueBookLoansAfterId(today, afterId, pageable);
            if (batch.isEmpty()) break;
            for (BookLoan candidate : batch) {
                afterId = candidate.getId();
                BookLoan bookLoan = bookLoanRepository.findLockedById(afterId).orElse(null);
                if (bookLoan == null) continue;
                entityManager.refresh(bookLoan, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
                if (!bookLoan.isActive() || !bookLoan.getDueDate().isBefore(today)) continue;

                int overdueDays = calculateOverdueDate(bookLoan.getDueDate(), today);
                if (bookLoan.getStatus() != BookLoanStatus.OVERDUE
                        || !Boolean.TRUE.equals(bookLoan.getIsOverdue())
                        || !java.util.Objects.equals(bookLoan.getOverdueDays(), overdueDays)) {
                    bookLoan.setStatus(BookLoanStatus.OVERDUE);
                    bookLoan.setIsOverdue(true);
                    bookLoan.setOverdueDays(overdueDays);
                    bookLoanRepository.save(bookLoan);
                    updateCount++;
                }
            }
            if (batch.size() < batchSize) break;
        }
        return updateCount;
    }

    private Pageable createPageable(int page,
                                    int size,
                                    String sortBy,
                                    String sortDirection) {
        size = Math.min(size, 100);
        size = Math.max(size, 1);

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        return PageRequest.of(page, size, sort);
    }

    private PageResponse<BookLoanDTO> convertToPageResponse(Page<BookLoan> bookLoanPage) {
        List<BookLoanDTO> bookLoanDTOs = bookLoanPage.getContent()
                .stream()
                .map(bookLoanMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                bookLoanDTOs,
                bookLoanPage.getNumber(),
                bookLoanPage.getSize(),
                bookLoanPage.getTotalElements(),
                bookLoanPage.getTotalPages(),
                bookLoanPage.isLast(),
                bookLoanPage.isFirst(),
                bookLoanPage.isEmpty()
        );
    }

    public int calculateOverdueDate(LocalDate dueDate, LocalDate today) {
        if (today.isBefore(dueDate) || today.isEqual(dueDate)) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(dueDate, today);
    }

}
