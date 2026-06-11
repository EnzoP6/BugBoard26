package com.bugboard26.media;

import java.time.LocalDateTime;

public class IssueAttachmentResponse {

    private Long id;
    private String originalFileName;
    private String contentType;
    private Long size;
    private String url;
    private LocalDateTime uploadedAt;

    public IssueAttachmentResponse(IssueAttachment attachment) {
        this.id = attachment.getId();
        this.originalFileName = attachment.getOriginalFileName();
        this.contentType = attachment.getContentType();
        this.size = attachment.getSize();
        this.url = "/api/issues/"
                + attachment.getIssue().getId()
                + "/attachments/"
                + attachment.getId();
        this.uploadedAt = attachment.getUploadedAt();
    }

    public Long getId() {
        return id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getSize() {
        return size;
    }

    public String getUrl() {
        return url;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
}