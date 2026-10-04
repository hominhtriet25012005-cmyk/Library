package com.library;

import com.library.modal.Subscription;
import com.library.modal.SubscriptionPlan;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;

class MembershipVndTests {
    private Subscription subscription(String price, String currency) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setPrice(new BigDecimal(price));
        plan.setCurrency(currency);
        plan.setDurationDays(30);
        return Subscription.builder().plan(plan).build();
    }

    @Test void capturesWholeDongAndCurrency() {
        Subscription sub = subscription("100000.00", "VND");
        sub.initializeFromPlan();
        assertThat(sub.getPrice()).isEqualTo(100000L);
        assertThat(sub.getCurrency()).isEqualTo("VND");
    }

    @Test void rejectsFractionZeroOverflowAndForeignCurrency() {
        for (String value : new String[]{"100.50", "0", "-1", "9223372036854775808"}) {
            assertThatThrownBy(() -> subscription(value, "VND").initializeFromPlan())
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> subscription("100", "INR").initializeFromPlan())
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void planMapperValidatesPrecisionAndCurrency() {
        var mapper = new com.library.mapper.SubscriptionPlanMapper();
        var dto = new com.library.payload.dto.SubscriptionPlanDTO();
        dto.setPrice(new BigDecimal("100000.00"));
        dto.setCurrency("vnd");
        assertThat(mapper.toEntity(dto).getCurrency()).isEqualTo("VND");
        for (String invalid : new String[]{"0", "1.50", "100000000"}) {
            dto.setPrice(new BigDecimal(invalid));
            assertThatThrownBy(() -> mapper.toEntity(dto)).isInstanceOf(IllegalArgumentException.class);
        }
        dto.setPrice(new BigDecimal("100")); dto.setCurrency("INR");
        assertThatThrownBy(() -> mapper.toEntity(dto)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void subscriptionMapperIgnoresClientIdentityAndPrice() throws Exception {
        var mapper = new com.library.mapper.SubscriptionMapper(null, null);
        var dto = new com.library.payload.dto.SubscriptionDTO();
        dto.setId(99L); dto.setUserId(99L); dto.setPrice(1L); dto.setCurrency("INR");
        var user = com.library.modal.User.builder().id(7L).build();
        var sub = mapper.toEntity(dto, subscription("100000", "VND").getPlan(), user);
        sub.initializeFromPlan();
        assertThat(sub.getId()).isNull();
        assertThat(sub.getUser()).isSameAs(user);
        assertThat(sub.getPrice()).isEqualTo(100000L);
        assertThat(mapper.toDTO(sub).getCurrency()).isEqualTo("VND");
    }
}
