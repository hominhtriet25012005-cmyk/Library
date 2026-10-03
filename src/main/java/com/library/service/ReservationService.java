package com.library.service;

import com.library.modal.Reservation;
import com.library.payload.dto.ReservationDTO;
import com.library.payload.request.ReservationRequest;
import com.library.payload.request.ReservationSearchRequest;
import com.library.payload.response.PageResponse;


public interface ReservationService {

    ReservationDTO createReservation(ReservationRequest reservationRequest) throws Exception;

    ReservationDTO createReservationForUser(ReservationRequest reservationRequest, Long userId) throws Exception;

    ReservationDTO cancelReservation(Long reservationId) throws Exception;

    ReservationDTO fulfillReservation(Long reservationId) throws Exception;

    /**
     * Get my reservations (current user) with filters
     * @param searchRequest Search criteria
     * @return Paginated reservations
     */
    PageResponse<ReservationDTO> getMyReservations(ReservationSearchRequest searchRequest) throws Exception;

    PageResponse<ReservationDTO> searchReservations(ReservationSearchRequest searchRequest);
}
