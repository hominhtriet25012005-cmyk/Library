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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookLoanAdminCheckinTests {

    private BookLoanRepository loans;
    private BookRepository books;
    private UserService users;
    private ReservationLifecycleService reservations;
    private BookLoanServiceImpl subject;
    private User borrower;
    private User admin;
    private Book book;
    private BookLoan loan;

    @BeforeEach
    void setUp() throws Exception {
        loans = mock(BookLoanRepository.class);
        books = mock(BookRepository.class);
        users = mock(UserService.class);
        reservations = mock(ReservationLifecycleService.class);
        borrower = User.builder().id(7L).email("reader@example.com")
                .fullName("Bạn đọc").role(UserRole.ROLE_USER).build();
        admin = User.builder().id(1L).email("admin@example.com")
                .fullName("Quản trị viên").role(UserRole.ROLE_ADMIN).build();
        book = Book.builder().id(9L).title("Sách thử nghiệm").author("Tác giả")
                .price(new java.math.BigDecimal("100000"))
                .totalCopies(4).availableCopies(3).build();
        loan = BookLoan.builder().id(11L).user(borrower).book(book)
                .type(BookLoanType.CHECKOUT).status(BookLoanStatus.CHECKED_OUT)
                .checkoutDate(LocalDate.now().minusDays(5))
                .dueDate(LocalDate.now().plusDays(2))
                .returnRequestedAt(LocalDateTime.now().minusDays(2))
                .renewalCount(0).maxRenewals(2).isOverdue(false).overdueDays(0).build();

        subject = new BookLoanServiceImpl(loans, users, mock(SubscriptionService.class),
                books, new BookLoanMapper(), mock(UserRepository.class), reservations,
                mock(com.library.repository.FineRepository.class));
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
        when(users.getCurrentUser()).thenReturn(admin);
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));
        when(loans.save(any(BookLoan.class))).thenAnswer(call -> call.getArgument(0));
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));
        when(books.save(any(Book.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void onlyAdminCanPerformFinalCheckin() throws Exception {
        when(users.getCurrentUser()).thenReturn(borrower);

        assertThrows(AccessDeniedException.class,
                () -> subject.checkinBook(request(BookLoanStatus.RETURNED, null, null)));

        assertEquals(BookLoanStatus.CHECKED_OUT, loan.getStatus());
        assertNull(loan.getReturnDate());
        assertEquals(3, book.getAvailableCopies());
        verify(loans, never()).save(any());
    }

    @Test
    void normalCheckinRecordsAdminAndRestocksExactlyOneCopy() throws Exception {
        LocalDate receivedDate = LocalDate.now().minusDays(1);

        var result = subject.checkinBook(request(
                BookLoanStatus.RETURNED, receivedDate, "Bìa và ruột sách nguyên vẹn"));

        assertAll(
                () -> assertEquals(BookLoanStatus.RETURNED, result.getStatus()),
                () -> assertEquals(receivedDate, result.getReturnDate()),
                () -> assertNotNull(result.getCheckedInAt()),
                () -> assertEquals(admin.getId(), result.getCheckedInById()),
                () -> assertEquals("Bìa và ruột sách nguyên vẹn", result.getInspectionNote()),
                () -> assertFalse(result.getReturnPending()),
                () -> assertEquals(4, book.getAvailableCopies())
        );
        verify(reservations).activateNextPendingForBook(eq(book.getId()), any(LocalDateTime.class));
    }

    @ParameterizedTest
    @EnumSource(value = BookLoanStatus.class, names = {"DAMAGED", "LOST"})
    void damagedOrLostCheckinClosesLoanWithoutRestocking(BookLoanStatus condition) throws Exception {
        int before = book.getAvailableCopies();

        var result = subject.checkinBook(request(condition, LocalDate.now(), "Biên bản kiểm tra tại quầy"));

        assertEquals(condition, result.getStatus());
        assertEquals(before, book.getAvailableCopies());
        assertEquals(admin.getId(), result.getCheckedInById());
        assertNotNull(result.getCheckedInAt());
        verify(books, never()).save(any());
        verifyNoInteractions(reservations);
    }

    @ParameterizedTest
    @EnumSource(value = BookLoanStatus.class, names = {"DAMAGED", "LOST"})
    void damagedOrLostRequiresInspectionNote(BookLoanStatus condition) {
        BookException error = assertThrows(BookException.class,
                () -> subject.checkinBook(request(condition, LocalDate.now(), "   ")));

        assertTrue(error.getMessage().contains("Ghi chú kiểm tra"));
        assertEquals(BookLoanStatus.CHECKED_OUT, loan.getStatus());
        verify(loans, never()).save(any());
    }

    @Test
    void repeatedCheckinIsIdempotentAndDoesNotRestockTwice() throws Exception {
        CheckinRequest first = request(BookLoanStatus.RETURNED, LocalDate.now(), "Đã nhận đủ sách");
        subject.checkinBook(first);
        int afterFirst = book.getAvailableCopies();

        var repeated = subject.checkinBook(first);

        assertEquals(afterFirst, book.getAvailableCopies());
        assertEquals(BookLoanStatus.RETURNED, repeated.getStatus());
        verify(books, times(1)).save(book);
        verify(loans, times(1)).save(loan);
        verify(reservations, times(1))
                .activateNextPendingForBook(eq(book.getId()), any(LocalDateTime.class));
    }

    @Test
    void rejectsReceivedDateBeforeCheckoutOrInFuture() {
        assertThrows(BookException.class, () -> subject.checkinBook(request(
                BookLoanStatus.RETURNED, loan.getCheckoutDate().minusDays(1), null)));
        assertThrows(BookException.class, () -> subject.checkinBook(request(
                BookLoanStatus.RETURNED, LocalDate.now().plusDays(1), null)));
        verify(loans, never()).save(any());
    }

    @Test
    void rejectsReceivedDateBeforeTheUsersReturnRequest() {
        loan.setReturnRequestedAt(LocalDate.now().atStartOfDay());

        BookException error = assertThrows(BookException.class, () -> subject.checkinBook(request(
                BookLoanStatus.RETURNED, LocalDate.now().minusDays(1), null)));

        assertTrue(error.getMessage().contains("yêu cầu trả"));
        verify(loans, never()).save(any());
    }

    @Test
    void directCounterCheckinMayUseCheckoutDateWhenThereIsNoReturnRequest() throws Exception {
        loan.setReturnRequestedAt(null);

        var result = subject.checkinBook(request(
                BookLoanStatus.RETURNED, loan.getCheckoutDate(), null));

        assertEquals(loan.getCheckoutDate(), result.getReturnDate());
        verify(loans).save(loan);
    }

    private CheckinRequest request(BookLoanStatus condition, LocalDate receivedDate, String inspectionNote) {
        CheckinRequest request = new CheckinRequest();
        request.setBookLoanId(loan.getId());
        request.setCondition(condition);
        request.setReceivedDate(receivedDate);
        request.setInspectionNote(inspectionNote);
        if (condition == BookLoanStatus.DAMAGED) {
            request.setDamageLevel(BookDamageLevel.LIGHT);
        }
        return request;
    }
}
