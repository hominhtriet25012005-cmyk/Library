package com.library;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes",
        "app.jwt.expiration-ms=60000"
})
class LibraryApplicationTests {

    @Autowired
    ApplicationContext context;

    @Test
    void contextLoads() {
        assertThat(context.getBeansOfType(UserDetailsService.class))
                .containsOnlyKeys("customUserServiceImplementation");
    }

}
