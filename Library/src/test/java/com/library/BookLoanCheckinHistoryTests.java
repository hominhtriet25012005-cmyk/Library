package com.library;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import com.library.domain.BookDamageLevel;
import com.library.domain.UserRole;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.model.Book;
import com.library.model.BookLoan;
import com.library.model.User;
import com.library.payload.request.CheckinRequest;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.UserRepository;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import com.library.service.impl.BookLoanServiceImpl;
import com.library.service.impl.ReservationLifecycleService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookLoanCheckinHistoryTests {

    private BookLoanRepository loans;
    private BookRepository books;
    private BookLoanServiceImpl subject;
    private ReservationLifecycleService reservationLifecycle;
    private User borrower;
    private Book book;

    @BeforeEach
    void setUp() throws Exception {
        loans = mock(BookLoanRepository.class);
        books = mock(BookRepository.class);
        UserService users = mock(UserService.class);
        borrower = User.builder()
                .id(7L)
                .email("borrower@test.invalid")
                .fullName("Borrower")
                .role(UserRole.ROLE_USER)
                .build();
        book = Book.builder()
                .id(11L)
                .title("Test book")
                .author("Test author")
                .totalCopies(1)
                .availableCopies(0)
                .build();

        User admin = User.builder().id(1L).email("admin@test.invalid")
                .fullName("Admin").role(UserRole.ROLE_ADMIN).build();
        when(users.getCurrentUser()).thenReturn(admin);
        when(loans.save(any(BookLoan.class))).thenAnswer(call -> call.getArgument(0));
        when(books.save(any(Book.class))).thenAnswer(call -> call.getArgument(0));
        reservationLifecycle = mock(ReservationLifecycleService.class);

        subject = new BookLoanServiceImpl(loans, users, mock(SubscriptionService.class),
                books, new BookLoanMapper(), mock(UserRepository.class), reservationLifecycle,
                mock(com.library.repository.FineRepository.class),
                mock(com.library.service.NotificationPublisher.class));
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
    }

    @Test
    void returnedBookRestocksAndPreservesOverdueAndNoteHistory() throws Exception {
        BookLoan loan = activeLoan(BookLoanStatus.OVERDUE, LocalDate.now().minusDays(3),
                1, "Ghi chú lúc mượn");
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));

        CheckinRequest request = request(loan.getId(), BookLoanStatus.RETURNED, "Bìa sách nguyên vẹn");
        subject.checkinBook(request);

        assertAll(
                () -> assertEquals(BookLoanStatus.RETURNED, loan.getStatus()),
                () -> assertEquals(LocalDate.now(), loan.getReturnDate()),
                () -> assertEquals(3, loan.getOverdueDays()),
                () -> assertFalse(loan.getIsOverdue()),
                () -> assertEquals("Ghi chú lúc mượn", loan.getNotes()),
                () -> assertEquals("Bìa sách nguyên vẹn", loan.getInspectionNote()),
                () -> assertEquals(1L, loan.getCheckedInBy().getId()),
                () -> assertNotNull(loan.getCheckedInAt()),
                () -> assertEquals(1, book.getAvailableCopies())
        );
        verify(books).save(book);
        verify(loans).save(loan);
        verify(reservationLifecycle).activateNextPendingForBook(eq(book.getId()), any());
    }

    @ParameterizedTest
    @EnumSource(value = BookLoanStatus.class, names = {"DAMAGED", "LOST"})
    void damagedOrLostBookDoesNotReturnToAvailableInventory(BookLoanStatus condition) throws Exception {
        BookLoan loan = activeLoan(BookLoanStatus.CHECKED_OUT, LocalDate.now().plusDays(2),
                0, "Ghi chú cũ");
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));

        subject.checkinBook(request(loan.getId(), condition, "Biên bản kiểm tra"));

        assertEquals(condition, loan.getStatus());
        assertEquals(0, book.getAvailableCopies());
        assertEquals("Ghi chú cũ", loan.getNotes());
        verify(books, never()).findLockedById(anyLong());
        verify(books, never()).save(any(Book.class));
        verifyNoInteractions(reservationLifecycle);
    }

    @Test
    void checkinNeverReducesPreviouslyRecordedOverdueDays() throws Exception {
        BookLoan loan = activeLoan(BookLoanStatus.OVERDUE, LocalDate.now().minusDays(3),
                5, null);
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));

        subject.checkinBook(request(loan.getId(), BookLoanStatus.RETURNED, null));

        assertEquals(5, loan.getOverdueDays());
        assertNull(loan.getNotes());
    }

    @Test
    void rejectsInspectionNoteOverDatabaseLimitBeforeMutatingLoan() {
        String originalNotes = "Ghi chú lúc mượn";
        BookLoan loan = activeLoan(BookLoanStatus.CHECKED_OUT, LocalDate.now().plusDays(2),
                0, originalNotes);
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));

        BookException error = assertThrows(BookException.class,
                () -> subject.checkinBook(request(loan.getId(), BookLoanStatus.RETURNED, "x".repeat(501))));

        assertEquals("Ghi chú kiểm tra không được vượt quá 500 ký tự.", error.getMessage());
        assertEquals(BookLoanStatus.CHECKED_OUT, loan.getStatus());
        assertNull(loan.getReturnDate());
        assertEquals(originalNotes, loan.getNotes());
        verify(loans, never()).save(any(BookLoan.class));
        verifyNoInteractions(books);
    }

    private BookLoan activeLoan(BookLoanStatus status, LocalDate dueDate, int overdueDays, String notes) {
        return BookLoan.builder()
                .id(19L)
                .user(borrower)
                .book(book)
                .type(BookLoanType.CHECKOUT)
                .status(status)
                .checkoutDate(dueDate.minusDays(7))
                .dueDate(dueDate)
                .renewalCount(0)
                .maxRenewals(2)
                .notes(notes)
                .isOverdue(status == BookLoanStatus.OVERDUE)
                .overdueDays(overdueDays)
                .build();
    }

    private CheckinRequest request(Long loanId, BookLoanStatus condition, String notes) {
        CheckinRequest request = new CheckinRequest();
        request.setBookLoanId(loanId);
        request.setCondition(condition);
        request.setNotes(notes);
        if (condition == BookLoanStatus.DAMAGED) {
            request.setDamageLevel(BookDamageLevel.LIGHT);
        }
        request.setConfirmDefaultReferencePrice(true);
        return request;
    }
}
