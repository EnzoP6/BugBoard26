package com.bugboard26.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank(message = "Il commento non può essere vuoto")
        @Size(max = 1000, message = "Il commento non può superare 1000 caratteri")
        String text
) {
}
