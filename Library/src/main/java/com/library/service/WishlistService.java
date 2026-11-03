package com.library.service;

import com.library.payload.dto.WishlistDTO;
import com.library.payload.response.PageResponse;

public interface WishlistService {

    WishlistDTO addToWishlist(Long bookId, String notes) throws Exception;

    void removeFromWishlist(Long bookId) throws Exception;

    PageResponse<WishlistDTO> getMyWishlist(int page, int size) throws Exception;
}
