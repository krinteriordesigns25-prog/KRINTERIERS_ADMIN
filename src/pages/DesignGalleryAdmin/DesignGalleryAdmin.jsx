import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Save,
  Layers,
  Images,
  MessageSquare,
  Eye,
  EyeOff,
  Upload,
  GripVertical,
} from "lucide-react";

import { designGalleryApi as api } from "../../api/designGalleryApi.js";
import "./DesignGalleryAdmin.css";

const emptyCategory = {
  title: "",
  description: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

const emptyDesign = {
  categoryId: "",
  title: "",
  style: "",
  location: "",
  description: "",
  coverImage: "",
  images: [],
  features: [],
  suitableFor: [],
  sortOrder: 0,
  status: "draft",
};

const emptyFAQ = {
  categoryId: "",
  question: "",
  answer: "",
  sortOrder: 0,
  isActive: true,
};

const toLines = (value) => (Array.isArray(value) ? value.join("\n") : "");

const fromLines = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function DesignGalleryAdmin() {
  const [tab, setTab] = useState("designs");
  const [categories, setCategories] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [faqs, setFAQs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryData, designData, faqData] = await Promise.all([
        api.getCategories(),
        api.getDesigns(),
        api.getFAQs(),
      ]);

      setCategories(categoryData);
      setDesigns(designData);
      setFAQs(faqData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = (type) => {
    const defaults = {
      category: emptyCategory,
      design: {
        ...emptyDesign,
        categoryId: categories[0]?.id || "",
      },
      faq: {
        ...emptyFAQ,
        categoryId: categories[0]?.id || "",
      },
    };

    setSelectedFiles([]);
    setForm({ ...defaults[type] });
    setEditor({ type, id: null });
    setError("");
  };

  const openEdit = (type, item) => {
    setSelectedFiles([]);

    const nextForm = {
      ...item,
      categoryId: item.categoryId || "",
      features: type === "design" ? toLines(item.features) : item.features,
      suitableFor:
        type === "design" ? toLines(item.suitableFor) : item.suitableFor,
    };

    setForm(nextForm);
    setEditor({ type, id: item.id });
    setError("");
  };

  const closeEditor = () => {
    if (saving || uploading) return;

    setEditor(null);
    setSelectedFiles([]);
    setForm({});
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeExistingImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const uploadSelectedImages = async () => {
    if (!selectedFiles.length) return form.images || [];

    setUploading(true);

    try {
      const result = await api.uploadImages(selectedFiles);

      const uploaded = result.images || [];

      setSelectedFiles([]);
      return [...(form.images || []), ...uploaded];
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editor) return;

    setSaving(true);
    setError("");

    try {
      const { type, id } = editor;
      let payload = { ...form };

      if (type === "category") {
        if (!payload.title.trim()) {
          throw new Error("Category title is required.");
        }

        // Upload selected category image
        if (selectedFiles.length > 0) {
          const result = await api.uploadImages([selectedFiles[0]]);

          payload.image = result.images[0];
        }
      }

      if (type === "design") {
        if (!payload.categoryId) {
          throw new Error("Please select a category.");
        }

        if (!payload.title.trim()) {
          throw new Error("Design title is required.");
        }

        payload.images = await uploadSelectedImages();

        if (!payload.coverImage && payload.images.length) {
          payload.coverImage = payload.images[0];
        }

        payload.features = fromLines(payload.features);
        payload.suitableFor = fromLines(payload.suitableFor);
      }

      if (type === "category" && !payload.title.trim()) {
        throw new Error("Category title is required.");
      }

      if (
        type === "faq" &&
        (!payload.question.trim() || !payload.answer.trim())
      ) {
        throw new Error("Question and answer are required.");
      }

      const actions = {
        category: id
          ? () => api.updateCategory(id, payload)
          : () => api.createCategory(payload),

        design: id
          ? () => api.updateDesign(id, payload)
          : () => api.createDesign(payload),

        faq: id
          ? () => api.updateFAQ(id, payload)
          : () => api.createFAQ(payload),
      };

      await actions[type]();

      setEditor(null);
      setSelectedFiles([]);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, item) => {
    const label =
      type === "category"
        ? item.title
        : type === "design"
          ? item.title
          : item.question;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${label}"?`,
    );

    if (!confirmed) return;

    try {
      const actions = {
        category: () => api.deleteCategory(item.id),
        design: () => api.deleteDesign(item.id),
        faq: () => api.deleteFAQ(item.id),
      };

      await actions[type]();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredItems = useMemo(() => {
    const source =
      tab === "categories" ? categories : tab === "designs" ? designs : faqs;

    const value = search.toLowerCase().trim();

    if (!value) return source;

    return source.filter((item) => {
      const searchable =
        tab === "categories"
          ? item.title
          : tab === "designs"
            ? `${item.title} ${item.style || ""} ${item.location || ""}`
            : `${item.question} ${item.answer}`;

      return searchable.toLowerCase().includes(value);
    });
  }, [tab, categories, designs, faqs, search]);

  const setCover = (image) => {
    updateField("coverImage", image);
  };

  return (
    <div className="dga-page">
      {/* HEADER */}
      <div className="dga-header">
        <div>
          <span className="dga-eyebrow">WEBSITE CONTENT MANAGEMENT</span>
          <h1>Design Gallery</h1>
          <p>Manage your design collections, images and FAQs.</p>
        </div>

        <button
          className="dga-primary-btn"
          onClick={() =>
            openCreate(
              tab === "categories"
                ? "category"
                : tab === "designs"
                  ? "design"
                  : "faq",
            )
          }
        >
          <Plus size={17} />
          Add{" "}
          {tab === "categories"
            ? "Category"
            : tab === "designs"
              ? "Design"
              : "FAQ"}
        </button>
      </div>

      {/* STATISTICS */}
      <div className="dga-stats">
        <div className="dga-stat-card">
          <span className="dga-stat-icon">
            <Layers />
          </span>
          <div>
            <strong>{categories.length}</strong>
            <span>Categories</span>
          </div>
        </div>

        <div className="dga-stat-card">
          <span className="dga-stat-icon">
            <Images />
          </span>
          <div>
            <strong>{designs.length}</strong>
            <span>Total Designs</span>
          </div>
        </div>

        <div className="dga-stat-card">
          <span className="dga-stat-icon">
            <Eye />
          </span>
          <div>
            <strong>
              {designs.filter((item) => item.status === "published").length}
            </strong>
            <span>Published</span>
          </div>
        </div>

        <div className="dga-stat-card">
          <span className="dga-stat-icon">
            <MessageSquare />
          </span>
          <div>
            <strong>{faqs.length}</strong>
            <span>FAQs</span>
          </div>
        </div>
      </div>

      {/* TABS AND SEARCH */}
      <div className="dga-toolbar">
        <div className="dga-tabs">
          {[
            ["categories", "Categories"],
            ["designs", "Designs"],
            ["faqs", "FAQs"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => {
                setTab(value);
                setSearch("");
                setError("");
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="dga-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
          />
        </div>
      </div>

      {error && (
        <div className="dga-error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="dga-loading">Loading gallery content...</div>
      ) : (
        <div className="dga-content">
          {filteredItems.length === 0 ? (
            <div className="dga-empty">
              <ImagePlus size={35} />
              <h3>No {tab} found</h3>
              <p>
                Add your first {tab === "faqs" ? "FAQ" : tab.slice(0, -1)} to
                get started.
              </p>
            </div>
          ) : tab === "categories" ? (
            <div className="dga-category-grid">
              {filteredItems.map((item) => (
                <div className="dga-category-card" key={item.id}>
                  <div className="dga-category-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <ImagePlus />
                    )}

                    <span
                      className={
                        item.isActive
                          ? "dga-status published"
                          : "dga-status draft"
                      }
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="dga-card-body">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.designs?.length || 0} designs</p>
                    </div>

                    <div className="dga-actions">
                      <button
                        title="Edit"
                        onClick={() => openEdit("category", item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete("category", item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "designs" ? (
            <div className="dga-design-grid">
              {filteredItems.map((item) => (
                <div className="dga-design-card" key={item.id}>
                  <div className="dga-design-image">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} />
                    ) : (
                      <ImagePlus />
                    )}

                    <span className={`dga-status ${item.status}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="dga-card-body">
                    <div className="dga-design-info">
                      <span>{item.category?.title || "Uncategorised"}</span>
                      <h3>{item.title}</h3>
                      <p>{item.style || "No style specified"}</p>
                    </div>

                    <div className="dga-actions">
                      <button
                        title="Edit"
                        onClick={() => openEdit("design", item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete("design", item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dga-faq-list">
              {filteredItems.map((item) => (
                <div className="dga-faq-row" key={item.id}>
                  <div>
                    <span>{item.category?.title || "Category"}</span>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>

                  <div className="dga-actions">
                    <button title="Edit" onClick={() => openEdit("faq", item)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete("faq", item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDITOR MODAL */}
      {editor && (
        <div
          className="dga-editor-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditor();
          }}
        >
          <div className="dga-editor">
            <div className="dga-editor-header">
              <div>
                <span>DESIGN GALLERY CMS</span>
                <h2>
                  {editor.id ? "Edit" : "Add"}{" "}
                  {editor.type === "category"
                    ? "Category"
                    : editor.type === "design"
                      ? "Design"
                      : "FAQ"}
                </h2>
              </div>

              <button type="button" onClick={closeEditor}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="dga-editor-body">
                {editor.type === "category" && (
                  <>
                    <Field label="Category Name" required>
                      <input
                        value={form.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Example: Living Room"
                        required
                      />
                    </Field>

                    <Field label="Description">
                      <textarea
                        value={form.description || ""}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        rows="4"
                        placeholder="Describe this design category..."
                      />
                    </Field>

                    <Field label="Category Image">
                      <label className="dga-upload-area">
                        <ImagePlus size={24} />
                        <strong>Upload Category Image</strong>
                        <span>JPG, PNG, WEBP · Maximum 8 MB</span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                              setSelectedFiles([file]);
                            }

                            e.target.value = "";
                          }}
                        />
                      </label>

                      {selectedFiles.length > 0 && (
                        <div className="dga-selected-category-image">
                          <ImagePlus size={16} />
                          <span>{selectedFiles[0].name}</span>

                          <button
                            type="button"
                            onClick={() => setSelectedFiles([])}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      )}

                      {!selectedFiles.length && form.image && (
                        <div className="dga-category-preview">
                          <img src={form.image} alt="Current category" />
                          <span>Current category image</span>
                        </div>
                      )}
                    </Field>

                    <Field label="Sort Order" style={{ display: "none" }}>
                      <input
                        type="number"
                        value={form.sortOrder ?? 0}
                        onChange={(e) =>
                          updateField("sortOrder", e.target.value)
                        }
                      />
                    </Field>

                    <label className="dga-toggle">
                      <input
                        type="checkbox"
                        checked={!!form.isActive}
                        onChange={(e) =>
                          updateField("isActive", e.target.checked)
                        }
                      />
                      Active category
                    </label>
                  </>
                )}

                {editor.type === "design" && (
                  <>
                    <Field label="Category" required>
                      <select
                        value={form.categoryId || ""}
                        onChange={(e) =>
                          updateField("categoryId", e.target.value)
                        }
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Design Title" required>
                      <input
                        value={form.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Example: Modern Luxury Living Room"
                        required
                      />
                    </Field>

                    <div className="dga-form-grid">
                      <Field label="Interior Style">
                        <input
                          value={form.style || ""}
                          onChange={(e) => updateField("style", e.target.value)}
                          placeholder="Modern Luxury"
                        />
                      </Field>

                      <Field label="Location">
                        <input
                          value={form.location || ""}
                          onChange={(e) =>
                            updateField("location", e.target.value)
                          }
                          placeholder="Chennai"
                        />
                      </Field>
                    </div>

                    <Field label="Description">
                      <textarea
                        rows="5"
                        value={form.description || ""}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        placeholder="Write about this design..."
                      />
                    </Field>

                    <Field label="Design Images">
                      <label className="dga-upload-area">
                        <Upload size={24} />
                        <strong>Click to upload images</strong>
                        <span>JPG, PNG, WEBP · Maximum 8 MB per image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleFileSelect}
                        />
                      </label>
                    </Field>

                    {(form.images?.length > 0 || selectedFiles.length > 0) && (
                      <div className="dga-image-grid">
                        {(form.images || []).map((image, index) => (
                          <div
                            className="dga-image-item"
                            key={`${image}-${index}`}
                          >
                            <img src={image} alt={`Design ${index + 1}`} />

                            <button
                              type="button"
                              className="dga-image-remove"
                              onClick={() => removeExistingImage(index)}
                            >
                              <X size={14} />
                            </button>

                            <button
                              type="button"
                              className={`dga-cover-select ${form.coverImage === image ? "selected" : ""}`}
                              onClick={() => setCover(image)}
                            >
                              {form.coverImage === image
                                ? "Cover image"
                                : "Set as cover"}
                            </button>
                          </div>
                        ))}

                        {selectedFiles.map((file, index) => (
                          <div
                            className="dga-pending-file"
                            key={`${file.name}-${index}`}
                          >
                            <ImagePlus size={22} />
                            <span>{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Field label="Features (one per line)">
                      <textarea
                        rows="4"
                        value={form.features || ""}
                        onChange={(e) =>
                          updateField("features", e.target.value)
                        }
                        placeholder={
                          "Custom furniture\nPremium lighting\nMarble flooring"
                        }
                      />
                    </Field>

                    <Field label="Suitable For (one per line)">
                      <textarea
                        rows="3"
                        value={form.suitableFor || ""}
                        onChange={(e) =>
                          updateField("suitableFor", e.target.value)
                        }
                        placeholder={"Apartments\nLuxury Villas\nModern Homes"}
                      />
                    </Field>

                    <div className="dga-form-grid">
                      <Field label="Sort Order" style={{ display: "none" }}>
                        <input
                          type="number"
                          value={form.sortOrder ?? 0}
                          onChange={(e) =>
                            updateField("sortOrder", e.target.value)
                          }
                        />
                      </Field>

                      <Field label="Publishing Status">
                        <select
                          value={form.status || "draft"}
                          onChange={(e) =>
                            updateField("status", e.target.value)
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </Field>
                    </div>
                  </>
                )}

                {editor.type === "faq" && (
                  <>
                    <Field label="Category" required>
                      <select
                        value={form.categoryId || ""}
                        onChange={(e) =>
                          updateField("categoryId", e.target.value)
                        }
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Question" required>
                      <input
                        value={form.question || ""}
                        onChange={(e) =>
                          updateField("question", e.target.value)
                        }
                        placeholder="What is included in this design?"
                        required
                      />
                    </Field>

                    <Field label="Answer" required>
                      <textarea
                        rows="6"
                        value={form.answer || ""}
                        onChange={(e) => updateField("answer", e.target.value)}
                        placeholder="Enter the answer..."
                        required
                      />
                    </Field>

                    <Field label="Sort Order" style={{ display: "none" }}>
                      <input
                        type="number"
                        value={form.sortOrder ?? 0}
                        onChange={(e) =>
                          updateField("sortOrder", e.target.value)
                        }
                      />
                    </Field>

                    <label className="dga-toggle">
                      <input
                        type="checkbox"
                        checked={!!form.isActive}
                        onChange={(e) =>
                          updateField("isActive", e.target.checked)
                        }
                      />
                      Active FAQ
                    </label>
                  </>
                )}
              </div>

              <div className="dga-editor-footer">
                <button
                  type="button"
                  className="dga-cancel-btn"
                  onClick={closeEditor}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dga-primary-btn"
                  disabled={saving || uploading}
                >
                  <Save size={16} />
                  {uploading
                    ? "Uploading..."
                    : saving
                      ? "Saving..."
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children, style }) {
  return (
    <label className="dga-field" style={style}>
      <span>
        {label} {required && <i>*</i>}
      </span>
      {children}
    </label>
  );
}
