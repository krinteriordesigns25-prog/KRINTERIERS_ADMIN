import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.menus(), api.pages()])
      .then(([menus, pages]) => setData({ menus, pages }))
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <p className="muted">Loading…</p>;
  const { menus, pages } = data;
  const published = pages.filter((p) => p.published).length;
  const recent = [...pages]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);
  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        {/* <Link className="btn-primary" to="/pages/new">
          + New page
        </Link> */}
      </div>
      <div className="stats">
        <div className="stat-card">
          <strong>{menus.length}</strong>
          <span>Menus</span>
        </div>
        <div className="stat-card">
          <strong>{pages.length}</strong>
          <span>Pages</span>
        </div>
        <div className="stat-card">
          <strong>{published}</strong>
          <span>Published</span>
        </div>
        <div className="stat-card">
          <strong>{pages.length - published}</strong>
          <span>Drafts</span>
        </div>
      </div>
      <div className="card">
        <h2>Recently updated</h2>
        {recent.length ? (
          <table className="table">
            <tbody>
              {recent.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/pages/${p.id}`}>{p.title}</Link>
                  </td>
                  <td className="muted">{p.menu?.title}</td>
                  <td>
                    <span className={`badge ${p.published ? "ok" : "draft"}`}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">
            No pages yet. Create a menu first, then add your first page.
          </p>
        )}
      </div>
    </>
  );
}
