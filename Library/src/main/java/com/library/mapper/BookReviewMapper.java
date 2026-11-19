package com.library.mapper;

import com.library.model.BookReview;
import com.library.payload.dto.BookReviewDTO;
import org.springframework.stereotype.Component;

@Component
public class BookReviewMapper {

    public BookReviewDTO toDTO(BookReview bookReview) {
        return toDTO(bookReview, false, null);
    }

    public BookReviewDTO toDTO(BookReview bookReview, boolean adminView, Long viewerId) {
        if (bookReview == null) {
            return null;
        }

        String cleanedText = bookReview.getReviewText() != null
                ? bookReview.getReviewText().replaceAll("[\\u200B-\\u200D\\uFEFF]", "")
                        .replaceAll("^[\\p{Z}\\s]+|[\\p{Z}\\s]+$", "")
                : null;
        if (cleanedText != null && cleanedText.isEmpty()) {
            cleanedText = null;
        }

        return BookReviewDTO.builder()
                .id(bookReview.getId())
                .userId(Boolean.TRUE.equals(bookReview.getAnonymous()) && !adminView ? null : bookReview.getUser().getId())
                .userName(Boolean.TRUE.equals(bookReview.getAnonymous()) && !adminView
                        ? "Độc giả ẩn danh" : bookReview.getUser().getFullName())
                .anonymous(Boolean.TRUE.equals(bookReview.getAnonymous()))
                .ownedByCurrentUser(viewerId != null && viewerId.equals(bookReview.getUser().getId()))
                .bookId(bookReview.getBook().getId())
                .bookTitle(bookReview.getBook().getTitle())
                .rating(bookReview.getRating())
                .reviewText(cleanedText)
                .title(bookReview.getTitle())
                .isActive(bookReview.getIsActive())
                .createdAt(bookReview.getCreatedAt())
                .updatedAt(bookReview.getUpdatedAt())
                .build();
    }
}
