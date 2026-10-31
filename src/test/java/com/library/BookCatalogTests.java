package com.library;

import com.library.controller.BookController;
import com.library.controller.AdminBookController;
import com.library.exception.BookException;
import com.library.exception.BookInUseException;
import com.library.exception.GlobalException;
import com.library.mapper.BookMapper;
import com.library.modal.Book;
import com.library.payload.dto.BookDTO;
import com.library.payload.request.BookSearchRequest;
import com.library.repository.BookRepository;
import com.library.service.BookService;
import com.library.service.impl.BookServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookCatalogTests {
    @Test void detailReturnsOnlyActiveBooks() throws Exception {
        BookService service = mock(BookService.class);
        BookController controller = new BookController(service);
        BookDTO active = BookDTO.builder().id(7L).active(true).build();
        when(service.getBookById(7L)).thenReturn(active);
        assertSame(active, controller.getBook(7L).getBody());

        when(service.getBookById(8L)).thenReturn(BookDTO.builder().id(8L).active(false).build());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> controller.getBook(8L)).getStatusCode());

        when(service.getBookById(9L)).thenThrow(new BookException("Không tìm thấy sách!"));
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> controller.getBook(9L)).getStatusCode());
    }

    @Test void exhaustedFilterIsAppliedBeforePagination() {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        when(repository.searchBooksWithFilters(eq("Java"), eq(10L), eq(false), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<Book>(List.of()));
        BookServiceImpl service = new BookServiceImpl(repository, mapper);
        BookSearchRequest request = new BookSearchRequest();
        request.setSearchTerm("Java");
        request.setGenreId(10L);
        request.setUnavailableOnly(true);
        request.setSize(9);
        service.searchBooksWithFilters(request);
        verify(repository).searchBooksWithFilters(eq("Java"), eq(10L), eq(false), eq(true),
                argThat(pageable -> pageable.getPageSize() == 9));
    }

    @Test void adminCanReadInactiveBookWithoutChangingPublicDetail() throws Exception {
        BookService service = mock(BookService.class);
        AdminBookController admin = new AdminBookController(service);
        BookDTO hidden = BookDTO.builder().id(12L).active(false).build();
        when(service.getBookById(12L)).thenReturn(hidden);

        assertSame(hidden, admin.getBook(12L).getBody());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class,
                        () -> new BookController(service).getBook(12L)).getStatusCode());
        when(service.getBookById(13L)).thenThrow(new BookException("Không tìm thấy sách!"));
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class,
                        () -> admin.getBook(13L)).getStatusCode());
    }

    @Test void adminSearchCanIncludeInactiveBooks() {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        when(repository.searchBooksForAdmin(eq("Java"), eq(null), eq(false), eq(false), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<Book>(List.of()));
        BookServiceImpl service = new BookServiceImpl(repository, mapper);
        BookSearchRequest request = new BookSearchRequest();
        request.setSearchTerm("Java");
        request.setActive(false);

        service.searchBooksForAdmin(request);
        verify(repository).searchBooksForAdmin(eq("Java"), eq(null), eq(false), eq(false), eq(false),
                argThat(pageable -> pageable.getPageSize() == 10));
    }

    @Test void totalCopyEditPreservesUnavailableCopies() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        Book book = Book.builder().id(5L).totalCopies(10).availableCopies(7).active(true).build();
        when(repository.findLockedById(5L)).thenReturn(Optional.of(book));
        when(repository.save(book)).thenReturn(book);
        doAnswer(call -> {
            BookDTO source = call.getArgument(0);
            Book target = call.getArgument(1);
            target.setTotalCopies(source.getTotalCopies());
            target.setAvailableCopies(source.getAvailableCopies());
            return null;
        }).when(mapper).updateEntityFromDTO(any(BookDTO.class), eq(book));
        when(mapper.toDTO(book)).thenAnswer(call -> BookDTO.builder()
                .totalCopies(book.getTotalCopies()).availableCopies(book.getAvailableCopies()).build());
        BookDTO input = BookDTO.builder().totalCopies(12).availableCopies(1).build();

        BookDTO result = new BookServiceImpl(repository, mapper).updateBook(5L, input);
        assertEquals(12, result.getTotalCopies());
        assertEquals(9, result.getAvailableCopies());
        verify(repository).findLockedById(5L);
    }

    @Test void totalCannotFallBelowUnavailableCopies() {
        BookRepository repository = mock(BookRepository.class);
        Book book = Book.builder().id(5L).totalCopies(10).availableCopies(7).build();
        when(repository.findLockedById(5L)).thenReturn(Optional.of(book));
        BookDTO input = BookDTO.builder().totalCopies(2).availableCopies(2).build();

        assertThrows(BookException.class,
                () -> new BookServiceImpl(repository, mock(BookMapper.class)).updateBook(5L, input));
        verify(repository, never()).save(any());
    }

    @Test void reducingTotalCopiesReducesAvailableCopiesByTheSameAmount() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        Book book = Book.builder().id(5L).totalCopies(10).availableCopies(7).build();
        when(repository.findLockedById(5L)).thenReturn(Optional.of(book));
        when(repository.save(book)).thenReturn(book);
        doAnswer(call -> {
            BookDTO source = call.getArgument(0);
            Book target = call.getArgument(1);
            target.setTotalCopies(source.getTotalCopies());
            target.setAvailableCopies(source.getAvailableCopies());
            return null;
        }).when(mapper).updateEntityFromDTO(any(BookDTO.class), eq(book));
        when(mapper.toDTO(book)).thenAnswer(call -> BookDTO.builder()
                .totalCopies(book.getTotalCopies()).availableCopies(book.getAvailableCopies()).build());

        BookDTO result = new BookServiceImpl(repository, mapper).updateBook(
                5L, BookDTO.builder().totalCopies(8).availableCopies(7).build());

        assertEquals(8, result.getTotalCopies());
        assertEquals(5, result.getAvailableCopies());
        verify(repository).save(book);
    }

    @Test void createRejectsAvailableCopiesAboveTotal() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        BookDTO input = BookDTO.builder().isbn("TEST-ISBN").totalCopies(2).availableCopies(3).build();
        when(mapper.toEntity(input)).thenReturn(Book.builder().totalCopies(2).availableCopies(3).build());
        assertThrows(BookException.class, () -> new BookServiceImpl(repository, mapper).createBook(input));
        verify(repository, never()).save(any());
    }

    @Test void newBookStartsWithEveryCopyAvailable() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        BookDTO input = BookDTO.builder().isbn("TEST-ISBN").totalCopies(5).availableCopies(2).build();
        Book book = Book.builder().totalCopies(5).availableCopies(2).build();
        when(mapper.toEntity(input)).thenReturn(book);
        when(repository.save(book)).thenReturn(book);
        when(mapper.toDTO(book)).thenAnswer(call -> BookDTO.builder()
                .totalCopies(book.getTotalCopies()).availableCopies(book.getAvailableCopies()).build());

        BookDTO created = new BookServiceImpl(repository, mapper).createBook(input);

        assertEquals(5, created.getTotalCopies());
        assertEquals(5, created.getAvailableCopies());
        verify(repository).save(book);
    }

    @Test void createRejectsNegativeTotalCopies() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        BookDTO input = BookDTO.builder().isbn("TEST-ISBN").totalCopies(-1).availableCopies(-1).build();
        when(mapper.toEntity(input)).thenReturn(Book.builder().totalCopies(-1).availableCopies(-1).build());

        assertThrows(BookException.class, () -> new BookServiceImpl(repository, mapper).createBook(input));
        verify(repository, never()).save(any());
    }

    @Test void createAllowsBookWithoutIsbnAndNormalizesBlankValue() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        BookDTO input = BookDTO.builder().isbn("   ").totalCopies(2).availableCopies(2).build();
        Book book = Book.builder().totalCopies(2).availableCopies(2).build();
        when(mapper.toEntity(input)).thenReturn(book);
        when(repository.save(book)).thenReturn(book);
        when(mapper.toDTO(book)).thenReturn(BookDTO.builder().isbn(null).build());

        BookDTO created = new BookServiceImpl(repository, mapper).createBook(input);

        assertNull(input.getIsbn());
        assertNull(created.getIsbn());
        verify(repository, never()).existsByIsbn(any());
        verify(repository).save(book);
    }

    @Test void createTrimsIsbnBeforeCheckingForDuplicates() {
        BookRepository repository = mock(BookRepository.class);
        BookDTO input = BookDTO.builder().isbn("  978-604-1  ")
                .totalCopies(1).availableCopies(1).build();
        when(repository.existsByIsbn("978-604-1")).thenReturn(true);

        BookException exception = assertThrows(BookException.class,
                () -> new BookServiceImpl(repository, mock(BookMapper.class)).createBook(input));

        assertTrue(exception.getMessage().contains("978-604-1"));
        assertEquals("978-604-1", input.getIsbn());
        verify(repository, never()).save(any());
    }

    @Test void updateCanAssignIsbnWhenBookDoesNotHaveOneYet() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        BookMapper mapper = mock(BookMapper.class);
        Book book = Book.builder().id(5L).isbn(null).totalCopies(2).availableCopies(2).build();
        BookDTO input = BookDTO.builder().isbn("  978-604-2  ")
                .totalCopies(2).availableCopies(2).build();
        when(repository.findLockedById(5L)).thenReturn(Optional.of(book));
        when(repository.save(book)).thenReturn(book);
        when(mapper.toDTO(book)).thenAnswer(call -> BookDTO.builder().isbn(book.getIsbn()).build());

        BookDTO updated = new BookServiceImpl(repository, mapper).updateBook(5L, input);

        assertEquals("978-604-2", updated.getIsbn());
        verify(repository).existsByIsbn("978-604-2");
        verify(repository).save(book);
    }

    @Test void updateRejectsChangingAnExistingIsbn() {
        BookRepository repository = mock(BookRepository.class);
        Book book = Book.builder().id(5L).isbn("978-604-OLD")
                .totalCopies(2).availableCopies(2).build();
        when(repository.findLockedById(5L)).thenReturn(Optional.of(book));
        BookDTO input = BookDTO.builder().isbn("978-604-NEW")
                .totalCopies(2).availableCopies(2).build();

        BookException exception = assertThrows(BookException.class,
                () -> new BookServiceImpl(repository, mock(BookMapper.class)).updateBook(5L, input));

        assertTrue(exception.getMessage().contains("không thể thay đổi"));
        verify(repository, never()).save(any());
    }

    @Test void hardDeleteRemovesBookWhenNoRecordReferencesIt() throws Exception {
        BookRepository repository = mock(BookRepository.class);
        Book book = Book.builder().id(21L).build();
        when(repository.findById(21L)).thenReturn(Optional.of(book));

        new BookServiceImpl(repository, mock(BookMapper.class)).hardDeleteBook(21L);

        verify(repository).delete(book);
        verify(repository).flush();
    }

    @Test void hardDeleteExplainsWhenLinkedHistoryPreventsDeletion() {
        BookRepository repository = mock(BookRepository.class);
        Book book = Book.builder().id(21L).build();
        when(repository.findById(21L)).thenReturn(Optional.of(book));
        doThrow(new DataIntegrityViolationException("foreign key constraint"))
                .when(repository).flush();

        BookException exception = assertThrows(BookException.class,
                () -> new BookServiceImpl(repository, mock(BookMapper.class)).hardDeleteBook(21L));

        assertTrue(exception.getMessage().contains("mượn, đặt giữ, đánh giá hoặc yêu thích"));
    }

    @Test void linkedBookDeleteReturnsConflictStatus() {
        var response = new GlobalException().handleBookInUseException(
                new BookInUseException("Không thể xóa sách đang được tham chiếu."));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertFalse(response.getBody().getStatus());
    }
}
