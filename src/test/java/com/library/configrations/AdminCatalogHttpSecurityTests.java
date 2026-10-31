package com.library.configrations;

import com.library.controller.AdminBookController;
import com.library.controller.BookController;
import com.library.controller.AdminBookCoverController;
import com.library.controller.BookCoverController;
import com.library.controller.GenreController;
import com.library.payload.response.BookCoverUploadResponse;
import com.library.payload.dto.BookDTO;
import com.library.service.BookCoverStorageService;
import com.library.service.BookService;
import com.library.service.GenreService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockServletContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminCatalogHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, AdminBookController.class, BookController.class, GenreController.class,
            AdminBookCoverController.class, BookCoverController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean BookService books() { return mock(BookService.class); }
        @Bean GenreService genres() { return mock(GenreService.class); }
        @Bean BookCoverStorageService covers() { return mock(BookCoverStorageService.class); }
    }

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
    }

    @AfterEach void close() { context.close(); }

    private String token(String role) {
        return SecurityTestSupport.token(role);
    }

    @Test void onlyAdminCanReadHiddenCatalogAndChangeVisibility() throws Exception {
        BookService books = context.getBean(BookService.class);
        when(books.getBookById(7L)).thenReturn(BookDTO.builder().id(7L).active(false).build());

        mvc.perform(get("/api/admin/book/7").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/book/search").header("Authorization", token("ROLE_USER"))
                .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/book/7/active").header("Authorization", token("ROLE_USER"))
                .contentType("application/json").content("{\"active\":true}"))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/admin/book/7").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        mvc.perform(get("/api/books/7").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/admin/book/7/active").header("Authorization", token("ROLE_ADMIN"))
                .contentType("application/json").content("{\"active\":true}"))
                .andExpect(status().isOk());
        verify(books).setBookActive(7L, true);
    }

    @Test void onlyAdminCanWriteGenres() throws Exception {
        mvc.perform(post("/api/genres/create").header("Authorization", token("ROLE_USER"))
                .contentType("application/json").content("{\"code\":\"TEST\",\"name\":\"Test\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/genres/9").header("Authorization", token("ROLE_USER"))
                .contentType("application/json").content("{\"code\":\"TEST\",\"name\":\"Test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test void onlyAdminCanPermanentlyDeleteBooks() throws Exception {
        BookService books = context.getBean(BookService.class);

        mvc.perform(delete("/api/books/7/permanent").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/books/7/permanent").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk());

        verify(books).hardDeleteBook(7L);
    }

    @Test void onlyAdminCanUploadCoversAndPublicCanReadStoredCovers() throws Exception {
        BookCoverStorageService covers = context.getBean(BookCoverStorageService.class);
        String filename = "d9428888-122b-4f2a-8b2f-28c2cdb71e67.png";
        when(covers.store(any())).thenReturn(new BookCoverUploadResponse(
                "http://localhost:8000/api/book-covers/" + filename, filename, "image/png", 12));
        when(covers.load(filename)).thenReturn(new ByteArrayResource(new byte[]{1, 2, 3}));
        when(covers.mediaTypeFor(filename)).thenReturn("image/png");
        MockMultipartFile image = new MockMultipartFile("file", "cover.png", "image/png", new byte[]{1});

        mvc.perform(multipart("/api/admin/books/covers").file(image)
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/admin/books/covers").file(image)
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageUrl").value("http://localhost:8000/api/book-covers/" + filename));
        mvc.perform(get("/api/book-covers/" + filename))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
