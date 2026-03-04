package com.springboot.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // updated syntax for Spring Security 6+
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/css/**", "/js/**", "/index").permitAll() // public resources
                .anyRequest().authenticated() // all other requests require login
            )
            .formLogin(form -> form
                .loginPage("/index")         // custom login page
                .defaultSuccessUrl("/main", true) // redirect after login
                .permitAll()
            )
            .logout(logout -> logout.permitAll());

        return http.build();
    }
}