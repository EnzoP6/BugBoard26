import apiClient from "./apiClient";

export async function getIssues(filters = {}) {
  const params = {};

  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.excludedStatus) params.excludedStatus = filters.excludedStatus;
  if (filters.priority) params.priority = filters.priority;
  if (filters.assignedToMe !== "") params.assignedToMe = filters.assignedToMe;
  if (filters.keyword) params.keyword = filters.keyword;

  if (filters.sort) params.sort = filters.sort;

  const response = await apiClient.get("/issues", { params });
  return response.data;
};

export const getIssueById = async (issueId) => {
  const response = await apiClient.get(`/issues/${issueId}`);
  return response.data;
};

export const createIssue = async (issueData) => {
  const formData = new FormData();

  formData.append("title", issueData.title);
  formData.append("description", issueData.description);
  formData.append("type", issueData.type);

  if (issueData.priority) {
    formData.append("priority", issueData.priority);
  }

  if (issueData.assignedToEmail) {
    formData.append("assignedToEmail", issueData.assignedToEmail);
  }

  if (issueData.dueDate) {
    formData.append("dueDate", issueData.dueDate);
  }

  if (issueData.image) {
    formData.append("image", issueData.image);
  }

  const response = await apiClient.post("/issues", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateIssue = async (issueId, issueData) => {
  const response = await apiClient.patch(`/issues/${issueId}`, issueData);
  return response.data;
};

export const assignIssue = async (issueId, assignedToEmail) => {
  const response = await apiClient.patch(`/issues/${issueId}/assign`, {
    assignedToEmail,
  });

  return response.data;
};

export const updateIssueStatus = async (issueId, status) => {
  const response = await apiClient.patch(`/issues/${issueId}/status`, {
    status,
  });

  return response.data;
};