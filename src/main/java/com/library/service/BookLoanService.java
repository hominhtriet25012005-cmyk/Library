package com.library.service;

import com.library.domain.BookLoanStatus;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.request.*;
import com.library.payload.response.PageResponse;

public interface BookLoanService {

    BookLoanDTO checkoutBook(CheckoutRequest checkoutRequest) throws Exception;

    BookLoanDTO checkoutBookForUser(Long userId, CheckoutRequest checkoutRequest) throws Exception;

    BookLoanDTO checkinBook(CheckinRequest checkinRequest) throws Exception;

    BookLoanDTO renewCheckout(RenewRequest renewalRequest) throws Exception;

    PageResponse<BookLoanDTO> getMyBookLoans(BookLoanStatus status,
                                             int page, int size) throws Exception;

    PageResponse<BookLoanDTO> getBookLoans(BookLoanSearchRequest request);

    int updateOverdueBookLoan();
}
