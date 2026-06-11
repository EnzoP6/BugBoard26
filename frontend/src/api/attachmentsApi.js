import apiClient from "./apiClient";

export const getAttachmentsByIssue = async (issueId) => {
  const response = await apiClient.get(`/issues/${issueId}/attachments`);
  return response.data;
};

export const uploadAttachment = async (issueId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    `/issues/${issueId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};