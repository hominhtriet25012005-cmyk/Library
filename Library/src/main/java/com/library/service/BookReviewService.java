package com.library.service;

import com.library.payload.dto.BookReviewDTO;
import com.library.payload.request.CreateReviewRequest;
import com.library.payload.request.UpdateReviewRequest;
import com.library.payload.response.PageResponse;

public interface BookReviewService {

    BookReviewDTO createReview(CreateReviewRequest createReviewRequest) throws Exception;

    BookReviewDTO updateReview(Long reviewId, UpdateReviewRequest request) throws Exception;

    void deleteReview(Long reviewId) throws Exception;

    PageResponse<BookReviewDTO> getReviewsByBookId(Long id, int page, int size) throws Exception;

    PageResponse<BookReviewDTO> searchAdminReviews(Long userId, Long bookId, Boolean active,
                                                    int page, int size) throws Exception;

    BookReviewDTO hideReview(Long reviewId) throws Exception;
}
