package com.bugboard26.auth;

import com.bugboard26.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
@Email(message = "Email non valida")
@NotBlank(message = "Email obbligatoria")
        String email,

@Size(min = 8, message = "La password deve contenere almeno 8 caratteri")
@NotBlank(message = "Password obbligatoria")
        String password,

@NotNull(message = "Ruolo obbligatorio")
        UserRole role
                ) {
                }