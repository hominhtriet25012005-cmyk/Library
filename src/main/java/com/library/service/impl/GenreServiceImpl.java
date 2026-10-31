package com.library.service.impl;

import com.library.exception.GenreException;
import com.library.mapper.GenreMapper;
import com.library.modal.Genre;
import com.library.payload.dto.GenreDTO;
import com.library.repository.GenreRepository;
import com.library.repository.BookRepository;
import com.library.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {


    private final GenreRepository genreRepository;
    private final GenreMapper genreMapper;
    private final BookRepository bookRepository;

    @Override
    public GenreDTO createGenre(GenreDTO genreDTO) throws GenreException {

        if (genreRepository.existsByCode(genreDTO.getCode())) {
            throw new GenreException("Mã thể loại đã tồn tại");
        }

        Genre genre = genreMapper.toEntity(genreDTO);
        if (genreDTO.getParentGenreId() != null) {
            genre.setParentGenre(genreRepository.findById(genreDTO.getParentGenreId())
                    .orElseThrow(() -> new GenreException("Không tìm thấy thể loại cha")));
        }
        Genre savedGenre = genreRepository.save(genre);

        return genreMapper.toDTO(savedGenre);
    }

    @Override
    public List<GenreDTO> getAllGenres() {
        return genreRepository.findAll(Sort.by(Sort.Direction.ASC, "displayOrder").and(Sort.by(Sort.Direction.ASC, "id"))).stream()
                .map(genre -> {
                    GenreDTO dto = genreMapper.toDTO(genre);
                    if (dto != null && genre.getId() != null) {
                        dto.setBookCount(bookRepository.countByGenreId(genre.getId()));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public GenreDTO getGenreById(Long genreId) throws GenreException {
        Genre genre = genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("Không tìm thấy thể loại")
        );
        GenreDTO dto = genreMapper.toDTO(genre);
        if (dto != null) {
            dto.setBookCount(bookRepository.countByGenreId(genreId));
        }
        return dto;
    }

    @Override
    public GenreDTO updateGenre(Long genreId, GenreDTO genreDTO) throws GenreException {
        Genre existingGenre = genreRepository.findById(genreId).orElseThrow(
                () -> new GenreException("Không tìm thấy thể loại")
        );

        if (genreRepository.existsByCodeAndIdNot(genreDTO.getCode(), genreId)) {
            throw new GenreException("Mã thể loại đã tồn tại");
        }

        Genre parent = null;
        if (genreDTO.getParentGenreId() != null) {
            parent = genreRepository.findById(genreDTO.getParentGenreId())
                    .orElseThrow(() -> new GenreException("Không tìm thấy thể loại cha"));
            Set<Long> seen = new HashSet<>();
            for (Genre current = parent; current != null; current = current.getParentGenre()) {
                if (genreId.equals(current.getId()) || !seen.add(current.getId())) {
                    throw new GenreException("Không thể chọn thể loại con làm thể loại cha");
                }
            }
        }

        genreMapper.updateEntityFromDTO(genreDTO, existingGenre);
        existingGenre.setParentGenre(parent);

        Genre updatedGenre = genreRepository.save(existingGenre);

        GenreDTO result = genreMapper.toDTO(updatedGenre);
        if (result != null) {
            result.setBookCount(bookRepository.countByGenreId(genreId));
        }
        return result;
    }

    @Override
    public void deleteGenre(Long genreId) throws GenreException {
        Genre existingGenre= genreRepository.findById(genreId).orElseThrow(
                ()-> new GenreException("Không tìm thấy thể loại")
        );
        existingGenre.setActive(false);
        genreRepository.save(existingGenre);
    }

    @Override
    public void hardDeleteGenre(Long genreId) throws GenreException {
        Genre existingGenre= genreRepository.findById(genreId).orElseThrow(
                ()-> new GenreException("Không tìm thấy thể loại")
        );
        long booksCount = bookRepository.countByGenreId(genreId);
        if (booksCount > 0) {
            throw new GenreException("Không thể xóa thể loại đang có " + booksCount + " cuốn sách liên kết. Vui lòng chuyển hoặc xóa sách trước.");
        }
        if (existingGenre.getSubGenres() != null && !existingGenre.getSubGenres().isEmpty()) {
            throw new GenreException("Không thể xóa thể loại đang có thể loại con. Vui lòng chuyển hoặc xóa thể loại con trước.");
        }
        genreRepository.delete(existingGenre);
    }

    @Override
    public List<GenreDTO> getAllActiveGenresWithSubGenres() {
        List<Genre> topLevelGenres = genreRepository
                .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    public List<GenreDTO> getTopLevelGenres() {
        List<Genre> topLevelGenres = genreRepository
                .findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();

        return genreMapper.toDTOList(topLevelGenres);
    }

    @Override
    public long getTotalActiveGenres() {
        return genreRepository.countByActiveTrue();
    }

    @Override
    public long getBookCountByGenre(Long genreId) {
        return bookRepository.countByGenreId(genreId);
    }
}
