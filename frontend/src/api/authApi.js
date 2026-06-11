import apiClient from "./apiClient";

export const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await apiClient.patch("/auth/change-password", passwordData);
  return response.data;
};