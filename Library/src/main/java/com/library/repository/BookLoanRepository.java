package com.library.repository;

import com.library.domain.BookLoanStatus;
import com.library.model.Book;
import com.library.model.BookLoan;
import com.library.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookLoanRepository extends JpaRepository<BookLoan, Long> {

    @Query("""
        SELECT bl FROM BookLoan bl
        WHERE (:userId IS NULL OR bl.user.id = :userId)
          AND (:bookId IS NULL OR bl.book.id = :bookId)
          AND (:status IS NULL OR bl.status = :status)
          AND (:startDate IS NULL OR bl.checkoutDate >= :startDate)
          AND (:endDate IS NULL OR bl.checkoutDate <= :endDate)
          AND (:overdueOnly = false OR
               (bl.dueDate < :today AND bl.status IN ('CHECKED_OUT', 'OVERDUE')))
          AND (:unpaidFinesOnly = false OR EXISTS (
               SELECT f.id FROM Fine f WHERE f.bookLoan.id = bl.id
               AND f.status IN ('PENDING', 'PARTIALLY_PAID') AND f.amount > f.amountPaid))
        """)
    Page<BookLoan> searchWithFilters(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId,
            @Param("status") BookLoanStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("overdueOnly") boolean overdueOnly,
            @Param("unpaidFinesOnly") boolean unpaidFinesOnly,
            @Param("today") LocalDate today,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select bl from BookLoan bl where bl.id = :id")
    java.util.Optional<BookLoan> findLockedById(@Param("id") Long id);

    Page<BookLoan> findByUserId(Long userId, Pageable pageable);

    Page<BookLoan> findByStatusAndUser(BookLoanStatus status, User user, Pageable pageable);

    Page<BookLoan> findByStatus(BookLoanStatus status, Pageable pageable);

    Page<BookLoan> findByBookId(Long bookId, Pageable pageable);

    @Query("SELECT bl FROM BookLoan bl " +
            "WHERE bl.returnRequestedAt IS NOT NULL AND bl.checkedInAt IS NULL " +
            "AND (bl.status = 'CHECKED_OUT' OR bl.status = 'OVERDUE') " +
            "ORDER BY bl.returnRequestedAt ASC, bl.id ASC")
    Page<BookLoan> findPendingReturnRequests(Pageable pageable);

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

    boolean existsByUserIdAndBookIdAndStatusIn(Long userId, Long bookId,
                                                Collection<BookLoanStatus> statuses);

    List<BookLoan> findByDueDateAndStatusIn(
            LocalDate dueDate,
            Collection<BookLoanStatus> statuses);

}
