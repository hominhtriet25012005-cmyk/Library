package com.library.service.impl;


import com.library.mapper.UserMapper;
import com.library.exception.ResourceNotFoundException;
import com.library.model.User;
import com.library.payload.dto.UserDTO;
import com.library.repository.UserRepository;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {


    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng!");
        }
        return user;
    }

    @Override
    public UserDTO getCurrentUserProfile() {
        return UserMapper.toDTO(getCurrentUser());
    }

    @Override
    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();

        return users.stream().map(
                UserMapper::toDTO
        ).collect(Collectors.toList());
    }

    @Override
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng với ID đã cho!")
        );
    }
}
