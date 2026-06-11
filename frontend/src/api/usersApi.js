import apiClient from "./apiClient";

export const getUsers = async () => {
  const response = await apiClient.get("/admin/users");
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post("/admin/users", userData);
  return response.data;
};