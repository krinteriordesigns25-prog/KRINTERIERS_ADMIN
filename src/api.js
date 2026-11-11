const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "http://localhost:5173"
).replace(/\/$/, "");
const TOKEN_KEY = "KRinterior_cms_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Cannot reach the server. Is the API running?");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (res.status === 401 && path !== "/auth/login")
    window.dispatchEvent(new Event("cms-unauthorized"));
  if (!res.ok) {
    const e = new Error(data?.message || `Request failed (${res.status})`);
    e.status = res.status;
    throw e;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  changePassword: (currentPassword, newPassword) =>
    request("/admin/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),
  menus: () => request("/admin/menus"),
  createMenu: (b) => request("/admin/menus", { method: "POST", body: b }),
  updateMenu: (id, b) =>
    request(`/admin/menus/${id}`, { method: "PUT", body: b }),
  deleteMenu: (id) => request(`/admin/menus/${id}`, { method: "DELETE" }),
  pages: () => request("/admin/pages"),
  page: (id) => request(`/admin/pages/${id}`),
  createPage: (b) => request("/admin/pages", { method: "POST", body: b }),
  updatePage: (id, b) =>
    request(`/admin/pages/${id}`, { method: "PUT", body: b }),
  setPublished: (id, published) =>
    request(`/admin/pages/${id}/published`, {
      method: "PATCH",
      body: { published },
    }),
  deletePage: (id) => request(`/admin/pages/${id}`, { method: "DELETE" }),
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/admin/upload", { method: "POST", form });
  },
  // Carousel APIs
  carousels: () => request("/carousels/carousels"),

  carousel: (id) => request(`/carousels/carousels/${id}`),

  createCarousel: (data) =>
    request("/carousels/carousels", {
      method: "POST",
      body: data,
    }),

  updateCarousel: (id, data) =>
    request(`/carousels/carousels/${id}`, {
      method: "PUT",
      body: data,
    }),

  setCarouselPublished: (id, published) =>
    request(`/carousels/carousels/${id}/published`, {
      method: "PATCH",
      body: { published },
    }),

  deleteCarousel: (id) =>
    request(`/carousels/carousels/${id}`, {
      method: "DELETE",
    }),
};
