package com.bugboard26.issue;

import com.bugboard26.issue.dto.AssignIssueRequest;
import com.bugboard26.issue.dto.CreateIssueRequest;
import com.bugboard26.issue.dto.IssueResponse;
import com.bugboard26.issue.dto.UpdateIssueRequest;
import com.bugboard26.issue.dto.UpdateIssueStatusRequest;
import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueStatus;
import com.bugboard26.issue.enums.IssueType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public IssueResponse create(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam IssueType type,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) String assignedToEmail,
            @RequestParam(required = false) LocalDate dueDate,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication
    ) {
        CreateIssueRequest request = new CreateIssueRequest(
                title,
                description,
                type,
                priority,
                null,
                assignedToEmail,
                dueDate
        );

        return issueService.create(request, image, authentication.getName());
    }

    @GetMapping
    public Page<IssueResponse> search(
            @RequestParam(required = false) IssueType type,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueStatus excludedStatus,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Boolean assigned,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return issueService.search(type, status, excludedStatus, priority, assignedToId, assigned, keyword, pageable);
    }

    @GetMapping("/{id}")
    public IssueResponse findById(@PathVariable Long id) {
        return issueService.findById(id);
    }

    @GetMapping("/assigned-to-me")
    public Page<IssueResponse> findAssignedToMe(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return issueService.findAssignedToMe(authentication.getName(), pageable);
    }

    @PatchMapping("/{id}")
    public IssueResponse update(
            @PathVariable Long id,
            @RequestBody UpdateIssueRequest request,
            Authentication authentication
    ) {
        return issueService.update(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/status")
    public IssueResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIssueStatusRequest request,
            Authentication authentication
    ) {
        return issueService.updateStatus(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/assign")
    public IssueResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignIssueRequest request,
            Authentication authentication
    ) {
        return issueService.assign(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            Authentication authentication
    ) {
        issueService.delete(id, authentication.getName());
    }
}
