import React, { useEffect, useState } from "react";
import {
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQStatus,
} from "../../apifaq.js";
import "./FAQ.css";

const emptyForm = {
  question: "",
  answer: "",
  isActive: false,
  sortOrder: 0,
};

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  console.log("faqs", faqs);
  const loadFAQs = async () => {
    try {
      setError("");
      const data = await getAdminFAQs();
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (err) {
      setError(err.message || "Unable to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleEdit = (faq) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      sortOrder: faq.sortOrder,
    });

    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        question: form.question.trim(),
        answer: form.answer.trim(),
        sortOrder: Number(form.sortOrder),
      };

      if (editingId !== null) {
        await updateFAQ(editingId, payload);
      } else {
        await createFAQ(payload);
      }

      resetForm();
      await loadFAQs();
    } catch (err) {
      setError(err.message || "Unable to save FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (faq) => {
    try {
      setError("");
      await toggleFAQStatus(faq.id, !faq.isActive);
      await loadFAQs();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    }
  };

  const handleDelete = async (faq) => {
    const confirmed = window.confirm(
      `Delete "${faq.question}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteFAQ(faq.id);

      if (editingId === faq.id) resetForm();

      await loadFAQs();
    } catch (err) {
      setError(err.message || "Unable to delete FAQ.");
    }
  };

  const filteredFAQs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="faq-cms">
      <header className="faq-cms-header">
        <div>
          <p className="faq-eyebrow">CONTENT MANAGEMENT</p>
          <h1>Frequently Asked Questions</h1>
          <p className="faq-description">
            Manage the questions and answers displayed on your website.
          </p>
        </div>

        <button
          className="faq-primary-btn"
          onClick={() => {
            resetForm();
            document
              .querySelector(".faq-form-card")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          + Add FAQ
        </button>
      </header>

      {error && <div className="faq-error">{error}</div>}

      <section className="faq-stats">
        <div className="faq-stat-card">
          <span>Total FAQs</span>
          <strong>{faqs.length}</strong>
        </div>
        <div className="faq-stat-card">
          <span>Published</span>
          <strong>{faqs.filter((faq) => faq.isActive).length}</strong>
        </div>
        <div className="faq-stat-card">
          <span>Drafts</span>
          <strong>{faqs.filter((faq) => !faq.isActive).length}</strong>
        </div>
      </section>

      <section className="faq-form-card">
        <div className="faq-card-heading">
          <div>
            <h2>{editingId !== null ? "Edit FAQ" : "Add a new FAQ"}</h2>
            <p>Enter the question and its answer below.</p>
          </div>

          {editingId !== null && (
            <button className="faq-text-btn" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="faq-question">Question</label>
          <input
            id="faq-question"
            name="question"
            value={form.question}
            onChange={handleChange}
            placeholder="e.g. What services do you offer?"
            maxLength={500}
            required
          />

          <label htmlFor="faq-answer">Answer</label>
          <textarea
            id="faq-answer"
            name="answer"
            value={form.answer}
            onChange={handleChange}
            placeholder="Write a clear answer..."
            rows={5}
            required
          />

          <div className="faq-form-row">
            <div>
              <label htmlFor="faq-sort">Sort order</label>
              <input
                id="faq-sort"
                type="number"
                name="sortOrder"
                min="0"
                value={form.sortOrder}
                onChange={handleChange}
              />
            </div>

            <label className="faq-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Publish on website
            </label>
          </div>

          <div className="faq-form-actions">
            <button
              type="button"
              className="faq-secondary-btn"
              onClick={resetForm}
            >
              Clear
            </button>

            <button type="submit" className="faq-primary-btn" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update FAQ"
                  : "Save FAQ"}
            </button>
          </div>
        </form>
      </section>

      <section className="faq-list-card">
        <div className="faq-card-heading faq-list-heading">
          <div>
            <h2>All FAQs</h2>
            <p>Manage your existing questions.</p>
          </div>

          <input
            className="faq-search"
            placeholder="Search questions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="faq-empty">Loading FAQs...</p>
        ) : filteredFAQs.length === 0 ? (
          <p className="faq-empty">
            {faqs.length
              ? "No matching FAQs found."
              : "No FAQs yet. Add your first one above."}
          </p>
        ) : (
          <div className="faq-table-wrap">
            <table className="faq-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Answer preview</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFAQs.map((faq) => (
                  <tr key={faq.id}>
                    <td className="faq-question-cell">{faq.question}</td>
                    <td className="faq-answer-cell">
                      {faq.answer.length > 90
                        ? `${faq.answer.slice(0, 90)}...`
                        : faq.answer}
                    </td>
                    <td>
                      <span
                        className={`faq-status ${
                          faq.isActive ? "is-active" : "is-inactive"
                        }`}
                      >
                        {faq.isActive ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{faq.sortOrder}</td>
                    <td>
                      <div className="faq-row-actions">
                        <button
                          className="faq-text-btn"
                          onClick={() => handleEdit(faq)}
                        >
                          Edit
                        </button>
                        <button
                          className="faq-text-btn"
                          onClick={() => handleToggle(faq)}
                        >
                          {faq.isActive ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="faq-delete-btn"
                          onClick={() => handleDelete(faq)}
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
      </section>
    </main>
  );
}
