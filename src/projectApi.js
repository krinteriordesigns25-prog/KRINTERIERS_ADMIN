const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("KRinterior_cms_token");

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
}

export const projectApi = {
  getAll: () => request("/projects"),

  create: (data) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    request(`/projects/${id}`, {
      method: "DELETE",
    }),

  updateStatus: (id, status) =>
    request(`/projects/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  reorder: (orderedIds) =>
    request("/projects/reorder", {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    }),

  upload: (files) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    return request("/projects/upload", {
      method: "POST",
      body: formData,
    });
  },
};

export const getProjectImageUrl = (image) => {
  if (!image) return "";

  const url = typeof image === "string" ? image : image.url;

  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const serverBase = API_URL.replace(/\/api\/?$/, "");

  return `${serverBase}${url.startsWith("/") ? "" : "/"}${url}`;
};
