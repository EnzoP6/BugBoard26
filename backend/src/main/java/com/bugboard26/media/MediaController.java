package com.bugboard26.media;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/attachments")
public class MediaController {

    private final MediaStorageService mediaStorageService;

    public MediaController(MediaStorageService mediaStorageService) {
        this.mediaStorageService = mediaStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IssueAttachmentResponse> uploadIssueImage(
            @PathVariable Long issueId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        IssueAttachmentResponse response = mediaStorageService.uploadIssueImage(
                issueId,
                file,
                authentication
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<IssueAttachmentResponse>> getIssueAttachments(
            @PathVariable Long issueId
    ) {
        return ResponseEntity.ok(mediaStorageService.getIssueAttachments(issueId));
    }

    @GetMapping("/{attachmentId}")
    public ResponseEntity<Resource> downloadIssueImage(
            @PathVariable Long issueId,
            @PathVariable Long attachmentId
    ) {
        IssueAttachment attachment = mediaStorageService.getAttachmentInfo(issueId, attachmentId);
        Resource resource = mediaStorageService.loadAttachment(issueId, attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getOriginalFileName() + "\""
                )
                .body(resource);
    }
}