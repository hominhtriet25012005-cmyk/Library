package com.library.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GeneralNotificationResponse {
    private String requestKey;
    private int recipientCount;
    private int storedCount;
    private String message;
}
