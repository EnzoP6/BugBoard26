package com.bugboard26.issue.dto;

import com.bugboard26.issue.Issue;
import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueStatus;
import com.bugboard26.issue.enums.IssueType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private IssueType type;
    private IssuePriority priority;
    private IssueStatus status;
    private String imageUrl;
    private LocalDate dueDate;
    private Long createdById;
    private String createdByEmail;
    private Long assignedToId;
    private String assignedToEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IssueResponse fromEntity(Issue issue) {
        IssueResponse response = new IssueResponse();
        response.id = issue.getId();
        response.title = issue.getTitle();
        response.description = issue.getDescription();
        response.type = issue.getType();
        response.priority = issue.getPriority();
        response.status = issue.getStatus();
        response.imageUrl = issue.getImageUrl();
        response.dueDate = issue.getDueDate();

        response.createdById = issue.getCreatedBy().getId();
        response.createdByEmail = issue.getCreatedBy().getEmail();

        if (issue.getAssignedTo() != null) {
            response.assignedToId = issue.getAssignedTo().getId();
            response.assignedToEmail = issue.getAssignedTo().getEmail();
        }

        response.createdAt = issue.getCreatedAt();
        response.updatedAt = issue.getUpdatedAt();
        return response;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public IssueType getType() { return type; }
    public IssuePriority getPriority() { return priority; }
    public IssueStatus getStatus() { return status; }
    public String getImageUrl() { return imageUrl; }
    public LocalDate getDueDate() { return dueDate; }
    public Long getCreatedById() { return createdById; }
    public String getCreatedByEmail() { return createdByEmail; }
    public Long getAssignedToId() { return assignedToId; }
    public String getAssignedToEmail() { return assignedToEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
