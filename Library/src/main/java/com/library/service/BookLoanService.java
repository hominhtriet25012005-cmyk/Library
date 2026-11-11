package com.library.service;

import com.library.domain.BookLoanStatus;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.request.*;
import com.library.payload.response.PageResponse;
import com.library.payload.response.CheckinFinePreviewResponse;

public interface BookLoanService {

    BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest) throws Exception;

    BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception;

    BookLoanDTO checkoutReservedBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception;

    BookLoanDTO checkinBook(CheckinRequest checkinRequest) throws Exception;

    CheckinFinePreviewResponse previewCheckinFines(CheckinRequest checkinRequest) throws Exception;

    BookLoanDTO requestReturn(Long bookLoanId, ReturnBookRequest request) throws Exception;

    BookLoanDTO renewCheckout(RenewRequest renewalRequest) throws Exception;

    PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status,
                                             int page, int size) throws Exception;

    PageResponse<BookLoanDTO> getBookLoans(BookLoanSearchRequest request);

    PageResponse<BookLoanDTO> getPendingReturnRequests(int page, int size) throws Exception;

    int updateOverdueBookLoan();
}
