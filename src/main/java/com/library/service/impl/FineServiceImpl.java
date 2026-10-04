package com.library.service.impl;

import com.library.domain.FineStatus;
import com.library.domain.FineType;
import com.library.domain.PaymentGateway;
import com.library.domain.PaymentType;
import com.library.mapper.FineMapper;
import com.library.modal.BookLoan;
import com.library.modal.Fine;
import com.library.modal.User;
import com.library.payload.dto.FineDTO;
import com.library.payload.request.CreateFineRequest;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.request.WaiveFineRequest;
import com.library.payload.response.PageResponse;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.repository.BookLoanRepository;
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

    private final BookLoanRepository bookLoanRepository;
    private final FineRepository fineRepository;
    private final FineMapper fineMapper;
    private final UserService userService;
    private final PaymentService paymentService;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Override
    public FineDTO createFine(CreateFineRequest createFineRequest) {

        // 1. validate book loan exist
        BookLoan bookLoan = bookLoanRepository.findById(createFineRequest.getBookLoanId())
                .orElseThrow(() -> new RuntimeException("Book loan doesn't exist"));

        // 2. create fine
        Fine fine = Fine.builder()
                .bookLoan(bookLoan)
                .user(bookLoan.getUser())
                .type(createFineRequest.getType())
                .amount(createFineRequest.getAmount())
                .status(FineStatus.PENDING)
                .reason(createFineRequest.getReason())
                .notes(createFineRequest.getNotes())
                .build();

        Fine savedFine = fineRepository.save(fine);

        return fineMapper.toDTO(savedFine);
    }

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
                .orElseThrow(() -> new Exception("Fine not found with id: "));
        entityManager.refresh(fine, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        // 2. Check if already waived or paid
        if (fine.getStatus() == FineStatus.WAIVED) {
            throw new Exception("Fine has already been waived");
        }

        if (fine.getStatus() == FineStatus.PAID) {
            throw new Exception("Fine has already been paid and cannot be waived");
        }

        // 3. Waive the fine
        fine.waive(currentAdmin, waiveFineRequest.getReason());

        // 4. Save and return
        Fine savedFine = fineRepository.save(fine);

        return fineMapper.toDTO(savedFine);
    }

    @Override
    public List<FineDTO> getMyFines(FineStatus status, FineType type) throws Exception {

        User currentUser = userService.getCurrentUser();
        List<Fine> fines;

        // Apply filters based on parameters
        if (status != null && type != null) {
            // Both filters
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status && f.getType() == type)
                    .collect(Collectors.toList());
        } else if (status != null) {
            // Status filter only
            fines = fineRepository.findByUserId(currentUser.getId()).stream()
                    .filter(f -> f.getStatus() == status)
                    .collect(Collectors.toList());
        } else if (type != null) {
            // Type filter only
            fines = fineRepository.findByUserIdAndType(currentUser.getId(), type);
        } else {
            // No filter - all fines for user
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
