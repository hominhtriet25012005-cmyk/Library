package com.library.configrations;

import com.library.controller.UserController;
import com.library.domain.UserRole;
import com.library.mapper.UserMapper;
import com.library.modal.User;
import com.library.service.UserService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUsersHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, UserController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean UserService users() { return mock(UserService.class); }
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

    @Test void onlyAdminCanReadUserListAndPasswordHashIsNeverMapped() throws Exception {
        User user = User.builder().id(7L).email("member@example.test")
                .fullName("Member").password("private-hash")
                .role(UserRole.ROLE_USER).build();
        assertNull(UserMapper.toDTO(user).getPassword());
        when(context.getBean(UserService.class).getAllUsers())
                .thenReturn(List.of(UserMapper.toDTO(user)));

        mvc.perform(get("/api/users/list").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        var response = mvc.perform(get("/api/users/list").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(response.contains("member@example.test"));
        assertFalse(response.contains("private-hash"));
    }
}
