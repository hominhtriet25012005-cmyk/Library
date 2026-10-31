package com.library;

import com.library.repository.UserRepository;
import com.library.domain.UserRole;
import com.library.modal.User;
import com.library.service.SubscriptionService;
import com.library.service.impl.DataInitializationComponent;
import com.library.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    void adminInitializerUsesConfiguredCredentialsInsteadOfHardCodedValues() throws Exception {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.findByEmail("admin@gmail.com")).thenReturn(null);
        when(encoder.encode("safe-test-password")).thenReturn("encoded-password");

        new ApplicationContextRunner()
                .withPropertyValues(
                        "app.initialize-admin=true",
                        "app.admin.email=admin@gmail.com",
                        "app.admin.password=safe-test-password",
                        "app.admin.full-name=Library Administrator"
                )
                .withBean(UserRepository.class, () -> repository)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    context.getBean(DataInitializationComponent.class).run();

                    var userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
                    verify(repository).findByEmail("admin@gmail.com");
                    verify(encoder).encode("safe-test-password");
                    verify(repository).save(userCaptor.capture());
                    assertThat(userCaptor.getValue().getEmail()).isEqualTo("admin@gmail.com");
                    assertThat(userCaptor.getValue().getFullName()).isEqualTo("Library Administrator");
                    assertThat(userCaptor.getValue().getRole()).isEqualTo(UserRole.ROLE_ADMIN);
                    assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded-password");
                });
    }

    @Test
    void adminInitializerRejectsMissingCredentialsWhenExplicitlyEnabled() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);

        new ApplicationContextRunner()
                .withPropertyValues(
                        "app.initialize-admin=true",
                        "app.admin.email=",
                        "app.admin.password=",
                        "app.admin.full-name=Library Administrator"
                )
                .withBean(UserRepository.class, () -> repository)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThatThrownBy(() -> context.getBean(DataInitializationComponent.class).run())
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("ADMIN_EMAIL")
                            .hasMessageContaining("ADMIN_PASSWORD");
                    verifyNoInteractions(repository, encoder);
                });
    }

    @Test
    void adminInitializerNeverSilentlyPromotesAnExistingUser() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User existingUser = User.builder()
                .email("admin@gmail.com")
                .fullName("Existing User")
                .role(UserRole.ROLE_USER)
                .build();
        when(repository.findByEmail("admin@gmail.com")).thenReturn(existingUser);

        new ApplicationContextRunner()
                .withPropertyValues(
                        "app.initialize-admin=true",
                        "app.admin.email=admin@gmail.com",
                        "app.admin.password=safe-test-password",
                        "app.admin.full-name=Library Administrator"
                )
                .withBean(UserRepository.class, () -> repository)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(DataInitializationComponent.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThatThrownBy(() -> context.getBean(DataInitializationComponent.class).run())
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("ROLE_USER")
                            .hasMessageContaining("ROLE_ADMIN");
                    verify(repository).findByEmail("admin@gmail.com");
                    verify(repository, never()).save(any());
                    verifyNoInteractions(encoder);
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
