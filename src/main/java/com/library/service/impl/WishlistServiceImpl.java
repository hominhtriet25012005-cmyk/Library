package com.library.service.impl;

import com.library.mapper.WishlistMapper;
import com.library.modal.Book;
import com.library.modal.User;
import com.library.modal.Wishlist;
import com.library.payload.dto.WishlistDTO;
import com.library.payload.response.PageResponse;
import com.library.repository.BookRepository;
import com.library.repository.WishlistRepository;
import com.library.service.UserService;
import com.library.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserService userService;
    private final BookRepository bookRepository;
    private final WishlistMapper wishlistMapper;

    @Override
    public WishlistDTO addToWishlist(Long bookId, String notes) throws Exception {

        User user = userService.getCurrentUser();

        // 1. validate book exist
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new Exception("Book not found"));

        // 2. check if book is already in wishlist
        if (wishlistRepository.existsByUserIdAndBookId(user.getId(), bookId)) {
            throw new Exception("book is already in your wishlist");
        }

        // create wishlist
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setBook(book);
        wishlist.setNotes(notes);

        Wishlist saved = wishlistRepository.save(wishlist);

        return wishlistMapper.toDTO(saved);
    }

    @Override
    public void removeFromWishlist(Long bookId) throws Exception {
        User user = userService.getCurrentUser();

        Wishlist wishlist = wishlistRepository.findByUserIdAndBookId(user.getId(), bookId);

        if (wishlist == null) {
            throw new Exception("book is not in your wishlist");
        }

        wishlistRepository.delete(wishlist);
    }

    @Override
    public PageResponse<WishlistDTO> getMyWishlist(int page, int size) throws Exception {
        Long userId = userService.getCurrentUser().getId();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("addedAt").descending()
        );

        Page<Wishlist> wishlistPage = wishlistRepository.findByUserId(userId, pageable);

        return convertToPageResponse(wishlistPage);
    }

    private PageResponse<WishlistDTO> convertToPageResponse(Page<Wishlist> wishlistPage) {
        List<WishlistDTO> wishlistDTOs = wishlistPage.getContent()
                .stream()
                .map(wishlistMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                wishlistDTOs,
                wishlistPage.getNumber(),
                wishlistPage.getSize(),
                wishlistPage.getTotalElements(),
                wishlistPage.getTotalPages(),
                wishlistPage.isLast(),
                wishlistPage.isFirst(),
                wishlistPage.isEmpty()
        );
    }
}
