package com.library.configrations;

import com.library.controller.FineController;
import com.library.controller.PaymentController;
import com.library.controller.PayOSController;
import com.library.payload.dto.FineDTO;
import com.library.payload.dto.PaymentDTO;
import com.library.payload.response.PageResponse;
import com.library.service.FineService;
import com.library.service.PaymentService;
import com.library.service.impl.PayOSConfirmationService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminFinanceHttpTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, FineController.class, PaymentController.class, PayOSController.class,
            SecurityTestSupport.Beans.class})
    static class Config {
        @Bean FineService fines() { return mock(FineService.class); }
        @Bean PaymentService payments() { return mock(PaymentService.class); }
        @Bean PayOSConfirmationService confirmation() { return mock(PayOSConfirmationService.class); }
    }

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext()); context.register(Config.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
    }

    @AfterEach void close() { context.close(); }

    private String token(String role) {
        return SecurityTestSupport.token(role);
    }

    @Test void adminMayReadFinanceAndUserMayNot() throws Exception {
        when(context.getBean(FineService.class).getAllFines(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PageResponse<>(List.of(FineDTO.builder().id(1L).build()), 0, 20, 1, 1, true, true, false));
        when(context.getBean(PaymentService.class).getAllPayments(any()))
                .thenReturn(new PageImpl<>(List.of(new PaymentDTO()), PageRequest.of(0, 10), 1));
        when(context.getBean(PayOSConfirmationService.class).status(9L))
                .thenReturn(new PayOSConfirmationService.Status(9L, null, 1L, 10000L, "VND",
                        com.library.domain.PaymentStatus.PENDING, null));

        mvc.perform(get("/api/fines").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/payments").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/fines").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/payments").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/payments/9/status").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(get("/api/fines?size=101").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isBadRequest());
    }
}
