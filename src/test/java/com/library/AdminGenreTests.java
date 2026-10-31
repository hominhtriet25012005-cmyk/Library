package com.library;

import com.library.exception.GenreException;
import com.library.mapper.GenreMapper;
import com.library.modal.Genre;
import com.library.payload.dto.GenreDTO;
import com.library.repository.BookRepository;
import com.library.repository.GenreRepository;
import com.library.service.impl.GenreServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminGenreTests {
    @Test void duplicateCodeReturnsControlledBusinessError() {
        GenreRepository repository = mock(GenreRepository.class);
        when(repository.existsByCode("DUP")).thenReturn(true);
        GenreServiceImpl service = new GenreServiceImpl(repository,
                new GenreMapper(), mock(BookRepository.class));

        assertThrows(GenreException.class,
                () -> service.createGenre(GenreDTO.builder().code("DUP").name("Duplicate").build()));
        verify(repository, never()).save(any());
    }

    @Test void cannotMoveGenreUnderItself() {
        GenreRepository repository = mock(GenreRepository.class);
        Genre genre = Genre.builder().id(1L).code("A").name("A").build();
        when(repository.findById(1L)).thenReturn(Optional.of(genre));
        GenreServiceImpl service = new GenreServiceImpl(repository,
                new GenreMapper(), mock(BookRepository.class));

        GenreDTO request = GenreDTO.builder().code("A").name("A").parentGenreId(1L).build();
        assertThrows(GenreException.class, () -> service.updateGenre(1L, request));
        verify(repository, never()).save(any());
    }

    @Test void cannotMoveParentUnderDescendant() {
        GenreRepository repository = mock(GenreRepository.class);
        Genre root = Genre.builder().id(1L).code("A").name("A").build();
        Genre child = Genre.builder().id(2L).code("B").name("B").parentGenre(root).build();
        when(repository.findById(1L)).thenReturn(Optional.of(root));
        when(repository.findById(2L)).thenReturn(Optional.of(child));
        GenreServiceImpl service = new GenreServiceImpl(repository,
                new GenreMapper(), mock(BookRepository.class));

        GenreDTO request = GenreDTO.builder().code("A").name("A").parentGenreId(2L).build();
        assertThrows(GenreException.class, () -> service.updateGenre(1L, request));
        verify(repository, never()).save(any());
    }

    @Test void updatingRootCanClearItsParent() throws Exception {
        GenreRepository repository = mock(GenreRepository.class);
        Genre parent = Genre.builder().id(1L).code("A").name("A").build();
        Genre child = Genre.builder().id(2L).code("B").name("B").parentGenre(parent).build();
        when(repository.findById(2L)).thenReturn(Optional.of(child));
        when(repository.save(any(Genre.class))).thenAnswer(call -> call.getArgument(0));
        GenreServiceImpl service = new GenreServiceImpl(repository,
                new GenreMapper(), mock(BookRepository.class));

        service.updateGenre(2L, GenreDTO.builder().code("B").name("B").build());
        assertNull(child.getParentGenre());
    }
}
