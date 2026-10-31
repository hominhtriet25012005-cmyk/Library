package com.library;

import com.library.domain.BookLoanStatus;
import com.library.domain.UserRole;
import com.library.mapper.BookLoanMapper;
import com.library.modal.BookLoan;
import com.library.modal.User;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.UserRepository;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import com.library.service.impl.BookLoanServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookLoanOverdueBatchTests {

    @Test void processesMoreThanOneBatchAndDoesNotRewriteUnchangedLoans() throws Exception {
        BookLoanRepository loans = mock(BookLoanRepository.class);
        UserService users = mock(UserService.class);
        EntityManager entityManager = mock(EntityManager.class);
        User admin = User.builder().role(UserRole.ROLE_ADMIN).build();
        when(users.getCurrentUser()).thenReturn(admin);

        List<BookLoan> firstBatch = new ArrayList<>();
        for (long id = 1; id <= 2; id++) {
            firstBatch.add(BookLoan.builder().id(id).status(BookLoanStatus.CHECKED_OUT)
                    .dueDate(LocalDate.now().minusDays(3)).build());
        }
        BookLoan existingOverdue = BookLoan.builder().id(3L).status(BookLoanStatus.OVERDUE)
                .isOverdue(true).overdueDays(1).dueDate(LocalDate.now().minusDays(3)).build();
        when(loans.findOverdueBookLoansAfterId(any(LocalDate.class), anyLong(), any(Pageable.class)))
                .thenAnswer(call -> switch (((Long) call.getArgument(1)).intValue()) {
                    case 0 -> firstBatch;
                    case 2 -> List.of(existingOverdue);
                    default -> List.of();
                });
        when(loans.findLockedById(anyLong())).thenAnswer(call -> {
            long id = call.getArgument(0);
            return Optional.of(id == 3 ? existingOverdue : firstBatch.get((int) id - 1));
        });

        BookLoanServiceImpl subject = new BookLoanServiceImpl(loans, users,
                mock(SubscriptionService.class), mock(BookRepository.class),
                mock(BookLoanMapper.class), mock(UserRepository.class));
        ReflectionTestUtils.setField(subject, "entityManager", entityManager);

        assertEquals(3, (int) ReflectionTestUtils.invokeMethod(subject, "updateOverdueBookLoan", 2));
        assertEquals(BookLoanStatus.OVERDUE, firstBatch.get(0).getStatus());
        assertEquals(3, existingOverdue.getOverdueDays());
        assertEquals(0, (int) ReflectionTestUtils.invokeMethod(subject, "updateOverdueBookLoan", 2));
        verify(loans, times(3)).save(any(BookLoan.class));
        verify(loans, atLeastOnce()).findOverdueBookLoansAfterId(any(LocalDate.class), eq(2L), any(Pageable.class));
    }
}
