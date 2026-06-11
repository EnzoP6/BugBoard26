package com.bugboard26.media;

import com.bugboard26.issue.Issue;
import com.bugboard26.issue.IssueRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Path uploadRoot;
    private final IssueRepository issueRepository;
    private final IssueAttachmentRepository attachmentRepository;

    public MediaStorageService(
            @Value("${bugboard.upload-dir}") String uploadDir,
            IssueRepository issueRepository,
            IssueAttachmentRepository attachmentRepository
    ) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.issueRepository = issueRepository;
        this.attachmentRepository = attachmentRepository;

        try {
            Files.createDirectories(this.uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Impossibile creare la cartella upload", e);
        }
    }

    public IssueAttachmentResponse uploadIssueImage(
            Long issueId,
            MultipartFile file,
            Authentication authentication
    ) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue non trovata"));

        if (!canManageIssueMedia(issue, authentication)) {
            throw new AccessDeniedException("Non hai i permessi per aggiungere immagini a questa issue");
        }

        validateImage(file);

        String extension = getExtension(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + extension;

        Path issueFolder = uploadRoot.resolve("issue-" + issueId);
        Path destination = issueFolder.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(issueFolder);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Errore durante il salvataggio del file", e);
        }

        IssueAttachment attachment = new IssueAttachment(
                file.getOriginalFilename(),
                storedFileName,
                file.getContentType(),
                file.getSize(),
                destination.toString(),
                issue
        );

        IssueAttachment savedAttachment = attachmentRepository.save(attachment);
        return new IssueAttachmentResponse(savedAttachment);
    }

    public List<IssueAttachmentResponse> getIssueAttachments(Long issueId) {
        return attachmentRepository.findByIssueId(issueId)
                .stream()
                .map(IssueAttachmentResponse::new)
                .toList();
    }

    public Resource loadAttachment(Long issueId, Long attachmentId) {
        IssueAttachment attachment = attachmentRepository
                .findByIdAndIssueId(attachmentId, issueId)
                .orElseThrow(() -> new IllegalArgumentException("Allegato non trovato"));

        try {
            Path filePath = Paths.get(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("File non disponibile");
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Percorso file non valido", e);
        }
    }

    public IssueAttachment getAttachmentInfo(Long issueId, Long attachmentId) {
        return attachmentRepository
                .findByIdAndIssueId(attachmentId, issueId)
                .orElseThrow(() -> new IllegalArgumentException("Allegato non trovato"));
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Il file immagine è obbligatorio");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Formato immagine non supportato. Usa JPG, PNG o WEBP");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Il file non può superare 5 MB");
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }

        return fileName.substring(fileName.lastIndexOf("."));
    }

    private boolean canManageIssueMedia(Issue issue, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return true;
        }

        String currentEmail = authentication.getName();

        boolean isCreator = issue.getCreatedBy() != null
                && issue.getCreatedBy().getEmail().equals(currentEmail);

        boolean isAssignedUser = issue.getAssignedTo() != null
                && issue.getAssignedTo().getEmail().equals(currentEmail);

        return isCreator || isAssignedUser;
    }
}