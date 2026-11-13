package com.library;

import com.library.mapper.SubscriptionPlanMapper;
import com.library.mapper.BookMapper;
import com.library.model.Book;
import com.library.model.SubscriptionPlan;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.SubscriptionPlanRepository;
import com.library.repository.UserRepository;
import com.library.repository.WishlistRepository;
import com.library.service.UserService;
import com.library.service.impl.SubscriptionPlanServiceImpl;
import com.library.service.impl.UserServiceImpl;
import com.library.service.impl.WishlistServiceImpl;
import com.library.mapper.WishlistMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BusinessExceptionTypeTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void duplicateSubscriptionPlanCodeUsesConflictException() throws Exception {
        SubscriptionPlanRepository plans = mock(SubscriptionPlanRepository.class);
        when(plans.existsByPlanCode("VIP")).thenReturn(true);
        var service = new SubscriptionPlanServiceImpl(
                plans, new SubscriptionPlanMapper(), mock(UserService.class), plans);

        Exception error = assertThrows(Exception.class, () -> service.createSubscriptionPlan(
                com.library.payload.dto.SubscriptionPlanDTO.builder().planCode("VIP").build()));

        assertBusinessException(error, "BusinessConflictException", "SUBSCRIPTION_PLAN_CODE_EXISTS");
    }

    @Test
    void missingSubscriptionPlanUsesNotFoundException() throws Exception {
        SubscriptionPlanRepository plans = mock(SubscriptionPlanRepository.class);
        when(plans.findById(404L)).thenReturn(Optional.empty());
        var service = new SubscriptionPlanServiceImpl(
                plans, new SubscriptionPlanMapper(), mock(UserService.class), plans);

        Exception error = assertThrows(Exception.class, () -> service.updateSubscriptionPlan(
                404L, com.library.payload.dto.SubscriptionPlanDTO.builder().build()));

        assertBusinessException(error, "ResourceNotFoundException", "SUBSCRIPTION_PLAN_NOT_FOUND");
    }

    @Test
    void missingBookForWishlistUsesNotFoundException() throws Exception {
        UserService users = mock(UserService.class);
        BookRepository books = mock(BookRepository.class);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        when(books.findById(404L)).thenReturn(Optional.empty());
        var service = new WishlistServiceImpl(
                mock(WishlistRepository.class), users, books, new WishlistMapper(mock(BookMapper.class)));

        Exception error = assertThrows(Exception.class, () -> service.addToWishlist(404L, null));

        assertBusinessException(error, "ResourceNotFoundException", "BOOK_NOT_FOUND");
    }

    @Test
    void existingWishlistItemUsesConflictException() throws Exception {
        UserService users = mock(UserService.class);
        BookRepository books = mock(BookRepository.class);
        WishlistRepository wishlist = mock(WishlistRepository.class);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        when(books.findById(12L)).thenReturn(Optional.of(Book.builder().id(12L).build()));
        when(wishlist.existsByUserIdAndBookId(7L, 12L)).thenReturn(true);
        var service = new WishlistServiceImpl(wishlist, users, books,
                new WishlistMapper(mock(BookMapper.class)));

        Exception error = assertThrows(Exception.class, () -> service.addToWishlist(12L, null));

        assertBusinessException(error, "BusinessConflictException", "WISHLIST_ITEM_EXISTS");
    }

    @Test
    void missingWishlistItemUsesNotFoundException() throws Exception {
        UserService users = mock(UserService.class);
        WishlistRepository wishlist = mock(WishlistRepository.class);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        when(wishlist.findByUserIdAndBookId(7L, 12L)).thenReturn(null);
        var service = new WishlistServiceImpl(
                wishlist, users, mock(BookRepository.class), new WishlistMapper(mock(BookMapper.class)));

        Exception error = assertThrows(Exception.class, () -> service.removeFromWishlist(12L));

        assertBusinessException(error, "ResourceNotFoundException", "WISHLIST_ITEM_NOT_FOUND");
    }

    @Test
    void missingCurrentUserUsesNotFoundException() throws Exception {
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmail("gone@example.com")).thenReturn(null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("gone@example.com", "n/a"));
        var service = new UserServiceImpl(users);

        Exception error = assertThrows(Exception.class, service::getCurrentUser);

        assertBusinessException(error, "ResourceNotFoundException", "USER_NOT_FOUND");
    }

    private void assertBusinessException(Exception error, String expectedType, String expectedCode)
            throws Exception {
        assertEquals(expectedType, error.getClass().getSimpleName());
        Method errorCodeGetter = error.getClass().getMethod("getErrorCode");
        assertEquals(expectedCode, errorCodeGetter.invoke(error));
    }
}
