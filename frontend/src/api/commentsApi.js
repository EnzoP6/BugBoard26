import apiClient from "./apiClient";

export async function getComments(issueId) {
  const response = await apiClient.get(`/issues/${issueId}/comments`);
  return response.data;
}

export async function createComment(issueId, text) {
  const response = await apiClient.post(`/issues/${issueId}/comments`, { text });
  return response.data;
}

export async function updateComment(commentId, text) {
  const response = await apiClient.patch(`/comments/${commentId}`, { text });
  return response.data;
}

export async function deleteComment(commentId) {
  await apiClient.delete(`/comments/${commentId}`);
}
