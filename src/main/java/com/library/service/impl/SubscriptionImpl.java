package com.library.service.impl;

import com.library.domain.PaymentGateway;
import com.library.domain.PaymentType;
import com.library.exception.SubscriptionException;
import com.library.mapper.SubscriptionMapper;
import com.library.modal.Subscription;
import com.library.modal.SubscriptionPlan;
import com.library.modal.User;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.payload.response.PageResponse;
import com.library.repository.SubscriptionPlanRepository;
import com.library.repository.SubscriptionRepository;
import com.library.service.PaymentService;
import com.library.service.SubscriptionService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionMapper subscriptionMapper;
    private final UserService userService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentService paymentService;
    private final PayOSMembershipPaymentService payOSMembership;
    private final PayOSOrderStore payOSOrderStore;
    private final com.library.repository.PaymentRepository payments;

    @Override
    public PaymentInitiateResponse subscribe(SubscriptionDTO subscriptionDTO) throws Exception {
        payOSMembership.assertAvailable();
        if (subscriptionDTO == null || subscriptionDTO.getPlanId() == null || subscriptionDTO.getId() != null) {
            throw new IllegalArgumentException("A plan ID is required; subscription ID must not be supplied");
        }

        User user = userService.getCurrentUser();

        Long subscriptionId = payOSOrderStore.draftSubscription(subscriptionDTO.getPlanId(),
                user.getId(), subscriptionDTO.getNotes());

        PaymentInitiateRequest paymentInitiateRequest = PaymentInitiateRequest
                .builder()
                .userId(user.getId())
                .subscriptionId(subscriptionId)
                .paymentType(PaymentType.MEMBERSHIP)
                .gateway(PaymentGateway.PAYOS)
                // Amount/currency are read from the stored subscription, not this request.
                .build();

        return paymentService.initiatePayment(paymentInitiateRequest);
    }

    @Override
    public SubscriptionDTO getUsersActiveSubscription(Long userId) throws Exception {
        User user = userService.getCurrentUser();
        Long targetId = userId == null ? user.getId() : userId;
        if (!java.util.Objects.equals(targetId, user.getId())
                && user.getRole() != com.library.domain.UserRole.ROLE_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Subscription access denied");
        }

        Subscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(targetId, LocalDate.now())
                .orElseThrow(() -> new SubscriptionException("no active subscription found!"));

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public SubscriptionDTO cancelSubscription(Long subscriptionId, String reason) throws SubscriptionException {

        Subscription subscription = subscriptionRepository.findLockedById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException(
                        "Không tìm thấy gói đăng ký với ID này: " + subscriptionId));
        User current;
        try { current = userService.getCurrentUser(); }
        catch (Exception ex) { throw new org.springframework.security.access.AccessDeniedException("Authentication required"); }
        if (current.getRole() != com.library.domain.UserRole.ROLE_ADMIN
                && !java.util.Objects.equals(current.getId(), subscription.getUser().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Subscription access denied");
        }

        if (!subscription.getIsActive()) {
            throw new SubscriptionException("Gói đăng ký hiện không còn hiệu lực.");
        }

        // Mark as cancelled
        subscription.setIsActive(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason != null ? reason : "Đã hủy đăng ký người dùng");

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId) throws SubscriptionException {
        throw new SubscriptionException("Legacy activation retired; payOS settlement activates membership atomically");
    }

    @Override
    public List<SubscriptionDTO> getAllSubscriptions(Pageable pageable) {
        return subscriptionMapper.toDTOList(subscriptionRepository.findAll());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PageResponse<SubscriptionDTO> searchAdminSubscriptions(Long userId, Long planId, Boolean active, Pageable pageable) {
        var found = subscriptionRepository.searchAdminSubscriptions(userId, planId, active, pageable);
        return new PageResponse<>(found.getContent().stream().map(subscriptionMapper::toDTO).toList(),
                found.getNumber(), found.getSize(), found.getTotalElements(), found.getTotalPages(),
                found.isLast(), found.isFirst(), found.isEmpty());
    }

    @Override
    public void deactivateExpiredSubscriptions() throws Exception {
        List<Subscription> expiredSubscriptions = subscriptionRepository
                .findExpiredActiveSubscriptions(LocalDate.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
            subscriptionRepository.save(subscription);
        }
    }

}
