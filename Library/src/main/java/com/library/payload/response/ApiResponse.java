package com.library.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {

    private String message;

    private Boolean status;

    private String errorCode;

    public ApiResponse(String message, Boolean status) {
        this(message, status, null);
    }

    public ApiResponse(String message, Boolean status, String errorCode) {
        this.message = message;
        this.status = status;
        this.errorCode = errorCode;
    }
}
