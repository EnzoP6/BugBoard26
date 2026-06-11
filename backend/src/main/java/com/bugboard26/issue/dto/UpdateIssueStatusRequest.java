package com.bugboard26.issue.dto;

import com.bugboard26.issue.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateIssueStatusRequest {

    @NotNull(message = "Lo stato è obbligatorio")
    private IssueStatus status;

    public IssueStatus getStatus() {
        return status;
    }
}
