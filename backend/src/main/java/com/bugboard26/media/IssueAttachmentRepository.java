package com.bugboard26.media;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueAttachmentRepository extends JpaRepository<IssueAttachment, Long> {

    List<IssueAttachment> findByIssueId(Long issueId);

    Optional<IssueAttachment> findByIdAndIssueId(Long attachmentId, Long issueId);
}