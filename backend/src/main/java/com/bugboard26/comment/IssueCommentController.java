package com.bugboard26.comment;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class IssueCommentController {

    private final IssueCommentService commentService;

    public IssueCommentController(IssueCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/issues/{issueId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long issueId) {
        return ResponseEntity.ok(commentService.getComments(issueId));
    }

    @PostMapping("/issues/{issueId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long issueId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(commentService.createComment(issueId, request, authentication));
    }

    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(commentService.updateComment(commentId, request, authentication));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        commentService.deleteComment(commentId, authentication);
        return ResponseEntity.noContent().build();
    }
}