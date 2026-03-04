package com.springboot.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthLandingController {

    // Login/landing page, publicly accessible
    @GetMapping("/index")
    public String landingPage() {
        return "index";  // src/main/resources/templates/index.html
    }
}