package com.bugboard26.issue.exception;

public class ForbiddenIssueOperationException extends RuntimeException {

    public ForbiddenIssueOperationException(String message) {
        super(message);
    }
}
