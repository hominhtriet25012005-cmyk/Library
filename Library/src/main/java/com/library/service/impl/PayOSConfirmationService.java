package com.library.service.impl;

import com.library.domain.*;
import com.library.model.Payment;
import com.library.repository.PaymentRepository;
import com.library.service.UserService;
import com.library.service.gateway.PayOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.WebhookData;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class PayOSConfirmationService {
    private final ObjectProvider<PayOSService> gateways;
    private final PaymentRepository payments;
    private final PayOSSettlementService settlement;
    private final UserService users;
    private final PayOSFineSettlementService fineSettlement;
    private final PayOSPaymentStateStore paymentStates;

    public record Status(Long paymentId, Long subscriptionId, Long fineId, Long amount, String currency,
                         PaymentStatus status, java.time.LocalDateTime completedAt) {}

    public String webhook(Map<String, Object> body) {
        var gateway = gateway();
        WebhookData data = gateway.verifyWebhook(body);
        if (data == null || data.getOrderCode() == null || data.getOrderCode() <= 0) {
            throw new IllegalArgumentException("Invalid webhook order");
        }
        // Một yêu cầu thiết lập đã được ký hoặc một yêu cầu không xác định tuyệt đối
        // không được phép tạo các hàng mới hay cấp quyền thành viên.
        var payment = payments.findById(data.getOrderCode());
        if (payment.isEmpty()) {
            log.warn("Signed payOS webhook for unknown order {}; no database changes", data.getOrderCode());
            return "IGNORED_UNKNOWN_ORDER";
        }
        if (!"00".equals(data.getCode())) return "IGNORED_NON_SUCCESS";
        if (!"VND".equals(data.getCurrency()) || !Objects.equals(data.getAmount(), payment.get().getAmount())) {
            throw new IllegalArgumentException("Webhook amount/currency mismatch");
        }
        confirm(payment.get(), data);
        return "OK";
    }

    public Status status(Long id) { return snapshot(authorized(id)); }

    public record Resume(Status payment, String checkoutUrl) {}

    public java.util.List<Status> pendingMemberships() {
        Long userId = users.getCurrentUser().getId();
        return payments.findByUserIdAndPaymentTypeAndGatewayAndStatusInOrderByIdDesc(
                userId, PaymentType.MEMBERSHIP, PaymentGateway.PAYOS,
                java.util.List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
                org.springframework.data.domain.PageRequest.of(0, 100))
                .stream().map(this::snapshot).toList();
    }

    /** Recover an existing order only; never create a gateway order here. */
    public Resume resume(Long id) {
        Payment payment = authorized(id);
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING) {
            return new Resume(snapshot(payment), null);
        }
        // Reuse receipt validation and settlement, including partial-payment safeguards.
        confirm(payment, null);
        payment = authorized(id);
        // PROCESSING cũng được dùng khi link vừa tạo; quyền tiếp tục thanh toán
        // phải được xác nhận bằng trạng thái và số tiền đã trả từ payOS bên dưới.
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING) {
            return new Resume(snapshot(payment), null);
        }
        var link = gateway().getPaymentLink(id);
        if (payment.getGateway() != PaymentGateway.PAYOS || !"VND".equals(payment.getCurrency())
                || link == null || !Objects.equals(link.getOrderCode(), id)
                || !Objects.equals(link.getAmount(), payment.getAmount())
                || link.getId() == null || !link.getId().matches("[a-zA-Z0-9-]{1,128}")
                || (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(link.getId()))) {
            throw new IllegalArgumentException("Gateway order mismatch");
        }
        if (link.getStatus() != PaymentLinkStatus.PENDING || !Long.valueOf(0).equals(link.getAmountPaid())) {
            confirm(payment, null);
            return new Resume(snapshot(authorized(id)), null);
        }
        // Official payOS hosted checkout route; ID comes only from authenticated gateway lookup.
        return new Resume(snapshot(payment), "https://pay.payos.vn/web/" + link.getId());
    }

    public Status reconcile(Long id) {
        Payment payment = authorized(id);
        confirm(payment, null);
        return snapshot(authorized(id));
    }

    private void confirm(Payment payment, WebhookData webhook) {
        if (payment.getGateway() != PaymentGateway.PAYOS || (payment.getPaymentType() != PaymentType.MEMBERSHIP
                && payment.getPaymentType() != PaymentType.FINE)
                || !"VND".equals(payment.getCurrency())) {
            throw new IllegalArgumentException("payOS membership or fine payment required");
        }
        var link = gateway().getPaymentLink(payment.getId());
        if (link == null || !Objects.equals(link.getOrderCode(), payment.getId())
                || !Objects.equals(link.getAmount(), payment.getAmount()) || link.getId() == null || link.getId().isBlank()
                || (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(link.getId()))
                || (webhook != null && !link.getId().equals(webhook.getPaymentLinkId()))) {
            throw new IllegalArgumentException("Gateway order mismatch");
        }
        if (link.getStatus() != PaymentLinkStatus.PAID) {
            paymentStates.synchronizeNonPaidStatus(payment.getId(), link.getStatus());
            if (webhook != null && (link.getStatus() == PaymentLinkStatus.PENDING
                    || link.getStatus() == PaymentLinkStatus.PROCESSING
                    || link.getStatus() == PaymentLinkStatus.UNDERPAID)) {
                throw new IllegalStateException("Payment not confirmed by gateway yet");
            }
            return;
        }
        if (!Objects.equals(link.getAmountPaid(), payment.getAmount()) || !Long.valueOf(0).equals(link.getAmountRemaining())
                || link.getTransactions() == null || link.getTransactions().size() != 1) {
            throw new IllegalArgumentException("Partial/overpaid or multiple receipts require manual reconciliation");
        }
        var receipt = link.getTransactions().get(0);
        if (!Objects.equals(receipt.getAmount(), payment.getAmount())
                || (webhook != null && !Objects.equals(receipt.getReference(), webhook.getReference()))) {
            throw new IllegalArgumentException("Gateway receipt mismatch");
        }
        if (payment.getPaymentType() == PaymentType.FINE) {
            fineSettlement.complete(payment.getId(),
                    link.getId(),
                    link.getAmount(), "VND",
                    receipt.getReference());
        } else {
            settlement.complete(payment.getId(),
                    link.getId(),
                    link.getAmount(), "VND",
                    receipt.getReference());
        }
    }

    private PayOSService gateway() {
        var gateway = gateways.getIfAvailable();
        if (gateway == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "payOS is disabled");
        return gateway;
    }

    private Payment authorized(Long id) {
        com.library.model.User user;
        try { user = users.getCurrentUser(); }
        catch (Exception ex) {
            throw new AccessDeniedException("Authentication required"); }

        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (user.getRole() != UserRole.ROLE_ADMIN && !Objects.equals(payment.getUser().getId(), user.getId())) {
            throw new AccessDeniedException("Payment access denied");
        }
        return payment;
    }

    private Status snapshot(Payment payment) {
        return new Status(payment.getId(), payment.getSubscription() == null ? null : payment.getSubscription().getId(),
                payment.getFine() == null ? null : payment.getFine().getId(),
                payment.getAmount(), payment.getCurrency(), payment.getStatus(), payment.getCompletedAt());
    }
}
