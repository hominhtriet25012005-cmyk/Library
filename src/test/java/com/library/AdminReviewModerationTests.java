package com.library;

import com.library.domain.UserRole;
import com.library.exception.BookReviewException;
import com.library.mapper.BookReviewMapper;
import com.library.modal.Book;
import com.library.modal.BookReview;
import com.library.modal.User;
import com.library.repository.BookLoanRepository;
import com.library.repository.BookRepository;
import com.library.repository.BookReviewRepository;
import com.library.service.UserService;
import com.library.service.impl.BookReviewServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdminReviewModerationTests {
    private final BookReviewRepository repository = mock(BookReviewRepository.class);
    private final UserService users = mock(UserService.class);
    private final BookReviewServiceImpl service = new BookReviewServiceImpl(repository, users,
            mock(BookRepository.class), new BookReviewMapper(), mock(BookLoanRepository.class));

    private BookReview review(boolean active) {
        return BookReview.builder().id(7L).user(User.builder().id(2L).fullName("Reader").build())
                .book(Book.builder().id(3L).title("Book").build()).rating(4)
                .title("Title").reviewText("Original review text").isActive(active).build();
    }

    @Test void adminSearchIncludesHiddenAndUsesServerPaging() throws Exception {
        when(users.getCurrentUser()).thenReturn(User.builder().role(UserRole.ROLE_ADMIN).build());
        var paging = PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        when(repository.searchAdminReviews(null, 3L, false, paging))
                .thenReturn(new PageImpl<>(List.of(review(false)), paging, 1));
        var result = service.searchAdminReviews(null, 3L, false, 0, 10);
        assertEquals(1, result.getTotalElements());
        assertFalse(result.getContent().get(0).getIsActive());
        verify(repository).searchAdminReviews(null, 3L, false, paging);
    }

    @Test void onlyAdminCanHideAndReviewContentStaysUnchanged() throws Exception {
        BookReview existing = review(true);
        when(users.getCurrentUser()).thenReturn(User.builder().role(UserRole.ROLE_USER).build());
        assertThrows(AccessDeniedException.class, () -> service.hideReview(7L));
        verify(repository, never()).findLockedById(anyLong());

        when(users.getCurrentUser()).thenReturn(User.builder().role(UserRole.ROLE_ADMIN).build());
        when(repository.findLockedById(7L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);
        var result = service.hideReview(7L);
        assertFalse(result.getIsActive());
        assertEquals("Original review text", existing.getReviewText());
        assertEquals(4, existing.getRating());
        verify(repository).save(existing);
        service.hideReview(7L);
        verify(repository, times(1)).save(existing);
    }

    @Test void invalidAdminFiltersAndMissingReviewAreRejected() throws Exception {
        when(users.getCurrentUser()).thenReturn(User.builder().role(UserRole.ROLE_ADMIN).build());
        assertThrows(BookReviewException.class, () -> service.searchAdminReviews(-1L, null, null, 0, 10));
        assertThrows(BookReviewException.class, () -> service.searchAdminReviews(null, null, null, -1, 10));
        assertThrows(BookReviewException.class, () -> service.hideReview(0L));
        assertThrows(BookReviewException.class, () -> service.hideReview(8L));
    }
}
