package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.modal.Book;
import com.library.modal.BookLoan;
import com.library.modal.User;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.*;
import com.library.payload.response.PageResponse;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
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
        if (id == null) throw new BookException("Book ID is required");
        Book book = bookRepository.findLockedById(id).orElseThrow(() -> new BookException("Book not found"));
        // A caller may already have loaded the entity before waiting for the row lock.
        entityManager.refresh(book, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return book;
    }

    private BookLoan ownedLockedLoan(Long id) throws Exception {
        if (id == null) throw new BookException("Loan ID is required");
        BookLoan loan = bookLoanRepository.findLockedById(id).orElseThrow(() -> new BookException("Loan not found"));
        entityManager.refresh(loan, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        requireOwnerOrAdmin(loan.getUser().getId());
        return loan;
    }

    @Override
    public BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest) throws Exception {

        User user = userService.getCurrentUser();

        return checkoutBookForUser(user.getId(),checkoutRequest);
    }

    @Override
    public BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception {

        // 1. Xác thực sự tồn tại của người dùng
        requireOwnerOrAdmin(userId);
        // Serialize checkout quota checks for this borrower, including different books.
        User user = userRepository.findLockedById(userId).orElseThrow(() -> new BookException("User not found"));

        // 2. Xác thực người dùng có gói đăng ký đang hoạt động.
        SubscriptionDTO subscription = subscriptionService
                .getUsersActiveSubscription(user.getId());
        Integer days = checkoutRequest.getCheckoutDays();
        if (days == null || days < 1 || days > subscription.getMaxDaysPerBook()) {
            throw new BookException("Checkout days exceed the membership limit or are invalid");
        }
        if (checkoutRequest.getNotes() != null && checkoutRequest.getNotes().length() > 500) {
            throw new BookException("Loan notes exceed 500 characters");
        }

        //  3. Xác thực rằng cuốn sách tồn tại và có sẵn.
        Book book = lockedBook(checkoutRequest.getBookId());

        if (!book.getActive()) {
            throw new BookException("Sách không ở trạng thái hoạt động.");
        }
        if (book.getAvailableCopies() <= 0) {
            throw new BookException("Sách không có sẵn.");
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

        //  6. Check for overdue books
        long overdueCount = bookLoanRepository.countOverdueBookLoansByUser(userId, LocalDate.now());
        if (overdueCount > 0) {
            throw new BookException("Trước tiên, hãy trả lại cuốn sách cũ đã quá hạn.!");
        }

        //  7. tạo khoản cho mượn sách
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

        //  9. Cập nhật số lượng bản sách hiện có
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // 10. save book loan
        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return bookLoanMapper.toDTO(savedBookLoan);
    }

    @Override
    public BookLoanDTO checkinBook(CheckinRequest checkinRequest) throws Exception {

        // 1. validate book loan exist
        BookLoan bookLoan = ownedLockedLoan(checkinRequest.getBookLoanId());

        //  2. check if already returned
        if (!bookLoan.isActive()) {
            throw new BookException("book loan is not active");
        }

        // 4.
        BookLoanStatus condition = checkinRequest.getCondition();
        if (condition == null) {
            condition = BookLoanStatus.RETURNED;
        }
        if (condition != BookLoanStatus.RETURNED && condition != BookLoanStatus.LOST
                && condition != BookLoanStatus.DAMAGED) {
            throw new BookException("Return condition must be RETURNED, LOST or DAMAGED");
        }
        bookLoan.setReturnDate(LocalDate.now());
        bookLoan.setStatus(condition);

        //      5 fine todo
        bookLoan.setOverdueDays(0);
        bookLoan.setIsOverdue(false);

        //      6.
        bookLoan.setNotes("book returned by user");

        //      7. update book avaibility

        if (condition != BookLoanStatus.LOST) {
            Book book = lockedBook(bookLoan.getBook().getId());
            if (book.getAvailableCopies() >= book.getTotalCopies()) {
                throw new BookException("Book inventory is inconsistent; check inventory before returning");
            }
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);

        //  proccess next reservation todo
        }

        //  8.
        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);
        return bookLoanMapper.toDTO(savedBookLoan);

    }

    @Override
    public BookLoanDTO renewCheckout(RenewRequest renewalRequest) throws Exception {

        //      1. validate book loan exist
        BookLoan bookLoan = ownedLockedLoan(renewalRequest.getBookLoanId());
        if (renewalRequest.getExtensionDays() == null || renewalRequest.getExtensionDays() < 1) {
            throw new BookException("Extension days must be positive");
        }

        //      2. Check if can be renewed
        if (!bookLoan.canRenew()) {
            throw new BookException("book cannot be renewed");
        }

        // update due date
        LocalDate renewedDueDate = bookLoan.getDueDate().plusDays(renewalRequest.getExtensionDays());
        if (renewedDueDate.getYear() > 9999) {
            throw new BookException("Renewal date exceeds the supported database date range");
        }
        bookLoan.setDueDate(renewedDueDate);

        bookLoan.setRenewalCount(bookLoan.getRenewalCount() + 1);

        bookLoan.setNotes("book renewed by user");

        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        return bookLoanMapper.toDTO(savedBookLoan);
    }

    @Override
    public PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status, int page, int size) throws Exception {
        if (page < 0 || size < 1) throw new BookException("Invalid pagination");
        User currentUser = userService.getCurrentUser();
        Page<BookLoan> bookLoanPage;

        if (status != null) {
            // Return only active checkouts, sorted by due date
            Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
            bookLoanPage = bookLoanRepository.findByStatusAndUser(
                    status, currentUser, pageable);
        } else {
            // Return all history (both active and returned), sorted by creation date descending
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

        // 1 Build pageable with sorting, size, etc.
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

        // 2 Apply filtering logic dynamically
        if (Boolean.TRUE.equals(searchRequest.getOverdueOnly())) {
            // Fetch overdue loans
            bookLoanPage = bookLoanRepository.findOverdueBookLoans(LocalDate.now(), pageable);
        } else if (searchRequest.getUserId() != null) {
            // Fetch loans by specific user
            bookLoanPage = bookLoanRepository.findByUserId(searchRequest.getUserId(), pageable);
        } else if (searchRequest.getBookId() != null) {
            // Fetch loans by specific book
            bookLoanPage = bookLoanRepository.findByBookId(searchRequest.getBookId(), pageable);
        } else if (searchRequest.getStatus() != null) {
            // Fetch loans by loan status
            bookLoanPage = bookLoanRepository.findByStatus(searchRequest.getStatus(), pageable);
        } else if (searchRequest.getStartDate() != null && searchRequest.getEndDate() != null) {
            // Fetch loans within date range
            bookLoanPage = bookLoanRepository.findBookLoansByDateRange(
                    searchRequest.getStartDate(),
                    searchRequest.getEndDate(),
                    pageable
            );
        } else {
            // Default: return all loans
            bookLoanPage = bookLoanRepository.findAll(pageable);
        }

        // 3 Convert entities to DTOs and wrap in response object
        return convertToPageResponse(bookLoanPage);
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
