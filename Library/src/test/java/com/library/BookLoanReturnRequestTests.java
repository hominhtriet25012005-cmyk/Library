package com.library;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import com.library.domain.UserRole;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.model.Book;
import com.library.model.BookLoan;
import com.library.model.User;
import com.library.payload.request.RenewRequest;
import com.library.payload.request.ReturnBookRequest;
import com.library.payload.dto.SubscriptionDTO;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookLoanReturnRequestTests {

    private BookLoanRepository loans;
    private BookRepository books;
    private UserService users;
    private SubscriptionService subscriptions;
    private EntityManager entityManager;
    private BookLoanServiceImpl subject;
    private User borrower;
    private Book book;
    private BookLoan loan;

    @BeforeEach
    void setUp() throws Exception {
        loans = mock(BookLoanRepository.class);
        books = mock(BookRepository.class);
        users = mock(UserService.class);
        subscriptions = mock(SubscriptionService.class);
        entityManager = mock(EntityManager.class);

        borrower = User.builder().id(7L).email("reader@example.com")
                .fullName("Bạn đọc").role(UserRole.ROLE_USER).build();
        book = Book.builder().id(9L).title("Sách thử nghiệm").author("Tác giả")
                .totalCopies(4).availableCopies(3).build();
        loan = BookLoan.builder().id(11L).user(borrower).book(book)
                .type(BookLoanType.CHECKOUT).status(BookLoanStatus.CHECKED_OUT)
                .checkoutDate(LocalDate.now().minusDays(3))
                .dueDate(LocalDate.now().plusDays(4)).renewalCount(0).maxRenewals(2)
                .isOverdue(false).overdueDays(0).build();

        subject = new BookLoanServiceImpl(loans, users, subscriptions,
                books, new BookLoanMapper(), mock(UserRepository.class),
                mock(ReservationLifecycleService.class),
                mock(com.library.repository.FineRepository.class),
                mock(com.library.service.NotificationPublisher.class));
        org.springframework.test.util.ReflectionTestUtils.setField(subject, "entityManager", entityManager);

        when(users.getCurrentUser()).thenReturn(borrower);
        when(loans.findLockedById(11L)).thenReturn(Optional.of(loan));
        when(loans.save(any(BookLoan.class))).thenAnswer(call -> call.getArgument(0));
        SubscriptionDTO membership = new SubscriptionDTO();
        membership.setMaxDaysPerBook(30);
        when(subscriptions.getUsersActiveSubscription(borrower.getId())).thenReturn(membership);
    }

    @Test
    void returnRequestOnlyRecordsPendingMetadataAndPreservesLoanAndInventory() throws Exception {
        ReturnBookRequest request = new ReturnBookRequest();
        request.setNote("  Sẽ mang sách đến quầy chiều nay.  ");
        int availableBefore = book.getAvailableCopies();

        var result = subject.requestReturn(loan.getId(), request);

        assertNotNull(result.getReturnRequestedAt());
        assertEquals("Sẽ mang sách đến quầy chiều nay.", result.getReturnRequestNote());
        assertTrue(result.getReturnPending());
        assertEquals(BookLoanStatus.CHECKED_OUT, loan.getStatus());
        assertNull(loan.getReturnDate());
        assertEquals(availableBefore, book.getAvailableCopies());
        verify(books, never()).save(any());
        verify(loans).save(loan);
    }

    @Test
    void repeatedReturnRequestIsIdempotentAndDoesNotOverwriteFirstRequest() throws Exception {
        LocalDateTime firstRequestedAt = LocalDateTime.now().minusMinutes(2);
        loan.setReturnRequestedAt(firstRequestedAt);
        loan.setReturnRequestNote("Ghi chú đầu tiên");
        ReturnBookRequest repeated = new ReturnBookRequest();
        repeated.setNote("Ghi chú bấm lặp");

        var result = subject.requestReturn(loan.getId(), repeated);

        assertEquals(firstRequestedAt, result.getReturnRequestedAt());
        assertEquals("Ghi chú đầu tiên", result.getReturnRequestNote());
        verify(loans, never()).save(any());
        verify(books, never()).save(any());
    }

    @Test
    void anotherUserAndAdminCannotSubmitAReadersReturnRequest() throws Exception {
        User other = User.builder().id(8L).role(UserRole.ROLE_USER).build();
        when(users.getCurrentUser()).thenReturn(other);
        assertThrows(AccessDeniedException.class,
                () -> subject.requestReturn(loan.getId(), new ReturnBookRequest()));

        when(users.getCurrentUser()).thenReturn(
                User.builder().id(1L).role(UserRole.ROLE_ADMIN).build());
        assertThrows(AccessDeniedException.class,
                () -> subject.requestReturn(loan.getId(), new ReturnBookRequest()));
        verify(loans, never()).save(any());
    }

    @Test
    void finalLoanCannotReceiveReturnRequest() {
        loan.setStatus(BookLoanStatus.RETURNED);
        assertThrows(BookException.class,
                () -> subject.requestReturn(loan.getId(), new ReturnBookRequest()));
        verify(loans, never()).save(any());
    }

    @Test
    void pendingReturnRequestBlocksRenewal() {
        loan.setReturnRequestedAt(LocalDateTime.now());
        RenewRequest request = new RenewRequest();
        request.setBookLoanId(loan.getId());
        request.setExtensionDays(1);

        BookException error = assertThrows(BookException.class,
                () -> subject.renewCheckout(request));

        assertTrue(error.getMessage().contains("yêu cầu trả"));
        assertEquals(0, loan.getRenewalCount());
        verify(loans, never()).save(any());
    }

    @Test
    void renewalCannotExceedFourteenDaysEvenWhenPlanAllowsMore() {
        RenewRequest request = new RenewRequest();
        request.setBookLoanId(loan.getId());
        request.setExtensionDays(15);

        BookException error = assertThrows(BookException.class,
                () -> subject.renewCheckout(request));

        assertTrue(error.getMessage().contains("14"));
        assertEquals(0, loan.getRenewalCount());
        verify(loans, never()).save(any());
    }

    @Test
    void renewalUsesLowerPlanLimitWhenPlanAllowsLessThanFourteenDays() throws Exception {
        SubscriptionDTO membership = new SubscriptionDTO();
        membership.setMaxDaysPerBook(7);
        when(subscriptions.getUsersActiveSubscription(borrower.getId())).thenReturn(membership);
        RenewRequest request = new RenewRequest();
        request.setBookLoanId(loan.getId());
        request.setExtensionDays(8);

        BookException error = assertThrows(BookException.class,
                () -> subject.renewCheckout(request));

        assertTrue(error.getMessage().contains("7"));
        assertEquals(0, loan.getRenewalCount());
        verify(loans, never()).save(any());
    }

    @Test
    void renewalAcceptsTheCalculatedLimit() throws Exception {
        RenewRequest request = new RenewRequest();
        request.setBookLoanId(loan.getId());
        request.setExtensionDays(14);
        LocalDate originalDueDate = loan.getDueDate();

        var result = subject.renewCheckout(request);

        assertEquals(originalDueDate.plusDays(14), result.getDueDate());
        assertEquals(1, result.getRenewalCount());
        verify(loans).save(loan);
    }

    @Test
    void adminCanReadPendingReturnQueue() throws Exception {
        when(users.getCurrentUser()).thenReturn(
                User.builder().id(1L).role(UserRole.ROLE_ADMIN).build());
        loan.setReturnRequestedAt(LocalDateTime.now().minusMinutes(1));
        when(loans.findPendingReturnRequests(any())).thenReturn(new PageImpl<>(List.of(loan)));

        var result = subject.getPendingReturnRequests(0, 20);

        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getReturnPending());
        verify(loans).findPendingReturnRequests(any());
    }
}
