package com.library;

import com.library.exception.InvalidBookCoverException;
import com.library.exception.GlobalException;
import com.library.payload.response.BookCoverUploadResponse;
import com.library.service.BookCoverStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class BookCoverStorageServiceTests {
    @TempDir Path storageDirectory;

    private BookCoverStorageService service() {
        return new BookCoverStorageService(storageDirectory.toString(), "http://localhost:8000");
    }

    private byte[] pngImage() throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }

    @Test void storesSupportedImageWithGeneratedNameAndPublicUrl() throws Exception {
        BookCoverStorageService service = service();
        BookCoverUploadResponse response = service.store(
                new MockMultipartFile("file", "my cover.png", "image/png", pngImage()));

        assertTrue(response.filename().matches("[0-9a-f-]{36}\\.png"));
        assertEquals("image/png", response.contentType());
        assertEquals("http://localhost:8000/api/book-covers/" + response.filename(), response.imageUrl());
        assertTrue(Files.isRegularFile(storageDirectory.resolve(response.filename())));
        assertArrayEquals(pngImage(), Files.readAllBytes(storageDirectory.resolve(response.filename())));
    }

    @Test void acceptsJpegAndUsesGeneratedJpgExtension() throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", output);
        BookCoverUploadResponse response = service().store(
                new MockMultipartFile("file", "cover.jpg", "image/jpeg", output.toByteArray()));

        assertTrue(response.filename().endsWith(".jpg"));
        assertEquals("image/jpeg", response.contentType());
        assertTrue(Files.isRegularFile(storageDirectory.resolve(response.filename())));
    }

    @Test void rejectsNonImagePayloadEvenWhenClientClaimsPng() {
        MockMultipartFile file = new MockMultipartFile("file", "cover.png", "image/png",
                "<script>alert(1)</script>".getBytes());

        assertThrows(InvalidBookCoverException.class, () -> service().store(file));
        assertEquals(0, fileCount());
    }

    @Test void rejectsImageLargerThanFiveMegabytes() {
        byte[] oversized = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile("file", "cover.png", "image/png", oversized);

        assertThrows(InvalidBookCoverException.class, () -> service().store(file));
        assertEquals(0, fileCount());
    }

    @Test void rejectsImagesWithExcessiveDimensions() throws Exception {
        BufferedImage image = new BufferedImage(10_001, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);

        assertThrows(InvalidBookCoverException.class, () -> service().store(
                new MockMultipartFile("file", "wide.png", "image/png", output.toByteArray())));
        assertEquals(0, fileCount());
    }

    @Test void rejectsUnsupportedOrUnsafeStoredFileNames() {
        assertThrows(ResponseStatusException.class, () -> service().load("../../application.properties"));
        assertThrows(ResponseStatusException.class, () -> service().load("cover.svg"));
    }

    @Test void invalidUploadUsesClientErrorResponse() {
        var response = new GlobalException().handleInvalidBookCover(
                new InvalidBookCoverException("Chỉ chấp nhận ảnh JPEG hoặc PNG hợp lệ."));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().getStatus());
    }

    private long fileCount() {
        try (var files = Files.list(storageDirectory)) {
            return files.count();
        } catch (Exception ignored) {
            return 0;
        }
    }
}
