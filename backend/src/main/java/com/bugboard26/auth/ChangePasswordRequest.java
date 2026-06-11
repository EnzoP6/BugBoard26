package com.bugboard26.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "La vecchia password è obbligatoria")
        String oldPassword,

        @NotBlank(message = "La nuova password è obbligatoria")
        @Size(min = 8, message = "La nuova password deve contenere almeno 8 caratteri")
        String newPassword
) {
}