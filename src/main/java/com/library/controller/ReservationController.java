package com.library.controller;

import com.library.domain.ReservationStatus;
import com.library.exception.BookException;
import com.library.payload.dto.ReservationDTO;
import com.library.payload.request.ReservationRequest;
import com.library.payload.request.ReservationSearchRequest;
import com.library.payload.response.PageResponse;
import com.library.repository.ReservationRepository;
import com.library.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<?> createReservation(
            @Valid @RequestBody ReservationRequest reservationRequest
    ) throws Exception {

        ReservationDTO reservationDTO = reservationService
                .createReservation(reservationRequest);

        return ResponseEntity.ok(reservationDTO);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createReservationForUser(
            @PathVariable Long userId,
            @Valid @RequestBody ReservationRequest reservationRequest
    ) throws Exception {

        ReservationDTO reservation = reservationService
                .createReservationForUser(reservationRequest, userId);

        return new ResponseEntity<>(
                reservation,
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long id
    ) throws Exception {

        ReservationDTO reservation = reservationService.cancelReservation(id);
        return ResponseEntity.ok(reservation);
    }

    @PostMapping("/{id}/fulfill")
    public ResponseEntity<?> fulfillReservation(
            @PathVariable Long id
    ) throws BookException, Exception {

        ReservationDTO reservation = reservationService.fulfillReservation(id);
        return ResponseEntity.ok(reservation);
    }

    @GetMapping("/my")
    public ResponseEntity<PageResponse<ReservationDTO>> getMyReservations(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "reservedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) throws Exception {

        ReservationSearchRequest searchRequest = new ReservationSearchRequest();
        searchRequest.setStatus(status);
        searchRequest.setActiveOnly(activeOnly);
        searchRequest.setPage(page);
        searchRequest.setSize(size);
        searchRequest.setSortBy(sortBy);
        searchRequest.setSortDirection(sortDirection);

        PageResponse<ReservationDTO> reservations = reservationService
                .getMyReservations(searchRequest);

        return ResponseEntity.ok(reservations);
    }

}
