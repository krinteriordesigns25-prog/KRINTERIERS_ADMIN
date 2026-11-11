const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const token = localStorage.getItem("KRinterior_cms_token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

export const getAdminReviews = async () => {
  const data = await request("/reviews");
  return Array.isArray(data) ? data : (data.reviews ?? data.data ?? []);
};

export const createReview = (payload) =>
  request("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateReview = (id, payload) =>
  request(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const setReviewPublished = (id, isActive) =>
  request(`/reviews/${id}/published`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });

export const deleteReview = (id) =>
  request(`/reviews/${id}`, { method: "DELETE" });

export const getPublicReviews = async () => {
  const data = await request("/public/reviews");
  return Array.isArray(data) ? data : (data.reviews ?? data.data ?? []);
};
