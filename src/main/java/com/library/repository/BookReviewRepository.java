package com.library.repository;

import com.library.modal.Book;
import com.library.modal.BookReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookReviewRepository extends JpaRepository<BookReview, Long> {

    @Query("select r from BookReview r where r.book = :book and r.isActive = true")
    Page<BookReview> findActiveByBook(@Param("book") Book book, Pageable pageable);

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    java.util.Optional<BookReview> findByIdAndIsActiveTrue(Long id);

    @EntityGraph(attributePaths = {"user", "book"})
    @Query("select r from BookReview r where (:userId is null or r.user.id = :userId) " +
            "and (:bookId is null or r.book.id = :bookId) " +
            "and (:active is null or r.isActive = :active)")
    Page<BookReview> searchAdminReviews(@Param("userId") Long userId,
                                        @Param("bookId") Long bookId,
                                        @Param("active") Boolean active, Pageable pageable);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from BookReview r where r.id = :id")
    java.util.Optional<BookReview> findLockedById(@Param("id") Long id);
}
