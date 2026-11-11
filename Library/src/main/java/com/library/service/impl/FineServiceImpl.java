package com.library.service.impl;

import com.library.domain.FineStatus;
import com.library.domain.FineType;
import com.library.domain.PaymentGateway;
import com.library.domain.PaymentType;
import com.library.mapper.FineMapper;
import com.library.model.Fine;
import com.library.model.User;
import com.library.payload.dto.FineDTO;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.request.WaiveFineRequest;
import com.library.payload.response.PageResponse;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.repository.FineRepository;
import com.library.service.FineService;
import com.library.service.PaymentService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineServiceImpl implements FineService {

    private final FineRepository fineRepository;
    private final FineMapper fineMapper;
    private final UserService userService;
    private final PaymentService paymentService;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Override
    public PaymentInitiateResponse payFine(Long fineId, String transactionId) throws Exception {
        if (transactionId != null && !transactionId.isBlank()) {
            throw new IllegalArgumentException("Transaction reference must come from verified payOS evidence");
        }
        User user = userService.getCurrentUser();

        PaymentInitiateRequest request = PaymentInitiateRequest
                .builder()
                .userId(user.getId())
                .fineId(fineId)
                .paymentType(PaymentType.FINE)
                .gateway(PaymentGateway.PAYOS)
                .description("library fine payment")
                .build();

        return paymentService.initiatePayment(request);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public FineDTO waiveFine(WaiveFineRequest waiveFineRequest) throws Exception {
        User currentAdmin = userService.getCurrentUser();
        if (currentAdmin.getRole() != com.library.domain.UserRole.ROLE_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Administrator required");
        }
        Fine fine = fineRepository.findLockedById(waiveFineRequest.getFineId())
                .orElseThrow(() -> new IllegalArgumentException("Fine not found with id: " + waiveFineRequest.getFineId()));
        entityManager.refresh(fine, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        // 2. Kiểm tra xem đã được miễn hoặc đã thanh toán hay chưa
        if (fine.getStatus() == FineStatus.WAIVED) {
            throw new IllegalStateException("Fine has already been waived");
        }

        if (fine.getStatus() == FineStatus.PAID) {
            throw new IllegalStateException("Fine has already been paid and cannot be waived");
        }

        // 3. Miễn tiền phạt
        fine.waive(currentAdmin, waiveFineRequest.getReason());

        // 4. Lưu và quay lại
        Fine savedFine = fineRepository.save(fine);

        return fineMapper.toDTO(savedFine);
    }

    @Override
    public List<FineDTO> getMyFines(FineStatus status, FineType type) throws Exception {

        User currentUser = userService.getCurrentUser();
        List<Fine> fines;

        // Áp dụng các bộ lọc dựa trên các tham số
        if (status != null && type != null) {
            // Cả hai bộ lọc
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status && f.getType() == type)
                    .collect(Collectors.toList());
        } else if (status != null) {
            // Chỉ lọc theo trạng thái
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status)
                    .collect(Collectors.toList());
        } else if (type != null) {
            // Chỉ lọc theo loại
            fines = fineRepository.findByUserIdAndType(currentUser.getId(), type);
        } else {
            // Không có bộ lọc - tất cả các khoản phạt dành cho người dùng.
            fines = fineRepository.findByUserId(currentUser.getId());
        }

        return fines.stream().map(fineMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public PageResponse<FineDTO> getAllFines(FineStatus status, FineType type, Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Page<Fine> finePage = fineRepository.findAllWithFilters(
                userId,
                status,
                type,
                pageable
        );

        return convertToPageResponse(finePage);
    }

    private PageResponse<FineDTO> convertToPageResponse(Page<Fine> finePage) {
        List<FineDTO> fineDTOs = finePage.getContent()
                .stream()
                .map(fineMapper::toDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                fineDTOs,
                finePage.getNumber(),
                finePage.getSize(),
                finePage.getTotalElements(),
                finePage.getTotalPages(),
                finePage.isLast(),
                finePage.isFirst(),
                finePage.isEmpty()
        );
    }
}
