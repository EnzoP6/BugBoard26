package com.bugboard26.config;

import com.bugboard26.user.User;
import com.bugboard26.user.UserRepository;
import com.bugboard26.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.email}")
    private String defaultAdminEmail;

    @Value("${app.default-admin.password}")
    private String defaultAdminPassword;

    public DataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(defaultAdminEmail)) {
            User admin = new User(
                    defaultAdminEmail,
                    passwordEncoder.encode(defaultAdminPassword),
                    UserRole.ADMIN
            );

            userRepository.save(admin);
            System.out.println("Admin di default creato: " + defaultAdminEmail);
        }
    }
}
