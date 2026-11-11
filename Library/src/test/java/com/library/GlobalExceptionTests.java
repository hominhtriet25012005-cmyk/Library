package com.library;

import com.library.exception.GlobalException;
import com.library.payload.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionTests {

    @Test
    void duplicateFineConstraintReturnsVietnameseConflictResponse() {
        DataIntegrityViolationException error = new DataIntegrityViolationException(
                "could not execute statement",
                new RuntimeException("Duplicate entry for key 'uq_fines_book_loan_type'"));

        ResponseEntity<ApiResponse> response = new GlobalException().handleDataIntegrityViolation(error);

        assertEquals(409, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getStatus());
        assertEquals("Khoản phạt cùng loại đã tồn tại cho lượt mượn này.",
                response.getBody().getMessage());
    }
}
