package com.springboot.demo.controller;

import com.springboot.demo.model.User;
import com.springboot.demo.security.JwtUtil;
import com.springboot.demo.service.AuthService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequest request) {
        authService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthRequest request) {
        boolean valid = authService.authenticate(request.getUsername(), request.getPassword());
        if(valid) {
            String token = jwtUtil.generateToken(request.getUsername());
            return ResponseEntity.ok(token);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @Data
    public static class AuthRequest {
        private String username;
        private String password;
    }
}