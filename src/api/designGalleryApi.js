const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const BASE = `${API_URL}/design-gallery`;

const getToken = () => localStorage.getItem("KRinterior_cms_token");

async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

const json = (method, body) => ({
  method,
  body: JSON.stringify(body),
});

export const designGalleryApi = {
  // Categories
  getCategories: () => request(`${BASE}/admin/categories`),

  createCategory: (data) =>
    request(`${BASE}/admin/categories`, json("POST", data)),

  updateCategory: (id, data) =>
    request(`${BASE}/admin/categories/${id}`, json("PUT", data)),

  deleteCategory: (id) =>
    request(`${BASE}/admin/categories/${id}`, { method: "DELETE" }),

  // Designs
  getDesigns: () => request(`${BASE}/admin/designs`),

  createDesign: (data) => request(`${BASE}/admin/designs`, json("POST", data)),

  updateDesign: (id, data) =>
    request(`${BASE}/admin/designs/${id}`, json("PUT", data)),

  deleteDesign: (id) =>
    request(`${BASE}/admin/designs/${id}`, { method: "DELETE" }),

  // FAQs
  getFAQs: () => request(`${BASE}/admin/faqs`),

  createFAQ: (data) => request(`${BASE}/admin/faqs`, json("POST", data)),

  updateFAQ: (id, data) =>
    request(`${BASE}/admin/faqs/${id}`, json("PUT", data)),

  deleteFAQ: (id) => request(`${BASE}/admin/faqs/${id}`, { method: "DELETE" }),

  // Multiple image upload
  uploadImages: async (files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    return request(`${BASE}/admin/upload-images`, {
      method: "POST",
      body: formData,
    });
  },
};
