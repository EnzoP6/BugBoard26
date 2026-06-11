package com.bugboard26.comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String text,
        Long authorId,
        String authorEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}