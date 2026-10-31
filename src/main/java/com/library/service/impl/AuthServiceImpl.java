package com.library.service.impl;

import com.library.configrations.JwtProvider;
import com.library.domain.UserRole;
import com.library.exception.UserException;
import com.library.mapper.UserMapper;
import com.library.modal.PasswordResetToken;
import com.library.modal.User;
import com.library.payload.dto.UserDTO;
import com.library.payload.response.AuthResponse;
import com.library.repository.PasswordResetTokenRepository;
import com.library.repository.UserRepository;
import com.library.service.AuthService;
import com.library.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final CustomUserServiceImplementation customUserServiceImplementation;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;


    @Override
    public AuthResponse login(String username, String password) throws UserException {

        // Bước 1: Kiểm tra email + password
        Authentication authentication = authenticate(username, password);


        // Bước 2: Đánh dấu user đã authenticated trong request hiện tại
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        // String role = authorities.iterator().next().getAuthority();

        // Bước 3:Tạo JWT
        String token = jwtProvider.generateToken(authentication);

        // Bước 4:Lấy Entity User từ database
        User user = userRepository.findByEmail(username);

        // Bước 5: Cập nhật thời gian login gần nhất
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        AuthResponse response = new AuthResponse();
        response.setTitle("Đăng nhập thành công");
        response.setMessage("Chào mừng bạn trở lại " + username);
        response.setJwt(token); // JWT frontend cần lưu để gọi API tiếp theo
        response.setUser(UserMapper.toDTO(user)); // Trả thông tin user an toàn

        return response;
    }

    private Authentication authenticate(String username, String password) throws UserException {

        // Dựa vào email để tìm user trong database
        UserDetails userDetails = customUserServiceImplementation.loadUserByUsername(username);

        if (userDetails == null) {
            throw new UserException("user not found with email - " + username);
        }
        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new UserException("password not match");
        }
        // password = password gốc frontend gửi
        //
        // userDetails.getPassword()
        // = hash BCrypt trong database
        //
        // matches() kiểm tra hai cái có khớp không

        return new UsernamePasswordAuthenticationToken(username,
                null, userDetails.getAuthorities());
        // Nếu đúng:
        // tạo Authentication chứa
        // email + quyền của user
    }

    @Override
    public AuthResponse signup(UserDTO req) throws UserException {
        User user = userRepository.findByEmail(req.getEmail()); // Kiểm tra xem email đã tồn tại trong database chưa

        if (user != null) {
            throw new UserException("email đã được đăng ký."); // Nếu đã có email → không cho đăng ký trùng
        }
        User createdUser = new User();  // Tạo User Entity mới

        createdUser.setEmail(req.getEmail());  // Lấy email frontend gửi lên

        // RẤT QUAN TRỌNG:
        // Không lưu password gốc.
        // BCrypt biến password thành chuỗi hash.
        createdUser.setPassword(passwordEncoder.encode(req.getPassword()));

        createdUser.setPhone(req.getPhone());  // Gán số điện thoại

        createdUser.setFullName(req.getFullName()); // Gán họ tên

        createdUser.setLastLogin(LocalDateTime.now());  // Hiện tại signup cũng được tính là lần login gần nhất

        // QUAN TRỌNG:
        // Backend tự gán ROLE_USER.
        // Không cho frontend tự gửi ROLE_ADMIN.
        createdUser.setRole(UserRole.ROLE_USER);

        User savedUser = userRepository.save(createdUser);  // INSERT user vào MySQL

        // Sau signup, tạo Authentication
        // để xem user như đã đăng nhập

        Authentication auth = new UsernamePasswordAuthenticationToken(
                savedUser.getEmail(), null, java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(savedUser.getRole().name())));

        // Đưa Authentication vào SecurityContext hiện tại
        SecurityContextHolder.getContext().setAuthentication(auth);

        String jwt = jwtProvider.generateToken(auth);  // Sinh JWT cho user vừa đăng ký

        AuthResponse response = new AuthResponse();
        response.setJwt(jwt); // Trả JWT về frontend
        response.setTitle("Welcome " + createdUser.getFullName());
        response.setMessage("register success");
        response.setUser(UserMapper.toDTO(savedUser));

        return response;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public void createPasswordResetToken(String email) throws UserException {

        User user = userRepository.findByEmail(email);

        // Keep the public response identical for known and unknown addresses.
        if (user == null) {
            return;
        }

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();

        passwordResetTokenRepository.save(resetToken);
        String resetLink = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;
        String subject = "Yêu cầu đặt lại mật khẩu";
        String body = "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng liên kết này (có hiệu lực trong 5 phút): "
                + "<a href=\"" + resetLink + "\">Đặt lại mật khẩu</a>";

        // sent email
        emailService.sendEmail(user.getEmail(), subject, body);
    }

    @org.springframework.transaction.annotation.Transactional(
            rollbackFor = Exception.class, noRollbackFor = UserException.class)
    public void resetPassword(String token, String newPassword) throws UserException {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new UserException("Reset token and password are required");
        }
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenForUpdate(token)
                .orElseThrow(
                        () -> new UserException("Reset token is invalid or expired")
                );

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new UserException("Reset token is invalid or expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }
}
