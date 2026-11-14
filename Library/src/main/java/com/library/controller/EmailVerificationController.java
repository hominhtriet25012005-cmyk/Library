package com.library.controller;

import com.library.payload.request.ForgotPasswordRequest;
import com.library.payload.response.ApiResponse;
import com.library.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class EmailVerificationController {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[A-Za-z0-9_-]{43}");
    private static final String HTML_TYPE = "text/html;charset=UTF-8";
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/verification-email")
    public ResponseEntity<ApiResponse> requestVerificationEmail(
            @Valid @RequestBody ForgotPasswordRequest request) {
        emailVerificationService.requestResend(request.getEmail());
        return ResponseEntity.ok(new ApiResponse(
                "Nếu địa chỉ email thuộc tài khoản chưa xác minh, hướng dẫn sẽ được gửi.", true));
    }

    @GetMapping(value = "/verify-email", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> confirmationPage(@RequestParam(required = false) String token) {
        if (token == null || !TOKEN_PATTERN.matcher(token).matches()) {
            return htmlPage("Liên kết xác minh không hợp lệ", "Vui lòng yêu cầu gửi lại email xác minh.", false);
        }
        String form = "<form method=\"post\" action=\"/auth/verify-email\">"
                + "<input type=\"hidden\" name=\"token\" value=\"" + token + "\">"
                + "<button type=\"submit\">Xác minh địa chỉ email</button></form>"
                + "<p>Liên kết có hiệu lực trong 24 giờ.</p>";
        return htmlPage("Xác minh địa chỉ email", form, true);
    }

    @PostMapping(value = "/verify-email", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> confirmEmail(@RequestParam(required = false) String token) {
        boolean verified = emailVerificationService.verify(token);
        if (verified) {
            return htmlPage("Email đã được xác minh", "Bạn đã xác minh email thành công. Có thể đóng trang này.", true);
        }
        return htmlPage("Không thể xác minh email",
                "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu gửi lại email.", false);
    }

    private ResponseEntity<String> htmlPage(String title, String content, boolean success) {
        String color = success ? "#1769ff" : "#b42318";
        String body = "<!doctype html><html lang=\"vi\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>"
                + title + " - Thư viện số</title><style>body{font-family:Arial,sans-serif;background:#f3f6fb;"
                + "color:#172b4d;padding:24px}.card{max-width:560px;margin:8vh auto;background:#fff;"
                + "padding:32px;border-radius:14px;box-shadow:0 8px 30px #172b4d20}h1{color:" + color
                + "}button{border:0;border-radius:8px;padding:12px 18px;background:#1769ff;color:#fff;"
                + "font-weight:bold;cursor:pointer}</style></head><body><main class=\"card\">"
                + "<p><strong>THƯ VIỆN SỐ</strong></p><h1>" + title + "</h1>" + content
                + "</main></body></html>";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(HTML_TYPE)).body(body);
    }
}
