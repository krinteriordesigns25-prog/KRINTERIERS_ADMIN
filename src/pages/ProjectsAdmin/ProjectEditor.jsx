import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { projectApi, getProjectImageUrl } from "../../projectApi.js";

import { SortableSection, SortableImage } from "./ProjectSortable";

const emptyProject = {
  title: "",
  slug: "",
  location: "",
  propertyType: "Apartment",
  category: "Residential",
  size: "",
  clientName: "",
  duration: "",
  theme: "",
  shortDescription: "",
  description: "",
  coverImage: "",
  scopeOfWork: [],
  gallery: [],
  sections: [],
  status: "draft",
  sortOrder: 0,
};

const createSection = () => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  description: "",
  layoutType: "image-right",
  images: [],
  highlights: [],
});

export default function ProjectEditor({ initialProject, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyProject,
    ...(initialProject || {}),
    scopeOfWork: initialProject?.scopeOfWork || [],
    gallery: initialProject?.gallery || [],
    sections: initialProject?.sections || [],
  }));

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const makeSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const uploadFiles = async (files) => {
    if (!files?.length) return [];

    setUploading(true);
    setError("");

    try {
      const result = await projectApi.upload(files);
      return result.data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const uploadCover = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;

    const uploaded = await uploadFiles(files);

    if (uploaded[0]) {
      updateField("coverImage", uploaded[0].url);
    }

    event.target.value = "";
  };

  const uploadGallery = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;

    const uploaded = await uploadFiles(files);

    updateField("gallery", [
      ...form.gallery,
      ...uploaded.map((item) => item.url),
    ]);

    event.target.value = "";
  };

  const uploadSectionImages = async (sectionIndex, event) => {
    const files = event.target.files;
    if (!files?.length) return;

    const uploaded = await uploadFiles(files);

    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              images: [
                ...(section.images || []),
                ...uploaded.map((item) => item.url),
              ],
            }
          : section,
      ),
    }));

    event.target.value = "";
  };

  const updateScope = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      scopeOfWork: prev.scopeOfWork.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addScope = () => {
    setForm((prev) => ({
      ...prev,
      scopeOfWork: [
        ...prev.scopeOfWork,
        {
          id: `scope-${Date.now()}`,
          title: "",
          description: "",
        },
      ],
    }));
  };

  const removeScope = (index) => {
    setForm((prev) => ({
      ...prev,
      scopeOfWork: prev.scopeOfWork.filter((_, i) => i !== index),
    }));
  };

  const updateSection = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createSection()],
    }));
  };

  const removeSection = (index) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const addHighlight = (sectionIndex) => {
    const section = form.sections[sectionIndex];

    updateSection(sectionIndex, "highlights", [
      ...(section.highlights || []),
      "",
    ]);
  };

  const updateHighlight = (sectionIndex, highlightIndex, value) => {
    const section = form.sections[sectionIndex];

    updateSection(
      sectionIndex,
      "highlights",
      section.highlights.map((item, i) =>
        i === highlightIndex ? value : item,
      ),
    );
  };

  const removeHighlight = (sectionIndex, highlightIndex) => {
    const section = form.sections[sectionIndex];

    updateSection(
      sectionIndex,
      "highlights",
      section.highlights.filter((_, i) => i !== highlightIndex),
    );
  };

  const reorderSections = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setForm((prev) => {
      const oldIndex = prev.sections.findIndex(
        (section) => section.id === active.id,
      );

      const newIndex = prev.sections.findIndex(
        (section) => section.id === over.id,
      );

      if (oldIndex < 0 || newIndex < 0) return prev;

      return {
        ...prev,
        sections: arrayMove(prev.sections, oldIndex, newIndex),
      };
    });
  };

  const reorderGallery = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setForm((prev) => {
      const oldIndex = prev.gallery.findIndex(
        (_, index) => `gallery-${index}` === active.id,
      );

      const newIndex = prev.gallery.findIndex(
        (_, index) => `gallery-${index}` === over.id,
      );

      if (oldIndex < 0 || newIndex < 0) return prev;

      return {
        ...prev,
        gallery: arrayMove(prev.gallery, oldIndex, newIndex),
      };
    });
  };

  const reorderSectionImages = (sectionIndex, { active, over }) => {
    if (!over || active.id === over.id) return;

    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index !== sectionIndex) return section;

        const oldIndex = section.images.findIndex(
          (_, i) => `section-${sectionIndex}-${i}` === active.id,
        );

        const newIndex = section.images.findIndex(
          (_, i) => `section-${sectionIndex}-${i}` === over.id,
        );

        if (oldIndex < 0 || newIndex < 0) return section;

        return {
          ...section,
          images: arrayMove(section.images, oldIndex, newIndex),
        };
      }),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Project title is required");
      return;
    }

    if (!form.slug.trim()) {
      setError("Project slug is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        sections: form.sections.map((section, index) => ({
          ...section,
          sortOrder: index,
        })),
      };

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Unable to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="project-editor" onSubmit={handleSave}>
      <div className="editor-header">
        <div>
          <span className="admin-eyebrow">OUR WORKS / PROJECT EDITOR</span>
          <h1>{initialProject ? "Edit Project" : "Add Project"}</h1>
          <p>Manage your project content and design sections.</p>
        </div>

        <div className="editor-header-actions">
          <button type="button" className="admin-light-btn" onClick={onCancel}>
            Cancel
          </button>

          <button
            type="submit"
            className="admin-primary-btn"
            disabled={saving || uploading}
          >
            {saving ? "Saving..." : "Save Project"}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* BASIC INFORMATION */}

      <section className="editor-card">
        <div className="editor-section-heading">
          <h2>Project Information</h2>
          <p>Basic information shown on the public project page.</p>
        </div>

        <div className="editor-grid">
          <label>
            Project Title *
            <input
              required
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: prev.id ? prev.slug : makeSlug(title),
                }));
              }}
              placeholder="Santhosh Residence"
            />
          </label>

          <label>
            URL Slug *
            <input
              required
              value={form.slug}
              onChange={(e) => updateField("slug", makeSlug(e.target.value))}
              placeholder="santhosh-residence-chennai"
            />
          </label>

          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Chennai"
            />
          </label>

          <label>
            Property Type
            <input
              value={form.propertyType}
              onChange={(e) => updateField("propertyType", e.target.value)}
              placeholder="Apartment"
            />
          </label>

          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="Residential"
            />
          </label>

          <label>
            Size
            <input
              value={form.size}
              onChange={(e) => updateField("size", e.target.value)}
              placeholder="3 BHK"
            />
          </label>

          <label>
            Client Name
            <input
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="Mr. Santhosh"
            />
          </label>

          <label>
            Duration
            <input
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              placeholder="75 Days"
            />
          </label>

          <label>
            Design Theme
            <input
              value={form.theme}
              onChange={(e) => updateField("theme", e.target.value)}
              placeholder="Contemporary"
            />
          </label>
        </div>

        <label className="editor-full-label">
          Short Description
          <textarea
            rows="2"
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
          />
        </label>

        <label className="editor-full-label">
          Project Description
          <textarea
            rows="5"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </label>
      </section>

      {/* COVER IMAGE */}

      <section className="editor-card">
        <div className="editor-section-heading">
          <h2>Cover Image</h2>
          <p>Main image used on the Our Works listing and project hero.</p>
        </div>

        <label className="upload-box">
          <input type="file" accept="image/*" onChange={uploadCover} />
          <span>＋</span>
          <strong>{uploading ? "Uploading..." : "Upload Cover Image"}</strong>
          <small>JPG, PNG, WEBP or AVIF · Maximum 10 MB</small>
        </label>

        {form.coverImage && (
          <div className="cover-preview">
            <img
              src={getProjectImageUrl(form.coverImage)}
              alt="Cover preview"
            />

            <button type="button" onClick={() => updateField("coverImage", "")}>
              Remove Cover
            </button>
          </div>
        )}
      </section>

      {/* SCOPE OF WORK */}

      <section className="editor-card">
        <div className="editor-section-heading editor-heading-row">
          <div>
            <h2>Scope of Work</h2>
            <p>Add the spaces and services included in this project.</p>
          </div>

          <button type="button" className="admin-light-btn" onClick={addScope}>
            + Add Scope
          </button>
        </div>

        {form.scopeOfWork.map((item, index) => (
          <div className="scope-editor-row" key={item.id || index}>
            <label>
              Title
              <input
                value={item.title || ""}
                onChange={(e) => updateScope(index, "title", e.target.value)}
                placeholder="Living Room"
              />
            </label>

            <label>
              Description
              <input
                value={item.description || ""}
                onChange={(e) =>
                  updateScope(index, "description", e.target.value)
                }
                placeholder="Custom furniture and lighting."
              />
            </label>

            <button
              type="button"
              className="remove-item-btn"
              onClick={() => removeScope(index)}
            >
              ×
            </button>
          </div>
        ))}
      </section>

      {/* GALLERY */}

      <section className="editor-card" style={{ display: "none" }}>
        <div className="editor-section-heading">
          <h2>Project Gallery</h2>
          <p>Upload and drag images to change their display order.</p>
        </div>

        <label className="upload-box compact-upload">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={uploadGallery}
          />
          <span>＋</span>
          <strong>Upload Gallery Images</strong>
        </label>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={reorderGallery}
        >
          <SortableContext
            items={form.gallery.map((_, index) => `gallery-${index}`)}
            strategy={rectSortingStrategy}
          >
            <div className="admin-image-grid">
              {form.gallery.map((image, index) => (
                <SortableImage
                  key={`gallery-${index}`}
                  id={`gallery-${index}`}
                  image={image}
                  onRemove={() =>
                    updateField(
                      "gallery",
                      form.gallery.filter((_, i) => i !== index),
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      {/* DYNAMIC SECTIONS */}

      <section className="editor-card">
        <div className="editor-section-heading editor-heading-row">
          <div>
            <h2>Dynamic Design Sections</h2>
            <p>Add room-wise content and choose the image layout.</p>
          </div>

          <button
            type="button"
            className="admin-primary-btn"
            onClick={addSection}
          >
            + Add Section
          </button>
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={reorderSections}
        >
          <SortableContext
            items={form.sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            {form.sections.map((section, index) => (
              <SortableSection key={section.id} id={section.id}>
                <div className="section-editor">
                  <div className="section-editor-heading">
                    <div>
                      <span>SECTION {String(index + 1).padStart(2, "0")}</span>
                      <h3>{section.title || "New Design Section"}</h3>
                    </div>

                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeSection(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="editor-grid">
                    <label>
                      Section Title
                      <input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(index, "title", e.target.value)
                        }
                        placeholder="Living Room"
                      />
                    </label>

                    <label style={{ display: "none" }}>
                      Image Layout
                      <select
                        value={section.layoutType || "image-right"}
                        onChange={(e) =>
                          updateSection(index, "layoutType", e.target.value)
                        }
                      >
                        <option value="image-left">Image Left</option>
                        <option value="image-right">Image Right</option>
                        <option value="full-width">Full Width</option>
                        <option value="two-column">Two Column</option>
                        <option value="three-column">Three Column</option>
                        <option value="slider">Slider</option>
                        <option value="text-only">Text Only</option>
                      </select>
                    </label>
                  </div>

                  <label className="editor-full-label">
                    Description
                    <textarea
                      rows="4"
                      value={section.description}
                      onChange={(e) =>
                        updateSection(index, "description", e.target.value)
                      }
                    />
                  </label>

                  <div className="editor-subheading">
                    <h4>Section Images</h4>
                    <label className="admin-light-btn upload-inline">
                      + Upload Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => uploadSectionImages(index, e)}
                      />
                    </label>
                  </div>

                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => reorderSectionImages(index, event)}
                  >
                    <SortableContext
                      items={(section.images || []).map(
                        (_, imageIndex) => `section-${index}-${imageIndex}`,
                      )}
                      strategy={rectSortingStrategy}
                    >
                      <div className="admin-image-grid">
                        {(section.images || []).map((image, imageIndex) => (
                          <SortableImage
                            key={`${section.id}-image-${imageIndex}`}
                            id={`section-${index}-${imageIndex}`}
                            image={image}
                            onRemove={() =>
                              updateSection(
                                index,
                                "images",
                                section.images.filter(
                                  (_, i) => i !== imageIndex,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="editor-subheading">
                    <h4>Highlights</h4>
                    <button
                      type="button"
                      className="admin-light-btn"
                      onClick={() => addHighlight(index)}
                    >
                      + Add Highlight
                    </button>
                  </div>

                  {(section.highlights || []).map(
                    (highlight, highlightIndex) => (
                      <div
                        className="highlight-editor-row"
                        key={highlightIndex}
                      >
                        <input
                          value={
                            typeof highlight === "string"
                              ? highlight
                              : highlight.description || ""
                          }
                          onChange={(e) =>
                            updateHighlight(
                              index,
                              highlightIndex,
                              e.target.value,
                            )
                          }
                          placeholder="Custom furniture and warm lighting"
                        />

                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeHighlight(index, highlightIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </SortableSection>
            ))}
          </SortableContext>
        </DndContext>
      </section>

      {/* PUBLISH SETTINGS */}

      <section className="editor-card">
        <div className="editor-section-heading">
          <h2>Publish Settings</h2>
          <p>Choose whether this project appears on the public website.</p>
        </div>

        <label className="editor-full-label">
          Project Status
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </section>

      <div className="editor-footer">
        <button type="button" className="admin-light-btn" onClick={onCancel}>
          Cancel
        </button>

        <button
          type="submit"
          className="admin-primary-btn"
          disabled={saving || uploading}
        >
          {saving ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}
