package com.library.repository;

import com.library.modal.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GenreRepository extends JpaRepository<Genre, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    // Tìm kiếm theo trạng thái hoạt động đúng theo thứ tự hiển thị tăng dần
    List<Genre> findByActiveTrueOrderByDisplayOrderAsc();

    // Tìm theo Thể loại cha là Null và Active True Sắp xếp theo Thứ tự hiển thị Tăng dần
    List<Genre> findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

    // Tìm theo ID thể loại cha và trạng thái hoạt động True. Sắp xếp theo thứ tự hiển thị tăng dần.
    List<Genre> findByParentGenreIdAndActiveTrueOrderByDisplayOrderAsc(
            Long parentGenreId
    );

    long countByActiveTrue();

    // @Query("select count(b) from Book b where b.genre.id = :genreId")
    // long countBooksByGenre(@Param("genreId") Long genreId);
}
