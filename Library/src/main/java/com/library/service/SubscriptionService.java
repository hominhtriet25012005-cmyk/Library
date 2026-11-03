package com.library.service;

import com.library.exception.SubscriptionException;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.payload.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SubscriptionService {

    PaymentInitiateResponse subscribe(SubscriptionDTO subscriptionDTO) throws Exception;

    SubscriptionDTO getUsersActiveSubscription(Long userId) throws Exception;

    SubscriptionDTO cancelSubscription(Long subscriptionId, String reason) throws SubscriptionException;

    SubscriptionDTO activateSubscription(Long subscriptionId, Long paymentId) throws SubscriptionException;

    List<SubscriptionDTO> getAllSubscriptions(Pageable pageable);

    PageResponse<SubscriptionDTO> searchAdminSubscriptions(Long userId, Long planId, Boolean active, Pageable pageable);

    void deactivateExpiredSubscriptions() throws Exception;
}
