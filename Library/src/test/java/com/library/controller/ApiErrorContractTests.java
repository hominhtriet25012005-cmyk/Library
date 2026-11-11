package com.library.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.response.ApiResponse;
import com.library.service.FineService;
import com.library.service.SubscriptionService;
import com.library.service.impl.PayOSConfirmationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class ApiErrorContractTests {

    @Test
    void controllerErrorsUseOneVietnameseApiResponseShape() {
        FineController fines = new FineController(mock(FineService.class));
        SubscriptionController subscriptions = new SubscriptionController(mock(SubscriptionService.class));
        PayOSController payOS = new PayOSController(mock(PayOSConfirmationService.class));

        assertError(fines.invalid(), 400, "Yêu cầu thanh toán tiền phạt không hợp lệ");
        assertError(fines.denied(), 403, "Quyền truy cập bị từ chối");
        assertError(subscriptions.activeMembership(), 409,
                "Đã có một tư cách thành viên đang hoạt động");
        assertError(payOS.invalid(), 400, "Bằng chứng thanh toán không hợp lệ");
    }

    @Test
    void bookLoanDtoDoesNotPublishUnmappedFineFields() throws Exception {
        String json = new ObjectMapper().writeValueAsString(new BookLoanDTO());

        assertFalse(json.contains("fineAmount"));
        assertFalse(json.contains("finePaid"));
    }

    private void assertError(ResponseEntity<?> response, int status, String message) {
        assertEquals(status, response.getStatusCode().value());
        assertInstanceOf(ApiResponse.class, response.getBody());
        ApiResponse body = (ApiResponse) response.getBody();
        assertEquals(message, body.getMessage());
        assertFalse(body.getStatus());
    }
}
