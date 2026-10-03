package com.library.repository;

import com.library.modal.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    boolean existsByIsbn(String isbn);

    //  book - java programing
    //  ja

    @Query("select b from Book b where" +
            "(:searchTerm is null OR "+
            "lower(b.title) like lower(concat ('%', :searchTerm, '%')) OR " +
            "lower(b.author) like lower(concat ('%', :searchTerm, '%')) OR " +
            "lower(b.isbn) like lower(concat ('%', :searchTerm, '%'))) AND " +
            "(:genreId is null or b.genre.id=:genreId) AND " +
            "(:availableOnly = false Or b.availableCopies>0 ) AND " +
            "b.active = true"
    )
    Page<Book> searchBooksWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("genreId") Long genreId,
            @Param("availableOnly") boolean availableOnly,
            Pageable pageable
    );

    long countByActiveTrue();

    @Query("select count(b) from Book b where b.availableCopies>0 and b.active=true")
    long countAvailableBooks();

}
