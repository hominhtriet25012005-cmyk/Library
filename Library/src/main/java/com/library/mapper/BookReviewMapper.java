package com.library.mapper;

import com.library.model.BookReview;
import com.library.payload.dto.BookReviewDTO;
import org.springframework.stereotype.Component;

@Component
public class BookReviewMapper {

    public BookReviewDTO toDTO(BookReview bookReview) {
        if (bookReview == null) {
            return null;
        }

        String cleanedText = bookReview.getReviewText() != null
                ? bookReview.getReviewText().replaceAll("[\\u200B-\\u200D\\uFEFF]", "").trim()
                : "";

        return BookReviewDTO.builder()
                .id(bookReview.getId())
                .userId(bookReview.getUser().getId())
                .userName(bookReview.getUser().getFullName())
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
