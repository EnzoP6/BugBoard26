const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function getIssueImageUrl(imagePath) {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const normalizedPath = imagePath.replaceAll("\\", "/");

  return `${BACKEND_BASE_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
}
