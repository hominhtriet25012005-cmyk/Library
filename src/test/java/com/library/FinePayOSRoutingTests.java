package com.library;

import com.library.domain.*;
import com.library.modal.*;
import com.library.mapper.*;
import com.library.repository.*;
import com.library.service.*;
import com.library.service.impl.*;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.payload.response.PaymentInitiateResponse;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class FinePayOSRoutingTests {
    @Test void callerNeverSendsClientAmountOrReceipt() throws Exception {
        var users = mock(UserService.class); var payments = mock(PaymentService.class);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        var service = new FineServiceImpl(mock(BookLoanRepository.class), mock(FineRepository.class), new FineMapper(), users, payments);
        service.payFine(8L, null);
        var request = org.mockito.ArgumentCaptor.forClass(PaymentInitiateRequest.class);
        verify(payments).initiatePayment(request.capture());
        assertThat(request.getValue().getGateway()).isEqualTo(PaymentGateway.PAYOS);
        assertThat(request.getValue().getFineId()).isEqualTo(8L);
        assertThat(request.getValue().getAmount()).isNull();
        clearInvocations(payments);
        assertThatThrownBy(() -> service.payFine(8L, "client-receipt")).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(payments);
    }

    @Test void routingIgnoresForgedUserAndAmount() throws Exception {
        var links = mock(PayOSMembershipPaymentService.class); var orders = mock(PayOSFineOrderStore.class);
        var users = mock(UserService.class); var repository = mock(PaymentRepository.class);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        var prepared = new PayOSOrderStore.Prepared(Payment.builder().amount(80000L).build(), true);
        when(orders.prepare(8L, 7L)).thenReturn(prepared);
        var expected = PaymentInitiateResponse.builder().amount(80000L).build();
        when(links.initiatePrepared(prepared)).thenReturn(expected);
        var service = new PaymentServiceImpl(repository, new PaymentMapper(), links, orders, users);
        var request = PaymentInitiateRequest.builder().gateway(PaymentGateway.PAYOS).paymentType(PaymentType.FINE)
                .fineId(8L).userId(99L).amount(1L).build();
        assertThat(service.initiatePayment(request)).isSameAs(expected);
        verify(orders).prepare(8L, 7L);
    }

    @Test void payOSIsTheOnlySupportedGatewayEnumValue() {
        assertThat(PaymentGateway.values()).containsExactly(PaymentGateway.PAYOS);
    }

    @Test void disabledCreationDoesNotPersistFineOrder() throws Exception {
        var links = mock(PayOSMembershipPaymentService.class); var orders = mock(PayOSFineOrderStore.class);
        var users = mock(UserService.class);
        doThrow(new IllegalStateException("disabled")).when(links).assertAvailable();
        var service = new PaymentServiceImpl(mock(PaymentRepository.class), new PaymentMapper(), links, orders, users);
        assertThatThrownBy(() -> service.initiatePayment(PaymentInitiateRequest.builder()
                .gateway(PaymentGateway.PAYOS).paymentType(PaymentType.FINE).fineId(8L).build()))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(orders, users);
    }
}
