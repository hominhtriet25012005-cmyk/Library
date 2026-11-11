package com.library;

import com.library.configurations.JwtProvider;
import com.library.domain.UserRole;
import com.library.exception.UserException;
import com.library.mapper.UserMapper;
import com.library.model.PasswordResetToken;
import com.library.model.User;
import com.library.payload.dto.UserDTO;
import com.library.repository.PasswordResetTokenRepository;
import com.library.repository.UserRepository;
import com.library.service.EmailService;
import com.library.service.impl.AuthServiceImpl;
import com.library.service.impl.CustomUserServiceImplementation;
import com.library.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class LocalAuthenticationFlowTests {

    private UserRepository users;
    private PasswordEncoder passwords;
    private JwtProvider jwtProvider;
    private PasswordResetTokenRepository resetTokens;
    private CustomUserServiceImplementation userDetailsService;
    private EmailService emailService;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        passwords = mock(PasswordEncoder.class);
        jwtProvider = mock(JwtProvider.class);
        resetTokens = mock(PasswordResetTokenRepository.class);
        userDetailsService = mock(CustomUserServiceImplementation.class);
        emailService = mock(EmailService.class);
        authService = new AuthServiceImpl(
                users,
                passwords,
                jwtProvider,
                mock(UserMapper.class),
                resetTokens,
                userDetailsService,
                emailService
        );
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:5173/");
    }

    @Test
    void signupAlwaysCreatesLocalUserWithBcryptPasswordAndUserRole() throws Exception {
        UserDTO request = new UserDTO();
        request.setEmail("reader@example.test");
        request.setPassword("LocalPassword123!");
        request.setFullName("Bạn đọc");
        request.setRole(UserRole.ROLE_ADMIN);

        when(passwords.encode("LocalPassword123!")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(12L);
            return saved;
        });
        when(jwtProvider.generateToken(any())).thenReturn("local-jwt");

        var response = authService.signup(request);

        assertThat(response.getJwt()).isEqualTo("local-jwt");
        assertThat(response.getUser().getRole()).isEqualTo(UserRole.ROLE_USER);
        var saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo("bcrypt-hash");
        assertThat(saved.getValue().getRole()).isEqualTo(UserRole.ROLE_USER);
        verify(passwords).encode("LocalPassword123!");
    }

    @Test
    void loginChecksLocalPasswordIssuesJwtAndUpdatesLastLogin() throws Exception {
        User user = User.builder()
                .id(9L)
                .email("reader@example.test")
                .fullName("Bạn đọc")
                .password("bcrypt-hash")
                .role(UserRole.ROLE_USER)
                .build();
        UserDetails details = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(),
                List.of(new SimpleGrantedAuthority(UserRole.ROLE_USER.name()))
        );
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(details);
        when(passwords.matches("LocalPassword123!", "bcrypt-hash")).thenReturn(true);
        when(users.findByEmail(user.getEmail())).thenReturn(user);
        when(jwtProvider.generateToken(any())).thenReturn("local-jwt");

        var response = authService.login(user.getEmail(), "LocalPassword123!");

        assertThat(response.getJwt()).isEqualTo("local-jwt");
        assertThat(response.getUser().getEmail()).isEqualTo(user.getEmail());
        assertThat(user.getLastLogin()).isNotNull();
        verify(users).save(user);
    }

    @Test
    void forgotPasswordStoresOneTokenAndSendsFrontendResetLink() throws Exception {
        User user = User.builder().id(7L).email("reader@example.test").build();
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(Optional.of(user));

        authService.createPasswordResetToken(user.getEmail());

        verify(resetTokens).deleteByUserId(7L);
        var token = org.mockito.ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(resetTokens).save(token.capture());
        assertThat(token.getValue().getToken()).isNotBlank();
        assertThat(token.getValue().getUser()).isSameAs(user);
        assertThat(token.getValue().getExpiryDate()).isAfter(LocalDateTime.now());
        verify(emailService).sendEmail(
                eq(user.getEmail()),
                eq("Yêu cầu đặt lại mật khẩu"),
                contains("http://localhost:5173/reset-password?token="));
    }

    @Test
    void forgotPasswordDoesNotRevealUnknownEmailOrSendMail() throws Exception {
        when(users.findByEmailForUpdate("missing@example.test")).thenReturn(Optional.empty());

        authService.createPasswordResetToken("missing@example.test");

        verifyNoInteractions(resetTokens, emailService);
    }

    @Test
    void resetPasswordReplacesHashAndConsumesValidToken() throws Exception {
        User user = User.builder().id(7L).password("old-hash").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .token("valid-token")
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(2))
                .build();
        when(resetTokens.findByTokenForUpdate("valid-token")).thenReturn(Optional.of(token));
        when(passwords.encode("NewLocalPassword123!")).thenReturn("new-hash");

        authService.resetPassword("valid-token", "NewLocalPassword123!");

        assertThat(user.getPassword()).isEqualTo("new-hash");
        verify(users).save(user);
        verify(resetTokens).delete(token);
    }

    @Test
    void expiredResetTokenIsConsumedWithoutChangingPassword() {
        User user = User.builder().id(7L).password("old-hash").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .token("expired-token")
                .user(user)
                .expiryDate(LocalDateTime.now().minusSeconds(1))
                .build();
        when(resetTokens.findByTokenForUpdate("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.resetPassword("expired-token", "NewLocalPassword123!"))
                .isInstanceOf(UserException.class)
                .hasMessageContaining("không hợp lệ hoặc đã hết hạn");

        verify(resetTokens).delete(token);
        verify(users, never()).save(any());
        verifyNoInteractions(passwords);
    }

    @Test
    void emailServiceBuildsAndSubmitsMimeMessage() {
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage((Session) null);
        when(sender.createMimeMessage()).thenReturn(message);

        new EmailServiceImpl(sender).sendEmail(
                "reader@example.test",
                "Yêu cầu đặt lại mật khẩu",
                "<a href=\"http://localhost/reset\">Đặt lại mật khẩu</a>"
        );

        verify(sender).send(message);
    }
}
