package com.library.controller;

import com.library.exception.BookException;
import com.library.payload.dto.BookDTO;
import com.library.payload.request.BookSearchRequest;
import com.library.payload.response.PageResponse;
import com.library.service.BookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/book")
public class AdminBookController {

    private  final BookService bookService;

    @PostMapping("/admin")
    public ResponseEntity<BookDTO> createBook(
            @Valid @RequestBody BookDTO bookDTO) throws BookException {
        BookDTO createdBook = bookService.createBook(bookDTO);
        return ResponseEntity.ok(createdBook);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBook(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bookService.getBookById(id));
        } catch (BookException error) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, error.getMessage(), error);
        }
    }

    @PostMapping("/search")
    public ResponseEntity<PageResponse<BookDTO>> searchBooks(@RequestBody BookSearchRequest request) {
        return ResponseEntity.ok(bookService.searchBooksForAdmin(request));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<BookDTO> setActive(@PathVariable Long id,
                                             @Valid @RequestBody ActiveRequest request)
            throws BookException {
        return ResponseEntity.ok(bookService.setBookActive(id, request.active()));
    }

    public record ActiveRequest(@NotNull Boolean active) {

    }
}
