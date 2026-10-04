package com.library;
import com.library.modal.Fine;
import com.library.domain.FineStatus;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class FinePaymentTests {
    @Test void paymentDtoKeepsFineAndLoanLinkWithoutSignature() {
        var payment = com.library.modal.Payment.builder()
                .fine(Fine.builder().id(8L).build())
                .bookLoan(com.library.modal.BookLoan.builder().id(9L).build())
                .gatewaySignature("must-not-expose").build();
        var dto = new com.library.mapper.PaymentMapper().toDTO(payment);
        assertThat(dto.getFineId()).isEqualTo(8L);
        assertThat(dto.getBookLoanId()).isEqualTo(9L);
        assertThat(dto.getGatewaySignature()).isNull();
        assertThat(dto.getCurrency()).isEqualTo("VND");
    }
    @Test void partialPaymentAndMapperExposeRemainingBalance() {
        Fine fine = Fine.builder().amount(100000L).build();
        fine.applyPayment(20000L);
        assertThat(fine.getStatus()).isEqualTo(FineStatus.PARTIALLY_PAID);
        assertThat(fine.getPaidAt()).isNull();
        var dto = new com.library.mapper.FineMapper().toDTO(fine);
        assertThat(dto.getAmountPaid()).isEqualTo(20000L);
        assertThat(dto.getAmountOutstanding()).isEqualTo(80000L);
        fine.setStatus(FineStatus.WAIVED);
        assertThat(new com.library.mapper.FineMapper().toDTO(fine).getAmountOutstanding()).isZero();
    }
    @Test void countsPaidAmountAndOnlyCompletesAtFullBalance() {
        Fine fine = Fine.builder().amount(100000L).amountPaid(20000L).build();
        fine.applyPayment(80000L);
        assertThat(fine.getAmountPaid()).isEqualTo(100000L);
        assertThat(fine.getStatus()).isEqualTo(FineStatus.PAID);
        assertThatThrownBy(() -> fine.applyPayment(1L)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void rejectsOverpaymentAndWaivedFine() {
        Fine fine = Fine.builder().amount(100000L).amountPaid(20000L).build();
        assertThatThrownBy(() -> fine.applyPayment(80001L)).isInstanceOf(IllegalArgumentException.class);
        fine.setStatus(FineStatus.WAIVED);
        assertThatThrownBy(() -> fine.applyPayment(80000L)).isInstanceOf(IllegalArgumentException.class);
    }
}
