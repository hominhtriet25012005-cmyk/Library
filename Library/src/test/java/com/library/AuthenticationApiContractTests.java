package com.library;

import com.library.controller.AuthController;
import com.library.exception.GlobalException;
import com.library.exception.InvalidCredentialsException;
import com.library.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class AuthenticationApiContractTests {

    @Test
    void unknownEmailAndWrongPasswordHaveIdenticalHttpContract() throws Exception {
        AuthService service = mock(AuthService.class);
        when(service.login("missing@example.test", "WrongPassword123!"))
                .thenThrow(new InvalidCredentialsException());
        when(service.login("reader@example.test", "WrongPassword123!"))
                .thenThrow(new InvalidCredentialsException());
        MockMvc mvc = standaloneSetup(new AuthController(service))
                .setControllerAdvice(new GlobalException())
                .build();

        MvcResult unknown = mvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"missing@example.test\",\"password\":\"WrongPassword123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác."))
                .andReturn();
        MvcResult wrongPassword = mvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"reader@example.test\",\"password\":\"WrongPassword123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác."))
                .andReturn();

        assertEquals(401, unknown.getResponse().getStatus());
        assertEquals(unknown.getResponse().getStatus(), wrongPassword.getResponse().getStatus());
        assertEquals(unknown.getResponse().getContentAsString(), wrongPassword.getResponse().getContentAsString());
    }
}
