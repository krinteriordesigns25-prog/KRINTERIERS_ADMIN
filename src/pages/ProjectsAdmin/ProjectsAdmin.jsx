import React, { useEffect, useState } from "react";
import { projectApi, getProjectImageUrl } from "../../projectApi.js";
import ProjectEditor from "./ProjectEditor";
import "./ProjectsAdmin.css";

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      const result = await projectApi.getAll();
      setProjects(result.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAdd = () => {
    setEditingProject(null);
    setShowEditor(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowEditor(true);
  };

  const handleSave = async (formData) => {
    if (editingProject?.id) {
      await projectApi.update(editingProject.id, formData);
    } else {
      await projectApi.create(formData);
    }

    setShowEditor(false);
    setEditingProject(null);
    await loadProjects();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await projectApi.remove(id);
      await loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatus = async (project) => {
    const nextStatus = project.status === "published" ? "draft" : "published";

    try {
      await projectApi.updateStatus(project.id, nextStatus);
      await loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProjects = projects.filter((project) =>
    `${project.title} ${project.location} ${project.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (showEditor) {
    return (
      <ProjectEditor
        initialProject={editingProject}
        onSave={handleSave}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="works-admin">
      <div className="works-admin-header">
        <div>
          <span className="admin-eyebrow">WEBSITE CONTENT</span>
          <h1>Our Works</h1>
          <p>Manage your interior design projects.</p>
        </div>

        <button className="admin-primary-btn" onClick={handleAdd}>
          + Add New Project
        </button>
      </div>

      <div className="works-admin-stats">
        <div>
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>

        <div>
          <span>Published</span>
          <strong>
            {projects.filter((p) => p.status === "published").length}
          </strong>
        </div>

        <div>
          <span>Drafts</span>
          <strong>
            {projects.filter((p) => p.status !== "published").length}
          </strong>
        </div>
      </div>

      <div className="works-admin-toolbar">
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={loadProjects}>↻ Refresh</button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p>Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <div className="admin-empty">
          <h3>No projects found</h3>
          <p>Add your first interior design project.</p>
          <button className="admin-primary-btn" onClick={handleAdd}>
            Add Project
          </button>
        </div>
      ) : (
        <div className="works-admin-table-wrap">
          <table className="works-admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Type</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="admin-project-name">
                      <img
                        src={getProjectImageUrl(project.coverImage)}
                        alt={project.title}
                      />
                      <div>
                        <strong>{project.title}</strong>
                        <small>{project.slug}</small>
                      </div>
                    </div>
                  </td>

                  <td>{project.location || "—"}</td>
                  <td>{project.propertyType || "—"}</td>
                  <td>{project.sections?.length || 0}</td>

                  <td>
                    <span className={`project-status ${project.status}`}>
                      {project.status}
                    </span>
                  </td>

                  <td>
                    <div className="admin-row-actions">
                      <button onClick={() => handleEdit(project)}>Edit</button>

                      <button onClick={() => handleStatus(project)}>
                        {project.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        className="delete-action"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
