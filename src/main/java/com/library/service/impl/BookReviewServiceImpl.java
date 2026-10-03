package com.library.service.impl;

import com.library.domain.BookLoanStatus;
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
    public BookReviewDTO createReview(CreateReviewRequest createReviewRequest) throws Exception {

        // 1. fetch the logged user
        User user = userService.getCurrentUser();

        // 2. validate book exist
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new Exception("book not found!"));

        // 3. check if user has already reviewed the book
        if (bookReviewRepository.existsByUserIdAndBookId(user.getId(), book.getId())) {
            throw new Exception("you have already reviewed this book!");
        }

        // 4. check if user has read the book
        boolean hasReadBook = hasUserReadBook(user.getId(), book.getId());

        if (!hasReadBook) {
            throw new Exception("you have not read this book!");
        }

// 5. create review
        BookReview bookReview = new BookReview();
        bookReview.setUser(user);
        bookReview.setBook(book);
        bookReview.setRating(request.getRating());
        bookReview.setReviewText(request.getReviewText());
        bookReview.setTitle(request.getTitle());

        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }

    @Override
    public BookReviewDTO updateReview(Long reviewId, UpdateReviewRequest request) throws Exception {

        // 1. fetch logged user
        User user = userService.getCurrentUser();

        // 2. find the review
        BookReview bookReview = bookReviewRepository.findById(reviewId)
                .orElseThrow(() -> new Exception("review not found!"));

        // 2. check if logged user is the owner of the review
        if (!bookReview.getUser().getId().equals(user.getId())) {
            throw new Exception("you have not reviewed this book!");
        }

        // 3. update review
        bookReview.setReviewText(request.getReviewText());
        bookReview.setTitle(request.getTitle());
        bookReview.setRating(request.getRating());

        BookReview savedBookReview = bookReviewRepository.save(bookReview);

        return bookReviewMapper.toDTO(savedBookReview);
    }

    @Override
    public void deleteReview(Long reviewId) throws Exception {
        User currentUser = userService.getCurrentUser();

        // 1. Find the review
        BookReview bookReview = bookReviewRepository.findById(reviewId)
                .orElseThrow(() -> new Exception("Review not found with id: " + reviewId));

        // 2. Check if current user is the owner of the review
        if (!bookReview.getUser().getId().equals(currentUser.getId())) {
            throw new Exception("You can only delete your own reviews");
        }


        bookReviewRepository.delete(bookReview);
    }

    @Override
    public PageResponse<BookReviewDTO> getReviewsByBookId(Long id,
                                                          int page,
                                                          int size) throws Exception {

        Book book = bookRepository.findById(id).orElseThrow(
                () -> new Exception("book not found by id!")
        );

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Page<BookReview> reviewPage = bookReviewRepository.findByBook(book, pageable);

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
