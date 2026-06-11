package com.bugboard26.auth;

import com.bugboard26.user.UserRole;

public record LoginResponse(
        String token,
        Long userId,
        String email,
        UserRole role,
        boolean mustChangePassword
        ) {
        }