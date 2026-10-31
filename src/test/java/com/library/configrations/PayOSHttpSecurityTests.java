package com.library.configrations;

import com.library.configrations.SecurityConfig;
import com.library.configrations.JwtConstant;
import com.library.controller.PayOSController;
import com.library.service.impl.PayOSConfirmationService;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PayOSHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, PayOSController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean PayOSConfirmationService confirmation() { return mock(PayOSConfirmationService.class); }
    }
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private PayOSConfirmationService confirmation;
    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext()); context.register(Config.class); context.refresh();
        confirmation = context.getBean(PayOSConfirmationService.class);
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", jakarta.servlet.Filter.class)).build();
    }
    @AfterEach void close() { context.close(); }
    private String token(String role) {
        return SecurityTestSupport.token(role);
    }
    @Test void webhookPostIsPublicButSignatureStillRequired() throws Exception {
        when(confirmation.webhook(any())).thenThrow(new IllegalArgumentException("invalid signature"));
        mvc.perform(post("/api/payments/webhook/payos").contentType("application/json").content("{\"data\":{}}"))
                .andExpect(status().isBadRequest());
        doReturn("OK").when(confirmation).webhook(any());
        mvc.perform(post("/api/payments/webhook/payos").contentType("application/json").content("{}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result").value("OK"));
        doThrow(new IllegalStateException("private failure")).when(confirmation).webhook(any());
        mvc.perform(post("/api/payments/webhook/payos").contentType("application/json").content("{}"))
                .andExpect(status().isServiceUnavailable());
    }
    @Test void anonymousAndOrdinaryUsersCannotUseAdminOrActivationEndpoints() throws Exception {
        mvc.perform(get("/api/payments/42/status")).andExpect(status().isForbidden());
        mvc.perform(get("/api/payments").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/fines").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/fines").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/fines/waive").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/subscriptions/admin").header("Authorization", token("ROLE_USER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/subscriptions/activate").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/payments/webhook/payos")).andExpect(status().isForbidden());
    }
    @Test void malformedBearerIsUnauthorizedRatherThanServerError() throws Exception {
        mvc.perform(get("/api/payments/42/status").header("Authorization", "x"))
                .andExpect(status().isUnauthorized());
    }

    @Test void mvcJsonCanBeVerifiedByRealSdkWithoutNetwork() throws Exception {
        var sdk = new vn.payos.PayOS("dummy", "dummy", "test-checksum");
        var gateway = new com.library.service.gateway.PayOSService(sdk);
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        var data = mapper.readValue("""
            {"orderCode":42,"amount":100000,"description":"LIBRARY","accountNumber":"TEST",
             "reference":"receipt","transactionDateTime":"2026-10-04 13:00:00","currency":"VND",
             "paymentLinkId":"link","code":"00","desc":"success"}
            """, vn.payos.model.webhooks.WebhookData.class);
        var signature = sdk.getCrypto().createSignatureFromObj(data, "test-checksum");
        var payload = java.util.Map.of("code", "00", "desc", "success", "success", true,
                "data", data, "signature", signature);
        when(confirmation.webhook(any())).thenAnswer(call -> {
            gateway.verifyWebhook(call.getArgument(0)); return "VERIFIED";
        });
        mvc.perform(post("/api/payments/webhook/payos").contentType("application/json")
                .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.result").value("VERIFIED"));
    }
}
