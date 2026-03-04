package com.springboot.demo.service;

import com.springboot.demo.model.User;
import com.springboot.demo.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User register(String username, String password) {
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .build();
        return userRepository.save(user);
    }

    public boolean authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        return userOpt.map(user -> passwordEncoder.matches(password, user.getPassword()))
                      .orElse(false);
    }
}