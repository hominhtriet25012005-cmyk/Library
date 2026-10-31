package com.library.service.impl;

import com.library.exception.BookException;
import com.library.exception.BookInUseException;
import com.library.mapper.BookMapper;
import com.library.modal.Book;
import com.library.payload.dto.BookDTO;
import com.library.payload.request.BookSearchRequest;
import com.library.payload.response.PageResponse;
import com.library.repository.BookRepository;
import com.library.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    @Override
    public BookDTO createBook(BookDTO bookDTO) throws BookException {

        validatePublicationInput(bookDTO);
        String normalizedIsbn = normalizeIsbn(bookDTO.getIsbn());
        bookDTO.setIsbn(normalizedIsbn);

        if (normalizedIsbn != null && bookRepository.existsByIsbn(normalizedIsbn)) {
            throw new BookException("Sách có mã ISBN " + normalizedIsbn + " đã tồn tại");
        }
        Book book= bookMapper.toEntity(bookDTO);

//        total - 10
//        available - 11

        if (book.getTotalCopies() == null || book.getAvailableCopies() == null
                || book.getTotalCopies() < 0 || book.getAvailableCopies() < 0
                || !book.isAvailableCopesValid()) {
            throw new BookException("Số bản còn sẵn phải nằm trong khoảng 0 đến tổng số bản");
        }

        // A newly cataloged book has not yet been checked out, so all copies start available.
        book.setAvailableCopies(book.getTotalCopies());

         Book savedBook = bookRepository.save(book);

        return bookMapper.toDTO(savedBook);
    }

    @Override
    public List<BookDTO> createBooksBulk(List<BookDTO> bookDTOs) throws BookException {

        List<BookDTO> createdBooks=new ArrayList<>();
        for(BookDTO bookDTO:bookDTOs){
            BookDTO book=createBook(bookDTO);
            createdBooks.add(book);
        }
        return createdBooks;
    }

    @Override
    public BookDTO getBookById(Long bookId) throws BookException {
        Book book= bookRepository.findById(bookId)
                .orElseThrow(()-> new BookException("Không tìm thấy sách!"));
        return bookMapper.toDTO(book);
    }

    @Override
    public BookDTO getBookByISBN(String isbn) throws BookException {
        Book book= bookRepository.findByIsbn(isbn)
                .orElseThrow(()-> new BookException("Không tìm thấy sách!"));
        return bookMapper.toDTO(book);
    }

    @Override
    @Transactional(rollbackFor = BookException.class)
    public BookDTO updateBook(Long bookId, BookDTO bookDTO) throws BookException {
        validatePublicationInput(bookDTO);
        String requestedIsbn = normalizeIsbn(bookDTO.getIsbn());
        bookDTO.setIsbn(requestedIsbn);
        Book existingBook = bookRepository.findLockedById(bookId).orElseThrow(
                () -> new BookException("Không tìm thấy sách!")
        );
        applyIsbnUpdate(existingBook, requestedIsbn);
        if (bookDTO.getTotalCopies() == null || bookDTO.getTotalCopies() < 0) {
            throw new BookException("Tổng số bản phải là số không âm");
        }
        int unavailableCopies = existingBook.getTotalCopies() - existingBook.getAvailableCopies();
        if (bookDTO.getTotalCopies() < unavailableCopies) {
            throw new BookException("Tổng số bản mới không thể nhỏ hơn số bản đang không sẵn");
        }
        bookMapper.updateEntityFromDTO(bookDTO, existingBook);
        existingBook.setAvailableCopies(bookDTO.getTotalCopies() - unavailableCopies);
        if (!existingBook.isAvailableCopesValid()) {
            throw new BookException("Số bản còn sẵn không thể vượt tổng số bản");
        }
        Book savedBook = bookRepository.save(existingBook);
        return bookMapper.toDTO(savedBook);
    }

    private void validatePublicationInput(BookDTO bookDTO) throws BookException {
        if (bookDTO.getPublicationDate() != null && bookDTO.getPublicationYear() != null) {
            throw new BookException("Chỉ nhập ngày xuất bản đầy đủ hoặc năm xuất bản, không nhập đồng thời cả hai.");
        }
        Integer year = bookDTO.getPublicationYear();
        if (year != null && (year < 1 || year > 9999)) {
            throw new BookException("Năm xuất bản phải từ 1 đến 9999.");
        }
    }

    private String normalizeIsbn(String isbn) {
        if (isbn == null) {
            return null;
        }
        String normalized = isbn.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void applyIsbnUpdate(Book existingBook, String requestedIsbn) throws BookException {
        String currentIsbn = normalizeIsbn(existingBook.getIsbn());
        if (currentIsbn != null) {
            if (requestedIsbn != null && !currentIsbn.equals(requestedIsbn)) {
                throw new BookException("ISBN đã được ghi nhận và không thể thay đổi.");
            }
            return;
        }
        if (requestedIsbn == null) {
            return;
        }
        if (bookRepository.existsByIsbn(requestedIsbn)) {
            throw new BookException("Sách có mã ISBN " + requestedIsbn + " đã tồn tại");
        }
        existingBook.setIsbn(requestedIsbn);
    }

    @Override
    @Transactional(rollbackFor = BookException.class)
    public void deleteBook(Long bookId) throws BookException {
        setBookActive(bookId, false);
    }

    @Override
    @Transactional(rollbackFor = BookException.class)
    public BookDTO setBookActive(Long bookId, boolean active) throws BookException {
        Book existingBook = bookRepository.findLockedById(bookId).orElseThrow(
                () -> new BookException("Không tìm thấy sách!")
        );
        existingBook.setActive(active);
        return bookMapper.toDTO(bookRepository.save(existingBook));
    }

    @Override
    @Transactional(rollbackFor = BookException.class)
    public void hardDeleteBook(Long bookId) throws BookException {
        Book existingBook = bookRepository.findById(bookId).orElseThrow(
                () -> new BookException("Không tìm thấy sách!")
        );

        try {
            bookRepository.delete(existingBook);
            bookRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new BookInUseException(
                    "Không thể xóa sách vì đã có dữ liệu mượn, đặt giữ, đánh giá hoặc yêu thích liên kết. "
                            + "Hãy giữ sách trong hệ thống để bảo toàn lịch sử.");
        }
    }

    @Override
    public PageResponse<BookDTO> searchBooksWithFilters(BookSearchRequest searchRequest) {
        if (searchRequest == null) {
            searchRequest = new BookSearchRequest();
        }
        Pageable pageable = createPageable(
                searchRequest.getPage() == null ? 0 : searchRequest.getPage(),
                searchRequest.getSize() == null ? 20 : searchRequest.getSize(),
                searchRequest.getSortBy() == null || searchRequest.getSortBy().isBlank()
                        ? "createdAt" : searchRequest.getSortBy(),
                searchRequest.getSortDirection() == null || searchRequest.getSortDirection().isBlank()
                        ? "DESC" : searchRequest.getSortDirection());
        Page<Book> bookPage = bookRepository.searchBooksWithFilters(
                searchRequest.getSearchTerm(),
                searchRequest.getGenreId(),
                Boolean.TRUE.equals(searchRequest.getAvailableOnly()),
                Boolean.TRUE.equals(searchRequest.getUnavailableOnly()),
                pageable
        );
        return convertToPageResponse(bookPage);
    }

    @Override
    public PageResponse<BookDTO> searchBooksForAdmin(BookSearchRequest searchRequest) {
        if (searchRequest == null) {
            searchRequest = new BookSearchRequest();
        }
        Pageable pageable = createPageable(
                searchRequest.getPage() == null ? 0 : searchRequest.getPage(),
                searchRequest.getSize() == null ? 20 : searchRequest.getSize(),
                searchRequest.getSortBy() == null || searchRequest.getSortBy().isBlank()
                        ? "createdAt" : searchRequest.getSortBy(),
                searchRequest.getSortDirection() == null || searchRequest.getSortDirection().isBlank()
                        ? "DESC" : searchRequest.getSortDirection());
        return convertToPageResponse(bookRepository.searchBooksForAdmin(
                searchRequest.getSearchTerm(), searchRequest.getGenreId(),
                Boolean.TRUE.equals(searchRequest.getAvailableOnly()),
                Boolean.TRUE.equals(searchRequest.getUnavailableOnly()),
                searchRequest.getActive(), pageable));
    }

    @Override
    public long getTotalActiveBooks() {

        return bookRepository.countByActiveTrue();
    }

    @Override
    public long getTotalAvailableBooks() {

        return bookRepository.countAvailableBooks();
    }

    private Pageable createPageable(int page, int size, String sortBy, String sortDirection){
        size=Math.min(size,10);
        size=Math.max(size, 1);

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending():Sort.by(sortBy).descending();
        return PageRequest.of(page, size, sort);
    }

    private PageResponse<BookDTO> convertToPageResponse(Page<Book> books){
        List<BookDTO> bookDTOS=books.getContent()
                .stream()
                .map(bookMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(bookDTOS,
                books.getNumber(),
                books.getSize(),
                books.getTotalElements(),
                books.getTotalPages(),
                books.isLast(),
                books.isFirst(),
                books.isEmpty()
        );
    }
}
