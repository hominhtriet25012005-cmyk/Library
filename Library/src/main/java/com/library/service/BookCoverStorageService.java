package com.library.service;

import com.library.exception.InvalidBookCoverException;
import com.library.payload.response.BookCoverUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class BookCoverStorageService {
    public static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 25_000_000L;
    private static final String STORED_FILENAME_PATTERN =
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.(png|jpg)$";

    private final Path storageDirectory;
    private final String publicBaseUrl;

    public BookCoverStorageService(
            @Value("${app.storage.book-covers-dir:uploads/book-covers}") String storageDirectory,
            @Value("${app.storage.public-base-url:http://localhost:8000}") String publicBaseUrl) {
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.replaceAll("/+$", "");
    }

    public BookCoverUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidBookCoverException("Vui lòng chọn ảnh bìa để tải lên.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidBookCoverException("Ảnh bìa không được lớn hơn 5 MB.");
        }

        final byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new InvalidBookCoverException("Không đọc được tệp ảnh đã tải lên.");
        }
        if (bytes.length > MAX_FILE_SIZE) {
            throw new InvalidBookCoverException("Ảnh bìa không được lớn hơn 5 MB.");
        }

        String contentType = detectAndValidateImage(bytes);
        String extension = "image/png".equals(contentType) ? ".png" : ".jpg";
        String filename = UUID.randomUUID() + extension;
        Path destination = storageDirectory.resolve(filename).normalize();
        if (!destination.startsWith(storageDirectory)) {
            throw new InvalidBookCoverException("Tên tệp ảnh không hợp lệ.");
        }

        try {
            Files.createDirectories(storageDirectory);
            Files.write(destination, bytes, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể lưu ảnh bìa trên máy chủ.");
        }

        String imageUrl = publicBaseUrl + "/api/book-covers/" + filename;
        return new BookCoverUploadResponse(imageUrl, filename, contentType, bytes.length);
    }

    public Resource load(String filename) {
        if (filename == null || !filename.matches(STORED_FILENAME_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh bìa.");
        }

        Path imagePath = storageDirectory.resolve(filename).normalize();
        if (!imagePath.startsWith(storageDirectory) || !Files.isRegularFile(imagePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh bìa.");
        }
        try {
            return new UrlResource(imagePath.toUri());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh bìa.");
        }
    }

    private String detectAndValidateImage(byte[] bytes) {
        String contentType;
        if (hasPngSignature(bytes)) {
            contentType = "image/png";
        } else if (hasJpegSignature(bytes)) {
            contentType = "image/jpeg";
        } else {
            throw new InvalidBookCoverException("Chỉ chấp nhận ảnh bìa JPEG hoặc PNG hợp lệ.");
        }

        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) {
                throw new InvalidBookCoverException("Tệp tải lên không phải ảnh JPEG hoặc PNG hợp lệ.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new InvalidBookCoverException("Tệp tải lên không phải ảnh JPEG hoặc PNG hợp lệ.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > 10_000 || height > 10_000
                        || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new InvalidBookCoverException("Kích thước ảnh bìa vượt quá giới hạn cho phép.");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException exception) {
            if (exception instanceof InvalidBookCoverException invalidImage) {
                throw invalidImage;
            }
            throw new InvalidBookCoverException("Tệp tải lên không phải ảnh JPEG hoặc PNG hợp lệ.");
        }

        return contentType;
    }

    private boolean hasPngSignature(byte[] bytes) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (bytes[index] != signature[index]) return false;
        }
        return true;
    }

    private boolean hasJpegSignature(byte[] bytes) {
        return bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF;
    }

    public String mediaTypeFor(String filename) {
        return filename.toLowerCase(Locale.ROOT).endsWith(".png") ? "image/png" : "image/jpeg";
    }
}
