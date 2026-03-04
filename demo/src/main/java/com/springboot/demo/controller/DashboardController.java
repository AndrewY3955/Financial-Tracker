package com.springboot.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    // Dashboard, requires authentication
    @GetMapping("/main")
    public String dashboard() {
        return "main"; // src/main/resources/templates/main.html
    }
}