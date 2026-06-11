package com.bugboard26.auth;

import com.bugboard26.user.User;
import com.bugboard26.user.UserRole;

public record UserResponse(
        Long id,
        String email,
        UserRole role,
        boolean enabled
        ) {
public static UserResponse fromEntity(User user) {
        return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getRole(),
        user.isEnabled()
        );
        }
        }