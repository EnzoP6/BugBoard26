package com.bugboard26.issue.dto;

import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueStatus;
import com.bugboard26.issue.enums.IssueType;
import java.time.LocalDate;

public class UpdateIssueRequest {

    private String title;
    private String description;
    private IssueType type;
    private IssuePriority priority;
    private IssueStatus status;
    private String imageUrl;
    private LocalDate dueDate;

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

    public IssueStatus getStatus() {
        return status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }
}
