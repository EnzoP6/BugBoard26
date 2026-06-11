import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getCommentsByIssueId = async (issueId) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/issues/${issueId}/comments`,
    getAuthHeaders()
  );
  return response.data;
};

export const createComment = async (issueId, text) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/issues/${issueId}/comments`,
    { text },
    getAuthHeaders()
  );
  return response.data;
};

export const updateComment = async (commentId, text) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/comments/${commentId}`,
    { text },
    getAuthHeaders()
  );
  return response.data;
};

export const deleteComment = async (commentId) => {
  await axios.delete(
    `${API_BASE_URL}/api/comments/${commentId}`,
    getAuthHeaders()
  );
};
