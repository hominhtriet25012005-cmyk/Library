package com.library.configrations;

import com.library.controller.ReservationController;
import com.library.payload.dto.ReservationDTO;
import com.library.payload.response.PageResponse;
import com.library.repository.ReservationRepository;
import com.library.service.ReservationService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminReservationsHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, ReservationController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean ReservationService reservations() { return mock(ReservationService.class); }
        @Bean ReservationRepository repository() { return mock(ReservationRepository.class); }
    }

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
    }

    @AfterEach void close() { context.close(); }

    private String token(String role) {
        return SecurityTestSupport.token(role);
    }

    @Test void onlyAdminCanSearchAllReservationsAndFulfill() throws Exception {
        ReservationService reservations=context.getBean(ReservationService.class);
        when(reservations.searchReservations(any())).thenReturn(new PageResponse<>(List.of(),0,10,0,0,true,true,true));
        when(reservations.fulfillReservation(9L)).thenReturn(ReservationDTO.builder().id(9L).build());

        mvc.perform(post("/api/reservations/search").header("Authorization",token("ROLE_USER"))
                .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/reservations/9/fulfill").header("Authorization",token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/reservations/search").header("Authorization",token("ROLE_ADMIN"))
                .contentType("application/json").content("{}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(post("/api/reservations/9/fulfill").header("Authorization",token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(9));
    }
}
