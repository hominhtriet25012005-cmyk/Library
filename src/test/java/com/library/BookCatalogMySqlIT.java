package com.library;

import com.library.payload.request.BookSearchRequest;
import com.library.service.BookService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/** Explicit opt-in read-only catalog check against the configured MySQL database. */
@SpringBootTest(properties = {
        "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes",
        "app.jwt.expiration-ms=60000"
})
class BookCatalogMySqlIT {
    @Autowired BookService books;

    @Test
    @Transactional(readOnly = true)
    void catalogFiltersAndDetailMatchPersistedBooks() throws Exception {
        BookSearchRequest available = new BookSearchRequest();
        available.setSize(9);
        available.setAvailableOnly(true);
        var availablePage = books.searchBooksWithFilters(available);
        assertTrue(availablePage.getContent().stream()
                .allMatch(book -> Boolean.TRUE.equals(book.getActive()) && book.getAvailableCopies() > 0));

        BookSearchRequest exhausted = new BookSearchRequest();
        exhausted.setSize(9);
        exhausted.setUnavailableOnly(true);
        var exhaustedPage = books.searchBooksWithFilters(exhausted);
        assertTrue(exhaustedPage.getContent().stream()
                .allMatch(book -> Boolean.TRUE.equals(book.getActive()) && book.getAvailableCopies() == 0));

        if (!availablePage.getContent().isEmpty()) {
            var listed = availablePage.getContent().get(0);
            assertEquals(listed.getId(), books.getBookById(listed.getId()).getId());
        }

        BookSearchRequest hidden = new BookSearchRequest();
        hidden.setActive(false);
        var hiddenPage = books.searchBooksForAdmin(hidden);
        assertTrue(hiddenPage.getContent().stream()
                .allMatch(book -> Boolean.FALSE.equals(book.getActive())));
    }
}
