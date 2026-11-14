package com.library.service.impl;

import com.library.model.Fine;
import com.library.model.Notification;
import com.library.model.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class EmailTemplateRenderer {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public String notificationBody(Notification notification, Payment payment, Fine fine) {
        StringBuilder html = new StringBuilder(baseStart(notification.getTitle()));
        html.append("<p>").append(escape(notification.getMessage()).replace("\n", "<br>")).append("</p>");

        if (payment != null) {
            html.append("<h3>Thông tin giao dịch</h3><ul>")
                    .append(item("Mã giao dịch", "#" + payment.getId()))
                    .append(item("Số tiền", formatAmount(payment.getAmount()) + " " + escape(payment.getCurrency())))
                    .append(item("Thời điểm", formatTime(payment.getCompletedAt() != null
                            ? payment.getCompletedAt() : payment.getInitiatedAt())))
                    .append(item("Mã tham chiếu", firstNonBlank(
                            payment.getGatewayPaymentId(), payment.getTransactionId(), payment.getGatewayOrderId())))
                    .append("</ul>");
        }

        if (fine != null) {
            long total = fine.getAmount() == null ? 0 : fine.getAmount();
            long paid = fine.getAmountPaid() == null ? 0 : fine.getAmountPaid();
            html.append("<h3>Thông tin khoản phạt</h3><ul>")
                    .append(item("Tổng khoản phạt", formatAmount(total) + " đ"))
                    .append(item("Đã thanh toán", formatAmount(paid) + " đ"))
                    .append(item("Còn phải thanh toán", formatAmount(Math.max(0, total - paid)) + " đ"))
                    .append("</ul>");
        }

        String actionLink = safeInternalLink(notification.getActionUrl());
        if (actionLink != null) {
            String base = frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
            html.append("<p><a class=\"button\" href=\"")
                    .append(escape(base + actionLink))
                    .append("\">Xem chi tiết</a></p>");
        }
        return html.append(baseEnd()).toString();
    }

    public String verificationBody(String fullName, String verificationLink) {
        return baseStart("Xác minh địa chỉ email")
                + "<p>Xin chào " + escape(fullName) + ",</p>"
                + "<p>Vui lòng xác minh địa chỉ email để nhận thông báo nghiệp vụ của Thư viện số. "
                + "Liên kết có hiệu lực trong 24 giờ.</p>"
                + "<p><a class=\"button\" href=\"" + escape(verificationLink)
                + "\">Xác minh email</a></p>"
                + "<p>Nếu bạn không tạo tài khoản này, có thể bỏ qua thư.</p>"
                + baseEnd();
    }

    private String baseStart(String title) {
        return "<!doctype html><html lang=\"vi\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" "
                + "content=\"width=device-width,initial-scale=1\"><title>" + escape(title)
                + "</title><style>body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172b4d;"
                + "padding:24px}.card{max-width:640px;margin:auto;background:#fff;border-radius:12px;"
                + "padding:28px;line-height:1.6}.brand{color:#1769ff;font-weight:bold}.button{display:inline-block;"
                + "background:#1769ff;color:#fff!important;padding:12px 18px;border-radius:8px;text-decoration:none}"
                + "li{margin:8px 0}</style></head><body><main class=\"card\"><p class=\"brand\">THƯ VIỆN SỐ</p>"
                + "<h2>" + escape(title) + "</h2>";
    }

    private String baseEnd() {
        return "<hr><p>Trân trọng,<br>Thư viện số</p><p style=\"color:#667085;font-size:12px\">"
                + "Đây là email tự động. Vui lòng không trả lời thư này.</p></main></body></html>";
    }

    private String item(String label, String value) {
        return "<li><strong>" + escape(label) + ":</strong> " + escape(value == null ? "Chưa có" : value) + "</li>";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "Chưa có";
    }

    private String safeInternalLink(String actionUrl) {
        if (actionUrl == null || actionUrl.isBlank() || !actionUrl.startsWith("/")
                || actionUrl.startsWith("//") || actionUrl.contains("\\")
                || actionUrl.contains("\r") || actionUrl.contains("\n")) {
            return null;
        }
        return actionUrl;
    }

    private String formatTime(LocalDateTime value) {
        return value == null ? "Chưa có" : DATE_TIME.format(value);
    }

    private String formatAmount(Long amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount).replace(',', '.');
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
