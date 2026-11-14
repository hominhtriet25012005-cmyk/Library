package com.library;

import com.library.domain.BookDamageLevel;
import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import com.library.domain.FineType;
import com.library.domain.UserRole;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.model.Book;
import com.library.model.BookLoan;
import com.library.model.Fine;
import com.library.model.User;
import com.library.payload.request.CheckinRequest;
import com.library.payload.response.CheckinFinePreviewResponse;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.FineRepository;
import com.library.repository.UserRepository;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import com.library.service.impl.BookLoanServiceImpl;
import com.library.service.impl.ReservationLifecycleService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookLoanFineCreationTests {

    private BookLoanRepository loans;
    private BookRepository books;
    private FineRepository fines;
    private BookLoanServiceImpl subject;
    private Book book;
    private BookLoan loan;
    private final List<Fine> createdFines = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        loans = mock(BookLoanRepository.class);
        books = mock(BookRepository.class);
        fines = mock(FineRepository.class);
        UserService users = mock(UserService.class);
        User borrower = User.builder().id(7L).email("reader@example.com")
                .fullName("Bạn đọc").role(UserRole.ROLE_USER).build();
        User admin = User.builder().id(1L).email("admin@example.com")
                .fullName("Quản trị viên").role(UserRole.ROLE_ADMIN).build();
        book = Book.builder().id(9L).title("Sách thử nghiệm").author("Tác giả")
                .price(new BigDecimal("100000")).totalCopies(4).availableCopies(3).build();
        loan = BookLoan.builder().id(11L).user(borrower).book(book)
                .type(BookLoanType.CHECKOUT).status(BookLoanStatus.CHECKED_OUT)
                .checkoutDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(10))
                .renewalCount(0).maxRenewals(2).isOverdue(true).overdueDays(10).build();

        subject = new BookLoanServiceImpl(loans, users, mock(SubscriptionService.class),
                books, new BookLoanMapper(), mock(UserRepository.class),
                mock(ReservationLifecycleService.class), fines,
                mock(com.library.service.NotificationPublisher.class));
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
        when(users.getCurrentUser()).thenReturn(admin);
        when(loans.findLockedById(loan.getId())).thenReturn(Optional.of(loan));
        when(loans.findById(loan.getId())).thenReturn(Optional.of(loan));
        when(loans.save(any(BookLoan.class))).thenAnswer(call -> call.getArgument(0));
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));
        when(books.save(any(Book.class))).thenAnswer(call -> call.getArgument(0));
        when(fines.existsByBookLoanIdAndType(anyLong(), any(FineType.class)))
                .thenAnswer(call -> createdFines.stream().anyMatch(fine ->
                        fine.getBookLoan().getId().equals(call.getArgument(0))
                                && fine.getType() == call.getArgument(1)));
        when(fines.save(any(Fine.class))).thenAnswer(call -> {
            Fine fine = call.getArgument(0);
            createdFines.add(fine);
            return fine;
        });
    }

    @Test
    void createsOverdueFineFromActualReceivedDateWithBookPriceCap() throws Exception {
        book.setPrice(new BigDecimal("30000"));

        subject.checkinBook(request(BookLoanStatus.RETURNED, null, false));

        Fine overdue = onlyFine(FineType.OVERDUE);
        assertEquals(30_000L, overdue.getAmount());
        assertEquals(10, loan.getOverdueDays());
        assertEquals("Phạt trả sách quá hạn 10 ngày.", overdue.getReason());
    }

    @Test
    void createsLightAndSevereDamageFineFromTrustedBookPrice() throws Exception {
        loan.setDueDate(LocalDate.now().plusDays(2));
        loan.setIsOverdue(false);
        loan.setOverdueDays(0);

        CheckinRequest light = request(BookLoanStatus.DAMAGED, BookDamageLevel.LIGHT, false);
        subject.checkinBook(light);
        assertEquals(25_000L, onlyFine(FineType.DAMAGE).getAmount());

        resetLoanForRetryScenario();
        createdFines.clear();
        CheckinRequest severe = request(BookLoanStatus.DAMAGED, BookDamageLevel.SEVERE, false);
        subject.checkinBook(severe);
        assertEquals(75_000L, onlyFine(FineType.DAMAGE).getAmount());
    }

    @Test
    void createsLossFineWithProcessingFeeAndCanAlsoCreateOverdueFine() throws Exception {
        subject.checkinBook(request(BookLoanStatus.LOST, null, false));

        assertEquals(2, createdFines.size());
        assertEquals(50_000L, onlyFine(FineType.OVERDUE).getAmount());
        Fine loss = onlyFine(FineType.LOSS);
        assertEquals(120_000L, loss.getAmount());
        assertTrue(loss.getReason().contains("20.000đ"));
    }

    @Test
    void damagedCheckinRequiresDamageLevel() {
        BookException error = assertThrows(BookException.class,
                () -> subject.checkinBook(request(BookLoanStatus.DAMAGED, null, false)));

        assertTrue(error.getMessage().contains("mức độ hư hỏng"));
        verify(fines, never()).save(any());
        verify(loans, never()).save(any());
    }

    @Test
    void missingBookPriceRequiresExplicitConfirmationBeforeUsingDefaultReferencePrice() throws Exception {
        book.setPrice(null);

        BookException error = assertThrows(BookException.class,
                () -> subject.checkinBook(request(BookLoanStatus.LOST, null, false)));
        assertTrue(error.getMessage().contains("100.000đ"));
        verify(fines, never()).save(any());

        subject.checkinBook(request(BookLoanStatus.LOST, null, true));
        assertEquals(120_000L, onlyFine(FineType.LOSS).getAmount());
    }

    @Test
    void repeatedCheckinDoesNotCreateDuplicateFines() throws Exception {
        CheckinRequest request = request(BookLoanStatus.LOST, null, false);

        subject.checkinBook(request);
        subject.checkinBook(request);

        assertEquals(2, createdFines.size());
        verify(fines, times(2)).save(any(Fine.class));
        verify(loans, times(1)).save(loan);
    }

    @Test
    void previewUsesTheSameRulesWithoutMutatingLoanOrCreatingFines() throws Exception {
        CheckinRequest request = request(BookLoanStatus.DAMAGED, BookDamageLevel.SEVERE, false);

        CheckinFinePreviewResponse preview = subject.previewCheckinFines(request);

        assertEquals(10, preview.getOverdueDays());
        assertEquals(100_000L, preview.getReferencePrice());
        assertFalse(preview.getUsesDefaultReferencePrice());
        assertFalse(preview.getRequiresDefaultReferencePriceConfirmation());
        assertEquals(2, preview.getItems().size());
        assertEquals(50_000L, preview.getItems().get(0).getAmount());
        assertEquals(FineType.OVERDUE, preview.getItems().get(0).getType());
        assertEquals(75_000L, preview.getItems().get(1).getAmount());
        assertEquals(FineType.DAMAGE, preview.getItems().get(1).getType());
        assertEquals(125_000L, preview.getTotalAmount());
        assertNull(loan.getCheckedInAt());
        verify(loans, never()).save(any());
        verify(fines, never()).save(any());
    }

    @Test
    void previewExposesDefaultPriceConfirmationInsteadOfFailing() throws Exception {
        book.setPrice(null);

        CheckinFinePreviewResponse preview = subject.previewCheckinFines(
                request(BookLoanStatus.LOST, null, false));

        assertEquals(100_000L, preview.getReferencePrice());
        assertTrue(preview.getUsesDefaultReferencePrice());
        assertTrue(preview.getRequiresDefaultReferencePriceConfirmation());
        assertEquals(170_000L, preview.getTotalAmount());
        verify(fines, never()).save(any());
    }

    private Fine onlyFine(FineType type) {
        return createdFines.stream().filter(fine -> fine.getType() == type).findFirst().orElseThrow();
    }

    private CheckinRequest request(BookLoanStatus condition, BookDamageLevel damageLevel,
                                   boolean confirmDefaultReferencePrice) {
        CheckinRequest request = new CheckinRequest();
        request.setBookLoanId(loan.getId());
        request.setCondition(condition);
        request.setReceivedDate(LocalDate.now());
        request.setInspectionNote(condition == BookLoanStatus.RETURNED
                ? "Đã nhận sách" : "Biên bản kiểm tra tại quầy");
        request.setDamageLevel(damageLevel);
        request.setConfirmDefaultReferencePrice(confirmDefaultReferencePrice);
        return request;
    }

    private void resetLoanForRetryScenario() {
        loan.setStatus(BookLoanStatus.CHECKED_OUT);
        loan.setReturnDate(null);
        loan.setCheckedInAt(null);
        loan.setCheckedInBy(null);
        loan.setInspectionNote(null);
    }
}
