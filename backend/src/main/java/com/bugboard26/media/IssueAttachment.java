package com.bugboard26.media;

import com.bugboard26.issue.Issue;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_attachments")
public class IssueAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originalFileName;

    private String storedFileName;

    private String contentType;

    private Long size;

    private String filePath;

    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    public IssueAttachment() {
    }

    public IssueAttachment(
            String originalFileName,
            String storedFileName,
            String contentType,
            Long size,
            String filePath,
            Issue issue
    ) {
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
        this.size = size;
        this.filePath = filePath;
        this.issue = issue;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getSize() {
        return size;
    }

    public String getFilePath() {
        return filePath;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public Issue getIssue() {
        return issue;
    }
}
