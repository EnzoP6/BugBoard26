package com.bugboard26.issue.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AssignIssueRequest(
        @NotBlank(message = "E-mail is required")
        @Email(message = "No user found with this mail")
        String assignedToEmail
) {
}
