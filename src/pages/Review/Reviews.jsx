import { useCallback, useEffect, useState } from "react";
import {
  createReview,
  deleteReview,
  getAdminReviews,
  setReviewPublished,
  updateReview,
} from "../../apireviews.js";
import "./Reviews.css";

const emptyForm = {
  name: "",
  role: "",
  rating: 5,
  review: "",
  sortOrder: 0,
  isActive: false,
};

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReviews(await getAdminReviews());
    } catch (err) {
      setError(
        err.message || "Unable to load reviews. Check your login and API URL.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const setField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const editReview = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name ?? "",
      role: item.role ?? "",
      rating: Number(item.rating ?? 5),
      review: item.review ?? "",
      sortOrder: Number(item.sortOrder ?? 0),
      isActive: Boolean(item.isActive),
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      rating: Number(form.rating),
      sortOrder: Number(form.sortOrder),
    };

    try {
      if (editingId) {
        await updateReview(editingId, payload);
        setMessage("Review updated successfully.");
      } else {
        await createReview(payload);
        setMessage("Review created successfully.");
      }
      resetForm();
      setMessage(
        editingId
          ? "Review updated successfully."
          : "Review created successfully.",
      );
      await loadReviews();
    } catch (err) {
      setError(err.message || "Unable to save review.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (item) => {
    setError("");
    setMessage("");
    try {
      await setReviewPublished(item.id, !item.isActive);
      setMessage(!item.isActive ? "Review published." : "Review unpublished.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Unable to change publication status.");
    }
  };

  const removeReview = async (item) => {
    if (
      !window.confirm(
        `Delete the review from ${item.name}? This cannot be undone.`,
      )
    )
      return;
    setError("");
    setMessage("");
    try {
      await deleteReview(item.id);
      if (editingId === item.id) resetForm();
      setMessage("Review deleted.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Unable to delete review.");
    }
  };

  return (
    <main className="reviews-admin">
      <div className="reviews-admin__header">
        <div>
          <p className="reviews-admin__eyebrow">KRinterior CMS</p>
          <h1>Customer Reviews</h1>
          <p>Manage testimonials shown on your public website.</p>
        </div>
        <button
          type="button"
          className="reviews-btn reviews-btn--secondary"
          onClick={loadReviews}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="reviews-alert reviews-alert--error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="reviews-alert reviews-alert--success" role="status">
          {message}
        </div>
      )}

      <section className="reviews-panel">
        <h2>{editingId ? "Edit review" : "Add a review"}</h2>
        <form onSubmit={handleSubmit} className="reviews-form">
          <div className="reviews-form__grid">
            <label>
              Customer name *
              <input
                name="name"
                value={form.name}
                onChange={setField}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label>
              Customer Details
              <input
                name="role"
                value={form.role}
                onChange={setField}
                maxLength={120}
                placeholder=""
              />
            </label>
            <label>
              Rating *
              <select
                name="rating"
                value={form.rating}
                onChange={setField}
                required
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Display order
              <input
                name="sortOrder"
                type="number"
                min="0"
                max="1000000"
                value={form.sortOrder}
                onChange={setField}
              />
            </label>
          </div>

          <label>
            Review text *
            <textarea
              name="review"
              value={form.review}
              onChange={setField}
              minLength={5}
              maxLength={2000}
              rows={4}
              required
              placeholder="Write the customer's feedback..."
            />
            <small>{form.review.length}/2000 characters</small>
          </label>

          <label className="reviews-checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={setField}
            />
            Publish immediately
          </label>

          <div className="reviews-form__actions">
            <button
              className="reviews-btn reviews-btn--primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create review"}
            </button>
            {editingId && (
              <button
                className="reviews-btn reviews-btn--secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="reviews-panel">
        <div className="reviews-list__heading">
          <h2>All reviews</h2>
          <span>{reviews.length} total</span>
        </div>

        {loading ? (
          <p className="reviews-empty">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">
            No reviews yet. Add your first review above.
          </p>
        ) : (
          <div className="reviews-table-wrap">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Review</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.role || "—"}</small>
                    </td>
                    <td className="reviews-table__text">{item.review}</td>
                    <td>
                      <span className="reviews-table__stars">
                        {"★".repeat(item.rating)}
                      </span>{" "}
                      <small>{item.rating}/5</small>
                    </td>
                    <td>
                      <span
                        className={`reviews-status ${item.isActive ? "is-published" : "is-draft"}`}
                      >
                        {item.isActive ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div className="reviews-table__actions">
                        <button
                          type="button"
                          className="reviews-link-btn"
                          onClick={() => editReview(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="reviews-link-btn"
                          onClick={() => togglePublished(item)}
                        >
                          {item.isActive ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          className="reviews-link-btn reviews-link-btn--danger"
                          onClick={() => removeReview(item)}
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
