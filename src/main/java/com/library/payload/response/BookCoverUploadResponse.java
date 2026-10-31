package com.library.payload.response;

public record BookCoverUploadResponse(
        String imageUrl,
        String filename,
        String contentType,
        long size
) {
}
