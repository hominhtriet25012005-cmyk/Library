package com.library;

import com.library.repository.UserRepository;
import com.library.service.SubscriptionService;
import com.library.service.impl.DataInitializationComponent;
import com.library.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class StartupConfigurationTests {

    @Test
    void adminInitializerIsDisabledWhenPropertyIsAbsent() {
        new ApplicationContextRunner()
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).doesNotHaveBean(DataInitializationComponent.class);
                });
    }

    @Test
    void adminInitializerIsDisabledWhenPropertyIsFalse() {
        new ApplicationContextRunner()
                .withPropertyValues("app.initialize-admin=false")
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).doesNotHaveBean(DataInitializationComponent.class);
                });
    }

    @Test
    void adminInitializerCanBeExplicitlyEnabledWithoutRunningIt() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        new ApplicationContextRunner()
                .withPropertyValues("app.initialize-admin=true")
                .withBean(UserRepository.class, () -> repository)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(DataInitializationComponent.class);
                    verifyNoInteractions(repository, encoder);
                });
    }

    @Test
    void userServiceReceivesRepository() {
        UserRepository repository = mock(UserRepository.class);
        when(repository.findAll()).thenReturn(List.of());
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> repository)
                .withUserConfiguration(UserServiceImpl.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean(UserServiceImpl.class).getAllUsers()).isEmpty();
                    verify(repository).findAll();
                });
    }

    @Test
    void legacyVerificationIsRetiredWithoutCallingPaymentService() {
        var service = mock(com.library.service.PaymentService.class);
        var controller = new com.library.controller.PaymentController(service);
        assertThat(controller.verifyPayment().getStatusCode().value()).isEqualTo(410);
        verifyNoInteractions(service);
    }
}
