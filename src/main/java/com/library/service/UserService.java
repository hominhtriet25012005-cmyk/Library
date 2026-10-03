package com.library.service;

import com.library.modal.User;
import com.library.payload.dto.UserDTO;

import java.util.List;

public interface UserService {

    public User getCurrentUser() throws Exception;

    public List<UserDTO> getAllUsers();

    User findById(Long id) throws Exception;
}
