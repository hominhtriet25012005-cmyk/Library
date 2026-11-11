package com.library.payload.request;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReturnBookRequest {

    @Size(max = 500, message = "Ghi chú yêu cầu trả sách không được vượt quá 500 ký tự.")
    private String note;
}
