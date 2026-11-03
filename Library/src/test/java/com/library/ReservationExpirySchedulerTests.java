package com.library;

import com.library.service.impl.ReservationExpiryScheduler;
import com.library.service.impl.ReservationLifecycleService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ReservationExpirySchedulerTests {

    @Test
    void scheduledScanUsesBoundedBatch() {
        ReservationLifecycleService lifecycle = mock(ReservationLifecycleService.class);

        new ReservationExpiryScheduler(lifecycle).expireAvailableReservations();

        verify(lifecycle).expireAvailableReservations(any(LocalDateTime.class), eq(100));
    }
}
