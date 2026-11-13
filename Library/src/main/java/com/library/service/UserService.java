package com.library.service;

import com.library.model.User;
import com.library.payload.dto.UserDTO;

import java.util.List;

public interface UserService {

    public User getCurrentUser();

    UserDTO getCurrentUserProfile();

    public List<UserDTO> getAllUsers();

    User findById(Long id);
}
