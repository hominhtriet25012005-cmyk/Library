package com.library.service.impl;

import com.library.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.library.modal.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
public class CustomUserServiceImplementation  implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserServiceImplementation(UserRepository userRepository) {

        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // username thực chất đang được dùng như email
        User user = userRepository.findByEmail(username);

        if (user == null) {
            throw new UsernameNotFoundException("Người dùng không tồn tại với tên đăng nhập này: " + username);
        }

        // ROLE_USER hoặc ROLE_ADMIN
        // được chuyển thành GrantedAuthority
        GrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().toString());

        Collection<? extends GrantedAuthority> authorities = Collections.singletonList(authority);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), authorities
                // Trả UserDetails cho Spring Security
                //
                // gồm:
                // email
                // password hash
                // role
        );
    }
}
