package com.library;

import com.library.domain.UserRole;
import com.library.exception.BookException;
import com.library.mapper.BookLoanMapper;
import com.library.model.Book;
import com.library.model.User;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.CheckoutRequest;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.UserRepository;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import com.library.service.impl.BookLoanServiceImpl;
import com.library.service.impl.ReservationLifecycleService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookLoanReservationGuardTests {

    @Test
    void ordinaryCheckoutCannotConsumeCopyReservedForPickup() throws Exception {
        BookLoanRepository loans = mock(BookLoanRepository.class);
        UserService currentUsers = mock(UserService.class);
        SubscriptionService subscriptions = mock(SubscriptionService.class);
        BookRepository books = mock(BookRepository.class);
        UserRepository users = mock(UserRepository.class);
        ReservationLifecycleService lifecycle = mock(ReservationLifecycleService.class);
        User member = User.builder().id(4L).email("member@test.invalid").fullName("Member")
                .role(UserRole.ROLE_USER).build();
        Book book = Book.builder().id(6L).title("Reserved book").author("Author")
                .active(true).totalCopies(1).availableCopies(1).build();
        SubscriptionDTO membership = new SubscriptionDTO();
        membership.setMaxBooksAllowed(2);
        membership.setMaxDaysPerBook(14);

        when(currentUsers.getCurrentUser()).thenReturn(member);
        when(users.findLockedById(member.getId())).thenReturn(Optional.of(member));
        when(subscriptions.getUsersActiveSubscription(member.getId())).thenReturn(membership);
        when(books.findLockedById(book.getId())).thenReturn(Optional.of(book));
        when(lifecycle.hasAvailableReservationForBook(book.getId())).thenReturn(true);

        BookLoanServiceImpl subject = new BookLoanServiceImpl(loans, currentUsers, subscriptions,
                books, new BookLoanMapper(), users, lifecycle);
        ReflectionTestUtils.setField(subject, "entityManager", mock(EntityManager.class));
        CheckoutRequest request = new CheckoutRequest();
        request.setBookId(book.getId());
        request.setCheckoutDays(7);

        BookException error = assertThrows(BookException.class, () -> subject.checkoutBook(request));

        assertEquals("Sách đã được đặt giữ và đang chờ nhận.", error.getMessage());
        verify(loans, never()).save(any());
        verify(books, never()).save(any());
    }
}
