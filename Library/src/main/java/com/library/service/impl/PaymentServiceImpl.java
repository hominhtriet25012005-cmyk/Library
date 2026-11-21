package com.library.service.impl;

import com.library.domain.*;
import com.library.mapper.PaymentMapper;
import com.library.payload.dto.PaymentDTO;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.repository.PaymentRepository;
import com.library.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final PayOSMembershipPaymentService payOSMembership;
    private final PayOSFineOrderStore fineOrders;
    private final UserService users;

    @Override
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) throws Exception {
        if (request == null || request.getGateway() != PaymentGateway.PAYOS) {
            throw new IllegalArgumentException("Only payOS payment creation is supported");
        }
        if (request.getPaymentType() == PaymentType.MEMBERSHIP) {
            return payOSMembership.initiate(request.getSubscriptionId());
        }
        if (request.getPaymentType() == PaymentType.FINE) {
            payOSMembership.assertAvailable();
            return payOSMembership.initiatePrepared(fineOrders.prepare(request.getFineId(), users.getCurrentUser().getId()));
        }
        throw new IllegalArgumentException("Unsupported payment type");
    }

    @Override
    public Page<PaymentDTO> searchPayments(Pageable pageable, String search, PaymentType type, PaymentStatus status) {
        return paymentRepository.findAll((org.springframework.data.jpa.domain.Specification<com.library.model.Payment>) (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (type != null) predicates.add(cb.equal(root.get("paymentType"), type));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (search != null && !search.isBlank()) {
                String term = search.trim().toLowerCase(java.util.Locale.ROOT);
                var user = root.join("user");
                predicates.add(cb.or(
                    cb.gt(cb.locate(((org.hibernate.query.criteria.JpaExpression<Long>) root.<Long>get("id")).cast(String.class), term), 0),
                    cb.gt(cb.locate(cb.lower(user.get("fullName")), term), 0),
                    cb.gt(cb.locate(cb.lower(user.get("email")), term), 0),
                    cb.gt(cb.locate(cb.lower(root.get("gatewayOrderId")), term), 0)));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, pageable).map(paymentMapper::toDTO);
    }

    @Override
    public Page<PaymentDTO> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable).map(paymentMapper::toDTO);
    }
}
