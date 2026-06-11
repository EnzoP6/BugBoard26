package com.bugboard26.issue.dto;

import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateIssueRequest {

    @NotBlank(message = "Il titolo è obbligatorio")
    @Size(max = 120, message = "Il titolo non può superare 120 caratteri")
    private String title;

    @NotBlank(message = "La descrizione è obbligatoria")
    private String description;

    @NotNull(message = "La tipologia è obbligatoria")
    private IssueType type;

    private IssuePriority priority;

    private String imageUrl;

    private String assignedToEmail;

    private LocalDate dueDate;

    public CreateIssueRequest() {
    }

    public CreateIssueRequest(
            String title,
            String description,
            IssueType type,
            IssuePriority priority,
            String imageUrl,
            String assignedToEmail,
            LocalDate dueDate
    ) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.priority = priority;
        this.imageUrl = imageUrl;
        this.assignedToEmail = assignedToEmail;
        this.dueDate = dueDate;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public IssueType getType() {
        return type;
    }

    public IssuePriority getPriority() {
        return priority;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getAssignedToEmail() {
        return assignedToEmail;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }
}