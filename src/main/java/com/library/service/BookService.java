package com.library.service;

import com.library.exception.BookException;
import com.library.payload.dto.BookDTO;
import com.library.payload.request.BookSearchRequest;
import com.library.payload.response.PageResponse;

import java.util.List;

public interface BookService {

    BookDTO createBook(BookDTO bookDTO) throws BookException;

    List<BookDTO> createBooksBulk(List<BookDTO> bookDTOList) throws BookException;

    BookDTO getBookById(Long bookId) throws BookException;

    BookDTO getBookByISBN(String isbn) throws BookException;

    BookDTO updateBook(Long bookId, BookDTO bookDTO) throws BookException;

    void deleteBook(Long bookId) throws BookException;

    void hardDeleteBook(Long bookId) throws BookException;

    PageResponse<BookDTO> searchBooksWithFilters(
            BookSearchRequest searchRequest
    );

    long getTotalActiveBooks();

    long getTotalAvailableBooks();
}
