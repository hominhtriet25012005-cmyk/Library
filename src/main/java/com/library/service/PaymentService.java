package com.library.service;


import com.library.payload.dto.PaymentDTO;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.request.PaymentVerifyRequest;
import com.library.payload.response.PaymentInitiateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

    PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) throws Exception;

    PaymentDTO verifyPayment(PaymentVerifyRequest req) throws Exception;

    Page<PaymentDTO> getAllPayments(Pageable pageable);
}
