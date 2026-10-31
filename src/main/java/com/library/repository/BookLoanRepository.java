package com.library.repository;

import com.library.domain.BookLoanStatus;
import com.library.modal.Book;
import com.library.modal.BookLoan;
import com.library.modal.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookLoanRepository extends JpaRepository<BookLoan, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select bl from BookLoan bl where bl.id = :id")
    java.util.Optional<BookLoan> findLockedById(@Param("id") Long id);

    Page<BookLoan> findByUserId(Long userId, Pageable pageable);

    Page<BookLoan> findByStatusAndUser(BookLoanStatus status, User user, Pageable pageable);

    Page<BookLoan> findByStatus(BookLoanStatus status, Pageable pageable);

    Page<BookLoan> findByBookId(Long bookId, Pageable pageable);

    List<BookLoan> findByBookId(Long bookId);

    @Query("select case when count(bl) > 0 then true else false end from BookLoan bl " +
            "where bl.user.id = :userId and bl.book.id = :bookId " +
            "and (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE')"
    )
    boolean hasActiveCheckout(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId
    );

    @Query("SELECT COUNT(bl) FROM BookLoan bl WHERE bl.user.id = :userId " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE')")
    long countActiveBookLoansByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(bl) FROM BookLoan bl WHERE bl.user.id = :userId " +
            "AND (bl.status = 'OVERDUE' OR (bl.status = 'CHECKED_OUT' AND bl.dueDate < :today))")
    long countOverdueBookLoansByUser(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.dueDate < :currentDate " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE')")
    Page<BookLoan> findOverdueBookLoans(@Param("currentDate") LocalDate currentDate,
                                        Pageable pageable);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.id > :afterId AND bl.dueDate < :currentDate " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE') ORDER BY bl.id ASC")
    List<BookLoan> findOverdueBookLoansAfterId(@Param("currentDate") LocalDate currentDate,
                                                @Param("afterId") long afterId,
                                                Pageable pageable);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.checkoutDate BETWEEN :startDate AND :endDate")
    Page<BookLoan> findBookLoansByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, BookLoanStatus status);

}
