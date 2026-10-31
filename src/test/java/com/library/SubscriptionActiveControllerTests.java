package com.library;

import com.library.controller.SubscriptionController;
import com.library.exception.SubscriptionException;
import com.library.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.*;

class SubscriptionActiveControllerTests {
    @Test void noActiveMembershipIsNotFoundInsteadOfServerError() throws Exception {
        var service = mock(SubscriptionService.class);
        when(service.getUsersActiveSubscription(null)).thenThrow(new SubscriptionException("no active subscription found!"));
        var controller = new SubscriptionController(service);

        var failure = catchThrowable(() -> controller.getUsersActiveSubscription(null));
        assertThat(failure).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) failure).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
