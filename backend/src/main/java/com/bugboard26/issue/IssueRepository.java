package com.bugboard26.issue;

import com.bugboard26.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long>, JpaSpecificationExecutor<Issue> {

    @EntityGraph(attributePaths = {"createdBy", "assignedTo"})
    Optional<Issue> findIssueById(Long id);

    Page<Issue> findByAssignedTo(User assignedTo, Pageable pageable);
}