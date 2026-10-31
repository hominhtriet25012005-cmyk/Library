package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.UserRole;
import com.library.exception.BookReviewException;
import com.library.mapper.BookReviewMapper;
import com.library.modal.Book;
import com.library.modal.BookLoan;
import com.library.modal.BookReview;
import com.library.modal.User;
import com.library.payload.dto.BookReviewDTO;
import com.library.payload.request.CreateReviewRequest;
import com.library.payload.request.UpdateReviewRequest;
import com.library.payload.response.PageResponse;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.BookReviewRepository;
import com.library.service.BookReviewService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookReviewServiceImpl implements BookReviewService {

    private final BookReviewRepository bookReviewRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final BookReviewMapper bookReviewMapper;
    private final BookLoanRepository bookLoanRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookReviewDTO> searchAdminReviews(Long userId, Long bookId, Boolean active,
                                                           int page, int size) throws Exception {
        requireAdmin();
        if ((userId != null && userId < 1) || (bookId != null && bookId < 1)) {
            throw new BookReviewException("User ID and book ID must be positive");
        }
        if (page < 0 || size < 1 || size > 100) {
            throw new BookReviewException("Page must be non-negative and size must be between 1 and 100");
        }
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return convertToPageResponse(bookReviewRepository.searchAdminReviews(userId, bookId, active, pageable));
    }

    @Override
    @Transactional
    public BookReviewDTO hideReview(Long reviewId) throws Exception {
        requireAdmin();
        if (reviewId == null || reviewId < 1) {
            throw new BookReviewException("Review ID must be positive");
        }
        BookReview review = bookReviewRepository.findLockedById(reviewId)
                .orElseThrow(() -> new BookReviewException("Review not found", org.springframework.http.HttpStatus.NOT_FOUND));
        if (Boolean.TRUE.equals(review.getIsActive())) {
            review.setIsActive(false);
            review = bookReviewRepository.save(review);
        }
        return bookReviewMapper.toDTO(review);
    }

    private void requireAdmin() throws Exception {
        User user = userService.getCurrentUser();
        if (user == null || user.getRole() != UserRole.ROLE_ADMIN) {
            throw new AccessDeniedException("Admin role required for review moderation");
        }
    }

    @Override
    public BookReviewDTO createReview(CreateReviewRequest request) throws Exception {

        // 1. fetch the logged user
        User user = userService.getCurrentUser();

        // 2. validate book exist
        if (request.getBookId() == null) throw new BookReviewException("Book ID is required");
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new BookReviewException("Book not found", org.springframework.http.HttpStatus.NOT_FOUND));

        // 3. check if user has already reviewed the book
        if (bookReviewRepository.existsByUserIdAndBookId(user.getId(), book.getId())) {
            throw new BookReviewException("You have already reviewed this book");
        }

        // 4. check if user has read the book
        boolean hasReadBook = hasUserReadBook(user.getId(), book.getId());

        if (!hasReadBook) {
            throw new BookReviewException("You must complete a loan for this book before reviewing it");
        }

        // 5. create review
        BookReview bookReview = new BookReview();
        bookReview.setUser(user);
        bookReview.setBook(book);
        bookReview.setRating(request.getRating());
        bookReview.setReviewText(request.getReviewText() != null ? request.getReviewText().trim() : "");
        bookReview.setTitle(request.getTitle() != null ? request.getTitle().trim() : "");
        bookReview.setIsActive(true);

        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }

    @Override
    public BookReviewDTO updateReview(Long reviewId, UpdateReviewRequest request) throws Exception {

        // 1. fetch logged user
        User user = userService.getCurrentUser();

        // 2. find the review
        BookReview bookReview = bookReviewRepository.findByIdAndIsActiveTrue(reviewId)
                .orElseThrow(() -> new BookReviewException("Review not found", org.springframework.http.HttpStatus.NOT_FOUND));

        // 2. check if logged user is the owner of the review
        if (!bookReview.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only update your own reviews");
        }

        // 3. update review
        bookReview.setReviewText(request.getReviewText() != null ? request.getReviewText().trim() : "");
        bookReview.setTitle(request.getTitle() != null ? request.getTitle().trim() : "");
        bookReview.setRating(request.getRating());

        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }

    @Override
    public void deleteReview(Long reviewId) throws Exception {
        User currentUser = userService.getCurrentUser();

        // 1. Find the review
        BookReview bookReview = bookReviewRepository.findByIdAndIsActiveTrue(reviewId)
                .orElseThrow(() -> new BookReviewException("Review not found", org.springframework.http.HttpStatus.NOT_FOUND));

        // 2. Check if current user is the owner of the review
        if (!bookReview.getUser().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own reviews");
        }


        bookReview.setIsActive(false);
        bookReviewRepository.save(bookReview);
    }

    @Override
    public PageResponse<BookReviewDTO> getReviewsByBookId(Long id,
                                                          int page,
                                                          int size) throws Exception {

        if (page < 0 || size < 1 || size > 100) {
            throw new BookReviewException("Page must be non-negative and size must be between 1 and 100");
        }

        Book book = bookRepository.findById(id).orElseThrow(
                () -> new BookReviewException("Book not found", org.springframework.http.HttpStatus.NOT_FOUND)
        );

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Page<BookReview> reviewPage = bookReviewRepository.findActiveByBook(book, pageable);

        return convertToPageResponse(reviewPage);
    }

    private PageResponse<BookReviewDTO> convertToPageResponse(Page<BookReview> reviewPage) {

        List<BookReviewDTO> reviewDTOs = reviewPage.getContent()
                .stream()
                .map(bookReviewMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                reviewDTOs,
                reviewPage.getNumber(),
                reviewPage.getSize(),
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages(),
                reviewPage.isLast(),
                reviewPage.isFirst(),
                reviewPage.isEmpty()
        );
    }

    private boolean hasUserReadBook(Long userId, Long bookId) {
        List<BookLoan> bookLoans = bookLoanRepository.findByBookId(bookId);

        return bookLoans.stream()
                .anyMatch(loan -> loan.getUser().getId().equals(userId)
                        && loan.getStatus() == BookLoanStatus.RETURNED);
    }
}
