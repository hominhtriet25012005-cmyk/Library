package com.library.service;

import com.library.domain.FineStatus;
import com.library.domain.FineType;
import com.library.payload.dto.FineDTO;
import com.library.payload.request.CreateFineRequest;
import com.library.payload.request.WaiveFineRequest;
import com.library.payload.response.PageResponse;
import com.library.payload.response.PaymentInitiateResponse;

import java.util.List;

public interface FineService {

    FineDTO createFine(CreateFineRequest createFineRequest);

    PaymentInitiateResponse payFine(Long fineId, String transactionId) throws Exception;

    FineDTO waiveFine(WaiveFineRequest waiveFineRequest) throws Exception;

    List<FineDTO> getMyFines(FineStatus status, FineType type) throws Exception;

    PageResponse<FineDTO> getAllFines(
            FineStatus status,
            FineType type,
            Long userId,
            int page,
            int size
    );
}
