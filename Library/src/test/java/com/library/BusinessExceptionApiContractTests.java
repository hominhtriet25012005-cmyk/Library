package com.library;

import com.library.controller.WishlistController;
import com.library.exception.BusinessConflictException;
import com.library.exception.GlobalException;
import com.library.exception.ResourceNotFoundException;
import com.library.service.WishlistService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class BusinessExceptionApiContractTests {

    @Test
    void businessConflictReturnsHttp409AndStableErrorCode() throws Exception {
        WishlistService service = mock(WishlistService.class);
        when(service.addToWishlist(12L, null)).thenThrow(new BusinessConflictException(
                "WISHLIST_ITEM_EXISTS",
                "Sách đã có trong danh sách yêu thích của bạn."
        ));
        MockMvc mvc = standaloneSetup(new WishlistController(service))
                .setControllerAdvice(new GlobalException())
                .build();

        mvc.perform(post("/api/wishlist/add/12"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(false))
                .andExpect(jsonPath("$.errorCode").value("WISHLIST_ITEM_EXISTS"))
                .andExpect(jsonPath("$.message").value("Sách đã có trong danh sách yêu thích của bạn."));
    }

    @Test
    void missingResourceReturnsHttp404AndStableErrorCode() throws Exception {
        WishlistService service = mock(WishlistService.class);
        when(service.addToWishlist(404L, null)).thenThrow(new ResourceNotFoundException(
                "BOOK_NOT_FOUND",
                "Không tìm thấy sách."
        ));
        MockMvc mvc = standaloneSetup(new WishlistController(service))
                .setControllerAdvice(new GlobalException())
                .build();

        mvc.perform(post("/api/wishlist/add/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(false))
                .andExpect(jsonPath("$.errorCode").value("BOOK_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy sách."));
    }
}
