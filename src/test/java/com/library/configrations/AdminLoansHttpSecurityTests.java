package com.library.configrations;

import com.library.controller.BookLoanController;
import com.library.payload.dto.BookLoanDTO;
import com.library.payload.response.PageResponse;
import com.library.service.BookLoanService;
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

class AdminLoansHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, BookLoanController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean BookLoanService loans() { return mock(BookLoanService.class); }
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

    @Test void onlyAdminCanSearchAllLoansAndRunOverdueBatch() throws Exception {
        BookLoanService loans = context.getBean(BookLoanService.class);
        when(loans.getBookLoans(any())).thenReturn(new PageResponse<>(List.of(),0,10,0,0,true,true,true));
        when(loans.updateOverdueBookLoan()).thenReturn(3);

        mvc.perform(post("/api/book-loans/search").header("Authorization",token("ROLE_USER"))
                .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/book-loans/admin/update-overdue").header("Authorization",token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/book-loans/search").header("Authorization",token("ROLE_ADMIN"))
                .contentType("application/json").content("{}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(post("/api/book-loans/admin/update-overdue").header("Authorization",token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value(true))
                .andExpect(jsonPath("$.message").value("Đã cập nhật 3 lượt mượn quá hạn."));
    }

    @Test void onlyAdminCanCheckoutForAnotherUser() throws Exception {
        BookLoanDTO created = new BookLoanDTO();
        created.setId(7L);
        when(context.getBean(BookLoanService.class).checkoutBookForUser(eq(3L),any()))
                .thenReturn(created);
        mvc.perform(post("/api/book-loans/checkout/user/3").header("Authorization",token("ROLE_USER"))
                .contentType("application/json").content("{\"bookId\":5,\"checkoutDays\":7}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/book-loans/checkout/user/3").header("Authorization",token("ROLE_ADMIN"))
                .contentType("application/json").content("{\"bookId\":5,\"checkoutDays\":7}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(7));
    }
}
