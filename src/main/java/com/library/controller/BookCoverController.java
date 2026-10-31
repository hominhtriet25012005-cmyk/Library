package com.library.controller;

import com.library.service.BookCoverStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
public class BookCoverController {
    private final BookCoverStorageService storageService;

    @GetMapping("/api/book-covers/{filename}")
    public ResponseEntity<Resource> getCover(@PathVariable String filename) {
        Resource image = storageService.load(filename);
        MediaType mediaType = MediaType.parseMediaType(storageService.mediaTypeFor(filename));
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .body(image);
    }
}
