package com.library.mapper;

import com.library.modal.Genre;
import com.library.payload.dto.GenreDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.stream.Collectors;

@Component
public class GenreMapper {

    public GenreDTO toDTO(Genre savedGenre) {
        return toDTO(savedGenre, Collections.newSetFromMap(new IdentityHashMap<>()));
    }

    private GenreDTO toDTO(Genre savedGenre, Set<Genre> visiting) {
        if (savedGenre == null) {
            return null;
        }
        if (!visiting.add(savedGenre)) {
            return null;
        }
        GenreDTO dto = GenreDTO.builder()
                .id(savedGenre.getId())
                .code(savedGenre.getCode())
                .name(savedGenre.getName())
                .description(savedGenre.getDescription())
                .displayOrder(savedGenre.getDisplayOrder())
                .active(savedGenre.getActive())
                .createdAt(savedGenre.getCreatedAt())
                .updatedAt(savedGenre.getUpdatedAt())
                .build();

        if (savedGenre.getParentGenre() != null) {
            dto.setParentGenreId(savedGenre.getParentGenre().getId());
            dto.setParentGenreName(savedGenre.getParentGenre().getName());
        }

        if (savedGenre.getSubGenres() != null && !savedGenre.getSubGenres().isEmpty()) {
            dto.setSubGenre(savedGenre.getSubGenres().stream()
                    .filter(subGenre -> subGenre.getActive())
                    .filter(subGenre -> !visiting.contains(subGenre))
                    .map(subGenre -> toDTO(subGenre, visiting)).collect(Collectors.toList()));
        }

        visiting.remove(savedGenre);

//        dto.setBookCount((long) (savedGenre.getB));

        return dto;
    }

    public Genre toEntity(GenreDTO genreDTO) {
        if (genreDTO == null) {
            return null;
        }

        Genre genre = Genre.builder()
                .code(genreDTO.getCode())
                .name(genreDTO.getName())
                .description(genreDTO.getDescription())
                .displayOrder(genreDTO.getDisplayOrder())
                .active(genreDTO.getActive() != null ? genreDTO.getActive() : true)
                .build();

        return genre;
    }

    public void updateEntityFromDTO(GenreDTO dto, Genre existingGenre) {
        if (dto == null || existingGenre == null) {
            return ;
        }

        existingGenre.setCode(dto.getCode());
        existingGenre.setName(dto.getName());
        existingGenre.setDescription(dto.getDescription());
        existingGenre.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        if (dto.getActive() != null) {
            existingGenre.setActive(dto.getActive());
        }
    }

    public List<GenreDTO> toDTOList(List<Genre> genreList) {
        return genreList.stream().map(genre -> toDTO(genre)).collect(Collectors.toList());
    }
}
