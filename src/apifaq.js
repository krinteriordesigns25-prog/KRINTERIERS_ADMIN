const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("KRinterior_cms_token");

async function request(path, options = {}, auth = true) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const getAdminFAQs = () => request("/faq");

export const createFAQ = (faq) =>
  request("/faq", {
    method: "POST",
    body: JSON.stringify(faq),
  });

export const updateFAQ = (id, faq) =>
  request(`/faq/${id}`, {
    method: "PUT",
    body: JSON.stringify(faq),
  });

export const deleteFAQ = (id) =>
  request(`/faq/${id}`, {
    method: "DELETE",
  });

export const toggleFAQStatus = (id, isActive) =>
  request(`/faq/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });

export const getPublicFAQs = () => request("/faq", {}, false);
