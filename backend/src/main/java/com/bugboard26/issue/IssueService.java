package com.bugboard26.issue;

import com.bugboard26.issue.dto.AssignIssueRequest;
import com.bugboard26.issue.dto.CreateIssueRequest;
import com.bugboard26.issue.dto.IssueResponse;
import com.bugboard26.issue.dto.UpdateIssueRequest;
import com.bugboard26.issue.dto.UpdateIssueStatusRequest;
import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueStatus;
import com.bugboard26.issue.enums.IssueType;
import com.bugboard26.issue.exception.ForbiddenIssueOperationException;
import com.bugboard26.issue.exception.IssueNotFoundException;
import com.bugboard26.user.User;
import com.bugboard26.user.UserRole;
import com.bugboard26.user.UserRepository;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public IssueService(IssueRepository issueRepository, UserRepository userRepository) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public IssueResponse create(CreateIssueRequest request, MultipartFile image, String userEmail) {
        String imageUrl = saveImage(image);

        return create(request, userEmail, imageUrl);
    }

    private IssueResponse create(CreateIssueRequest request, String userEmail, String imageUrl) {
        User createdBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        Issue issue = new Issue();

        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setType(request.getType());
        issue.setPriority(request.getPriority());
        issue.setStatus(IssueStatus.TODO);
        issue.setCreatedBy(createdBy);
        issue.setImageUrl(imageUrl);

        if (request.getDueDate() != null) {
            if (request.getDueDate().isBefore(java.time.LocalDate.now())) {
                throw new IllegalArgumentException("La scadenza non può essere precedente alla data di oggi.");
            }

            issue.setDueDate(request.getDueDate());
        }

        if (request.getAssignedToEmail() != null && !request.getAssignedToEmail().isBlank()) {
            if (!isAdmin(createdBy)) {
                throw new ForbiddenIssueOperationException("Solo gli amministratori possono assegnare issue.");
            }

            User assignedTo = userRepository.findByEmail(request.getAssignedToEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Nessun utente trovato con questa email. Controlla l'indirizzo e riprova."));

            issue.setAssignedTo(assignedTo);
        }

        Issue savedIssue = issueRepository.save(issue);

        return IssueResponse.fromEntity(savedIssue);
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> search(
            IssueType type,
            IssueStatus status,
            IssueStatus excludedStatus,
            IssuePriority priority,
            Long assignedToId,
            Boolean assigned,
            String keyword,
            Pageable pageable
    ) {
        return issueRepository.findAll((root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (excludedStatus != null) {
                predicates.add(criteriaBuilder.notEqual(root.get("status"), excludedStatus));
            }

            if (priority != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority"), priority));
            }

            if (assignedToId != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            if (assigned != null) {
                if (assigned) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("assignedTo")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("assignedTo")));
                }
            }

            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";

                predicates.add(
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), normalizedKeyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), normalizedKeyword)
                        )
                );
            }

            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, pageable).map(IssueResponse::fromEntity);
    }

    public IssueResponse findById(Long id) {
        Issue issue = getIssueById(id);
        return IssueResponse.fromEntity(issue);
    }

    public Page<IssueResponse> findAssignedToMe(String currentUserEmail, Pageable pageable) {
        User currentUser = getUserByEmail(currentUserEmail);
        return issueRepository.findByAssignedTo(currentUser, pageable)
                .map(IssueResponse::fromEntity);
    }

    @Transactional
    public IssueResponse update(Long issueId, UpdateIssueRequest request, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Issue issue = getIssueById(issueId);

        if (isAdmin(currentUser)) {
            applyAdminUpdate(issue, request);
            return IssueResponse.fromEntity(issue);
        }

        if (!issue.isAssignedTo(currentUser)) {
            throw new ForbiddenIssueOperationException("Puoi modificare solo le issue assegnate a te.");
        }

        if (request.getStatus() == null) {
            throw new ForbiddenIssueOperationException("Un utente assegnato può modificare solo lo stato della issue.");
        }

        validateOnlyStatusChange(request);
        issue.setStatus(request.getStatus());
        return IssueResponse.fromEntity(issue);
    }

    @Transactional
    public IssueResponse updateStatus(Long issueId, UpdateIssueStatusRequest request, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Issue issue = getIssueById(issueId);

        System.out.println("CURRENT USER EMAIL: " + currentUser.getEmail());
        System.out.println("CURRENT USER ROLE: " + currentUser.getRole());
        System.out.println("IS ADMIN: " + isAdmin(currentUser));
        System.out.println("ISSUE ASSIGNED TO: " + (issue.getAssignedTo() != null ? issue.getAssignedTo().getEmail() : "nessuno"));

        if (!isAdmin(currentUser) && !issue.isAssignedTo(currentUser)) {
            throw new ForbiddenIssueOperationException("Solo un amministratore o l'utente assegnato possono cambiare lo stato.");
        }

        issue.setStatus(request.getStatus());
        return IssueResponse.fromEntity(issue);
    }

    @Transactional
    public IssueResponse assign(Long id, AssignIssueRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Solo gli amministratori possono assegnare issue");
        }

        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue non trovata"));

        User assignedUser = userRepository.findByEmail(request.assignedToEmail())
                .orElseThrow(() -> new RuntimeException("Utente assegnatario non trovato"));

        issue.setAssignedTo(assignedUser);

        Issue savedIssue = issueRepository.save(issue);

        return IssueResponse.fromEntity(savedIssue);
    }

    @Transactional
    public void delete(Long issueId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);

        if (!isAdmin(currentUser)) {
            throw new ForbiddenIssueOperationException("Solo un amministratore può eliminare una issue.");
        }

        Issue issue = getIssueById(issueId);
        issueRepository.delete(issue);
    }

    private void applyAdminUpdate(Issue issue, UpdateIssueRequest request) {
        if (request.getTitle() != null) {
            issue.setTitle(trim(request.getTitle()));
        }
        if (request.getDescription() != null) {
            issue.setDescription(trim(request.getDescription()));
        }
        if (request.getType() != null) {
            issue.setType(request.getType());
        }
        if (request.getPriority() != null) {
            issue.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            issue.setStatus(request.getStatus());
        }
        if (request.getImageUrl() != null) {
            issue.setImageUrl(trimToNull(request.getImageUrl()));
        }
        if (request.getDueDate() != null) {
            if (request.getDueDate().isBefore(java.time.LocalDate.now())) {
                throw new IllegalArgumentException("La scadenza non può essere precedente alla data di oggi.");
            }

            issue.setDueDate(request.getDueDate());
        }
    }

    private void validateOnlyStatusChange(UpdateIssueRequest request) {
        boolean hasForbiddenFields =
                request.getTitle() != null ||
                request.getDescription() != null ||
                request.getType() != null ||
                request.getPriority() != null ||
                request.getImageUrl() != null ||
                request.getDueDate() != null;

        if (hasForbiddenFields) {
            throw new ForbiddenIssueOperationException("Un utente assegnato può modificare solo lo stato della issue.");
        }
    }

    private Issue getIssueById(Long id) {
        return issueRepository.findIssueById(id)
                .orElseThrow(() -> new IssueNotFoundException("Issue non trovata."));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utente autenticato non trovato."));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && Objects.equals(user.getRole().name(), "ADMIN");
    }

    private String trim(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("I campi testuali obbligatori non possono essere vuoti.");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String saveImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Il file allegato deve essere un'immagine");
        }

        try {
            String uploadDir = "uploads/issues";
            Files.createDirectories(Paths.get(uploadDir));

            String originalFilename = image.getOriginalFilename();
            String extension = "";

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = Paths.get(uploadDir, fileName);

            Files.write(filePath, image.getBytes());

            return "/uploads/issues/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Errore durante il salvataggio dell'immagine", e);
        }
    }
}
