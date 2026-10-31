package com.library;

import com.library.mapper.GenreMapper;
import com.library.mapper.SubscriptionPlanMapper;
import com.library.modal.SubscriptionPlan;
import com.library.modal.User;
import com.library.payload.dto.SubscriptionPlanDTO;
import com.library.repository.BookRepository;
import com.library.repository.GenreRepository;
import com.library.repository.SubscriptionPlanRepository;
import com.library.service.UserService;
import com.library.service.impl.GenreServiceImpl;
import com.library.service.impl.SubscriptionPlanServiceImpl;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Group2ServiceTests {
    @Test void genreCountUsesRepositoryResult() {
        BookRepository books = mock(BookRepository.class);
        GenreServiceImpl service = new GenreServiceImpl(mock(GenreRepository.class), mock(GenreMapper.class), books);
        when(books.countByGenreId(42L)).thenReturn(7L);
        assertEquals(7L, service.getBookCountByGenre(42L));
        verify(books).countByGenreId(42L);
        verifyNoMoreInteractions(books);
    }

    @Test void updateReturnsDtoOfSavedEntity() throws Exception {
        SubscriptionPlanRepository repo = mock(SubscriptionPlanRepository.class);
        SubscriptionPlanMapper mapper = mock(SubscriptionPlanMapper.class);
        UserService users = mock(UserService.class);
        SubscriptionPlan existing = new SubscriptionPlan(), saved = new SubscriptionPlan();
        SubscriptionPlanDTO request = new SubscriptionPlanDTO(), expected = new SubscriptionPlanDTO();
        when(repo.findById(42L)).thenReturn(Optional.of(existing));
        when(users.getCurrentUser()).thenReturn(User.builder().fullName("Admin fixture").build());
        when(repo.save(existing)).thenReturn(saved);
        when(mapper.toDTO(saved)).thenReturn(expected);
        SubscriptionPlanServiceImpl service = new SubscriptionPlanServiceImpl(repo, mapper, users, repo);
        assertSame(expected, service.updateSubscriptionPlan(42L, request));
        assertEquals("Admin fixture", existing.getUpdatedBy());
        var order = inOrder(mapper, repo);
        order.verify(repo).findById(42L);
        order.verify(mapper).updateEntity(existing, request);
        order.verify(repo).save(existing);
        order.verify(mapper).toDTO(saved);
    }

    @Test void missingPlanDoesNotSave() {
        SubscriptionPlanRepository repo = mock(SubscriptionPlanRepository.class);
        SubscriptionPlanMapper mapper = mock(SubscriptionPlanMapper.class);
        UserService users = mock(UserService.class);
        when(repo.findById(42L)).thenReturn(Optional.empty());
        SubscriptionPlanServiceImpl service = new SubscriptionPlanServiceImpl(repo, mapper, users, repo);
        assertThrows(Exception.class, () -> service.updateSubscriptionPlan(42L, new SubscriptionPlanDTO()));
        verify(repo, never()).save(any());
        verifyNoInteractions(mapper, users);
    }
}
