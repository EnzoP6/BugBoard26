package com.bugboard26.comment;

import com.bugboard26.issue.Issue;
import com.bugboard26.issue.IssueRepository;
import com.bugboard26.user.User;
import com.bugboard26.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssueCommentService {

    private final IssueCommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public IssueCommentService(
            IssueCommentRepository commentRepository,
            IssueRepository issueRepository,
            UserRepository userRepository
    ) {
        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    public List<CommentResponse> getComments(Long issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CommentResponse createComment(Long issueId, CommentRequest request, Authentication authentication) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue non trovata"));

        User author = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        IssueComment comment = new IssueComment();
        comment.setIssue(issue);
        comment.setAuthor(author);
        comment.setText(request.text().trim());

        return toResponse(commentRepository.save(comment));
    }

    public void deleteComment(Long commentId, Authentication authentication) {
        IssueComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Commento non trovato"));

        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        boolean isAuthor = comment.getAuthor()
                .getEmail()
                .equals(currentUser.getEmail());

        String roleName = currentUser.getRole().name();

        boolean isAdmin =
                roleName.equals("ADMIN") ||
                        roleName.equals("ROLE_ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("Puoi eliminare solo i tuoi commenti");
        }

        commentRepository.delete(comment);
    }

    public CommentResponse updateComment(Long commentId, CommentRequest request, Authentication authentication) {
        IssueComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Commento non trovato"));

        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("Puoi modificare solo i tuoi commenti");
        }

        comment.setText(request.text().trim());

        return toResponse(commentRepository.save(comment));
    }

    private CommentResponse toResponse(IssueComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getText(),
                comment.getAuthor().getId(),
                comment.getAuthor().getEmail(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}