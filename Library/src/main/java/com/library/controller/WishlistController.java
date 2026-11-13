package com.library.controller;

import com.library.payload.dto.WishlistDTO;
import com.library.payload.response.ApiResponse;
import com.library.payload.response.PageResponse;
import com.library.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/add/{bookId}")
    public ResponseEntity<?> addToWishlist(
            @PathVariable Long bookId,
            @RequestParam(required = false) String notes
    ) {

        WishlistDTO wishlistDTO = wishlistService.addToWishlist(bookId, notes);

        return ResponseEntity.ok(wishlistDTO);
    }

    @DeleteMapping("/remove/{bookId}")
    public ResponseEntity<ApiResponse> removeFromWishlist(
            @PathVariable Long bookId
    ) {

        wishlistService.removeFromWishlist(bookId);

        return ResponseEntity.ok(
                new ApiResponse(
                        "Đã xóa sách khỏi danh sách mong muốn thành công",
                        true
                )
        );
    }

    @GetMapping("/my-wishlist")
    public ResponseEntity<?> getMyWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        PageResponse<WishlistDTO> wishlist = wishlistService
                .getMyWishlist(page, size);

        return ResponseEntity.ok(wishlist);
    }


}
