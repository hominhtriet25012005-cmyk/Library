package com.library.mapper;

import com.library.model.BookLoan;
import com.library.payload.dto.BookLoanDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class BookLoanMapper {

    public BookLoanDTO toDTO(BookLoan bookLoan) {
        if (bookLoan == null) {
            return null;
        }

        BookLoanDTO dto = new BookLoanDTO();
        dto.setId(bookLoan.getId());

        // Thông tin người dùng
        if (bookLoan.getUser() != null) {
            dto.setUserId(bookLoan.getUser().getId());
            dto.setUserName(bookLoan.getUser().getFullName());
            dto.setUserEmail(bookLoan.getUser().getEmail());
        }

        // Thông tin sách
        if (bookLoan.getBook() != null) {
            dto.setBookId(bookLoan.getBook().getId());
            dto.setBookTitle(bookLoan.getBook().getTitle());
            dto.setBookIsbn(bookLoan.getBook().getIsbn());
            dto.setBookAuthor(bookLoan.getBook().getAuthor());
            dto.setBookCoverImage(bookLoan.getBook().getCoverImageUrl());
        }

        // Thông tin cho mượn sách
        dto.setType(bookLoan.getType());
        dto.setStatus(bookLoan.getStatus());
        dto.setCheckoutDate(bookLoan.getCheckoutDate());
        dto.setDueDate(bookLoan.getDueDate());
        dto.setRemainingDays(
                ChronoUnit.DAYS.between(
                        LocalDate.now(),
                        bookLoan.getDueDate()
                )
        );

        dto.setReturnDate(bookLoan.getReturnDate());
        dto.setReturnRequestedAt(bookLoan.getReturnRequestedAt());
        dto.setReturnRequestNote(bookLoan.getReturnRequestNote());
        dto.setReturnPending(bookLoan.isReturnPending());
        dto.setCheckedInAt(bookLoan.getCheckedInAt());
        dto.setCheckedInById(bookLoan.getCheckedInBy() == null
                ? null : bookLoan.getCheckedInBy().getId());
        dto.setInspectionNote(bookLoan.getInspectionNote());
        dto.setRenewalCount(bookLoan.getRenewalCount());
        dto.setMaxRenewals(bookLoan.getMaxRenewals());

        dto.setNotes(bookLoan.getNotes());
        dto.setIsOverdue(bookLoan.getIsOverdue());
        dto.setOverdueDays(bookLoan.getOverdueDays());
        dto.setCreatedAt(bookLoan.getCreatedAt());
        dto.setUpdatedAt(bookLoan.getUpdatedAt());

        return dto;
    }
}
