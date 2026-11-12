import React, { useEffect, useState } from "react";
// import { api } from "../api";
import "./CarouselCMS.css";
import { api } from "../api";

const EMPTY_FORM = {
  title: "",
  header: "",
  subHeader: "",
  image: "",
  sortOrder: 0,
  published: true,
};

export default function CarouselCMS() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCarousels();
  }, []);

  async function loadCarousels() {
    setLoading(true);
    setError("");

    try {
      const result = await api.carousels();

      // Supports either an array or { carousels: [...] } / { data: [...] }.
      const rows = Array.isArray(result)
        ? result
        : (result?.carousels ?? result?.data ?? []);

      setItems(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Unable to load carousel items.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image size must be 8 MB or less.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview((previous) => {
      if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
      return previewUrl;
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);

    setImagePreview((previous) => {
      if (previous.startsWith("blob:")) URL.revokeObjectURL(previous);
      return "";
    });

    const input = document.getElementById("carousel-image");
    if (input) input.value = "";
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      header: item.header || "",
      subHeader: item.subHeader || "",
      image: item.image || "",
      sortOrder: item.sortOrder ?? 0,
      published: item.isActive ?? true,
    });

    setImageFile(null);
    setImagePreview(item.image || "");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = form.image;

      // Upload the selected image using your existing API.
      if (imageFile) {
        const uploaded = await api.upload(imageFile);
        imageUrl = uploaded?.url;

        if (!imageUrl) {
          throw new Error(
            "Image uploaded, but the server did not return an image URL.",
          );
        }
      }

      if (!imageUrl) {
        throw new Error("Please select a carousel image.");
      }

      const payload = {
        title: form.title.trim(),
        header: form.header.trim(),
        subHeader: form.subHeader.trim(),
        image: imageUrl,
        sortOrder: Number(form.sortOrder) || 0,
        published: Boolean(form.published),
      };

      if (editingId !== null) {
        await api.updateCarousel(editingId, payload);
        setSuccess("Carousel updated successfully.");
      } else {
        await api.createCarousel(payload);
        setSuccess("Carousel created successfully.");
      }

      resetForm();
      await loadCarousels();
    } catch (err) {
      setError(err.message || "Unable to save carousel.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublished(item) {
    setError("");
    setSuccess("");

    try {
      await api.setCarouselPublished(item.id, !item.isActive);
      setSuccess(
        item.isActive
          ? "Carousel unpublished successfully."
          : "Carousel published successfully.",
      );
      await loadCarousels();
    } catch (err) {
      setError(err.message || "Unable to change publish status.");
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.deleteCarousel(item.id);

      if (editingId === item.id) resetForm();

      setSuccess("Carousel deleted successfully.");
      await loadCarousels();
    } catch (err) {
      setError(err.message || "Unable to delete carousel.");
    }
  }

  return (
    <main className="carousel-cms">
      <div className="carousel-cms__heading">
        <div>
          <p className="carousel-cms__eyebrow">WEBSITE CONTENT</p>
          <h1>Carousel Management</h1>
          <p className="carousel-cms__description">
            Manage your homepage carousel images and content.
          </p>
        </div>

        <span className="carousel-cms__count">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {error && (
        <div className="carousel-cms__alert carousel-cms__alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="carousel-cms__alert carousel-cms__alert--success">
          {success}
        </div>
      )}

      <section className="carousel-cms__panel">
        <div className="carousel-cms__panel-heading">
          <div>
            <h2>{editingId !== null ? "Edit Carousel" : "Add Carousel"}</h2>
            <p>Add the image and text that should appear in your carousel.</p>
          </div>

          {editingId !== null && (
            <button
              type="button"
              className="carousel-cms__button carousel-cms__button--light"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="carousel-cms__form">
          <div className="carousel-cms__fields">
            <label className="carousel-cms__field">
              <span>Title *</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Living Room Collection"
                maxLength={200}
                required
              />
            </label>

            <label className="carousel-cms__field">
              <span>Header *</span>
              <input
                name="header"
                value={form.header}
                onChange={handleChange}
                placeholder="Main heading"
                maxLength={200}
                required
              />
            </label>

            <label className="carousel-cms__field carousel-cms__field--full">
              <span>Subheader *</span>
              <textarea
                name="subHeader"
                value={form.subHeader}
                onChange={handleChange}
                placeholder="Enter the supporting text"
                rows={3}
                maxLength={200}
                required
              />
            </label>

            <label className="carousel-cms__field " style={{ display: "none" }}>
              <span>Display order</span>
              <input
                name="sortOrder"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={handleChange}
              />
            </label>

            <label className="carousel-cms__field carousel-cms__field--checkbox">
              <input
                name="published"
                type="checkbox"
                checked={form.published}
                onChange={handleChange}
              />
              <span>Publish this carousel item</span>
            </label>

            <div className="carousel-cms__field carousel-cms__field--full">
              <label htmlFor="carousel-image">Carousel image *</label>

              <input
                id="carousel-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              <p className="carousel-cms__hint">
                Supported image files. Maximum size: 8 MB.
                {editingId !== null &&
                  " Select a new image only if you want to replace the existing one."}
              </p>

              {imagePreview && (
                <div className="carousel-cms__preview">
                  <img src={imagePreview} alt="Carousel preview" />
                </div>
              )}
            </div>
          </div>

          <div className="carousel-cms__form-actions">
            <button
              type="submit"
              className="carousel-cms__button carousel-cms__button--primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Carousel"
                  : "Create Carousel"}
            </button>

            <button
              type="button"
              className="carousel-cms__button carousel-cms__button--light"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="carousel-cms__list-section">
        <div className="carousel-cms__list-heading">
          <h2>Carousel Items</h2>
          <button
            type="button"
            className="carousel-cms__button carousel-cms__button--light"
            onClick={loadCarousels}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="carousel-cms__empty">Loading carousel items...</p>
        ) : items.length === 0 ? (
          <div className="carousel-cms__empty">
            <h3>No carousel items yet</h3>
            <p>Add your first carousel using the form above.</p>
          </div>
        ) : (
          <div className="carousel-cms__grid">
            {items.map((item) => (
              <article className="carousel-cms__card" key={item.id}>
                <div className="carousel-cms__card-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title || "Carousel"} />
                  ) : (
                    <div className="carousel-cms__no-image">No image</div>
                  )}

                  <span
                    className={`carousel-cms__status ${
                      item.isActive
                        ? "carousel-cms__status--published"
                        : "carousel-cms__status--draft"
                    }`}
                  >
                    {item.isActive ? "Published" : "Unpublished"}
                  </span>
                </div>

                <div className="carousel-cms__card-content">
                  <p className="carousel-cms__card-order">
                    ORDER: {item.sortOrder ?? 0}
                  </p>

                  <h3>{item.title}</h3>
                  <h4>{item.header}</h4>
                  <p className="carousel-cms__card-subheader">
                    {item.subHeader}
                  </p>

                  <div className="carousel-cms__card-actions">
                    <button
                      type="button"
                      className="carousel-cms__button carousel-cms__button--light"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="carousel-cms__button carousel-cms__button--light"
                      onClick={() => handlePublished(item)}
                    >
                      {item.isActive ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="carousel-cms__button carousel-cms__button--danger"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
