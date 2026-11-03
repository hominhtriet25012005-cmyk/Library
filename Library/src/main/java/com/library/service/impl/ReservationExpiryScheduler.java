package com.library.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private static final int EXPIRY_BATCH_SIZE = 100;

    private final ReservationLifecycleService reservationLifecycleService;

    @Scheduled(
            fixedDelayString = "${app.reservations.expiry-scan-delay-ms:60000}",
            initialDelayString = "${app.reservations.expiry-scan-initial-delay-ms:60000}")
    public void expireAvailableReservations() {
        reservationLifecycleService.expireAvailableReservations(
                LocalDateTime.now(), EXPIRY_BATCH_SIZE);
    }
}
