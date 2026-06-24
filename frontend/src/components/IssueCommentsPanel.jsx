import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createComment, deleteComment, getComments, updateComment} from "../api/commentsApi.js";
import "../styles/IssueDetailPage.css"

export default function IssueCommentsPanel({ issueId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (issueId) {
      loadComments();
    }
  }, [issueId]);

  async function loadComments() {
    try {
      setError("");
      const data = await getComments(issueId);
      setComments(data);
    } catch (err) {
      console.error("Errore caricamento commenti:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data ||
          "Impossibile caricare i commenti."
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Scrivi un commento prima di inviarlo.");
      return;
    }

    try {
      const newComment = await createComment(issueId, text);
      setComments((prev) => [...prev, newComment]);
      setText("");
      setShowForm(false);
    } catch (err) {
      console.error("Errore pubblicazione commento:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data ||
          "Impossibile pubblicare il commento."
      );
    }
  }

  function startEditing(comment) {
    setEditingId(comment.id);
    setEditingText(comment.text);
  }

  async function saveEditing(commentId) {
    setError("");

    if (!editingText.trim()) {
      setError("Il commento non può essere vuoto.");
      return;
    }

    try {
      const updated = await updateComment(commentId, editingText);

      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? updated : comment))
      );

      setEditingId(null);
      setEditingText("");
    } catch (err) {
      console.error("Errore modifica commento:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data ||
          "Impossibile modificare il commento."
      );
    }
  }

  async function handleDelete(commentId) {
    const confirmed = window.confirm("Vuoi davvero eliminare questo commento?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteComment(commentId);

      setComments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      );
    } catch (err) {
      console.error("Errore eliminazione commento:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data ||
          "Impossibile eliminare il commento."
      );
    }
  }

  function canEdit(comment) {
    return currentUser?.email === comment.authorEmail;
  }

  function canDelete(comment) {
    const isOwner = currentUser?.email === comment.authorEmail;

    const isAdmin =
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "ROLE_ADMIN";

    return isOwner || isAdmin;
  }

  function formatDate(date) {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getInitial(email) {
    return email ? email.charAt(0).toUpperCase() : "U";
  }

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <div className="comments-title">
          <span className="comments-icon">
            <MessageCircle size={18} strokeWidth={2.4} />
          </span>

          <h2>Comments ({comments.length})</h2>
        </div>

        <button
          type="button"
          className="add-comment-button"
          onClick={() => setShowForm((currentValue) => !currentValue)}
        >
          + Add comment
        </button>
      </div>

      {error && <p className="comments-error">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write an update or a question..."
            rows="3"
          />

          <div className="comment-form-actions">
            <button
              type="button"
              className="comment-cancel-button"
              onClick={() => {
                setShowForm(false);
                setText("");
                setError("");
              }}
            >
              Cancel
            </button>

            <button type="submit" className="comment-submit-button">
              Comment
            </button>
          </div>
        </form>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="empty-comments">There are no comments yet.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="comment-row">
              <div className="comment-avatar">
                {getInitial(comment.authorEmail)}
              </div>

              <div className="comment-content">
                <div className="comment-main-info">
                  <strong>{comment.authorEmail}</strong>

                  {editingId === comment.id ? (
                    <>
                      <textarea
                        value={editingText}
                        onChange={(event) =>
                          setEditingText(event.target.value)
                        }
                        rows="3"
                        className="comment-edit-textarea"
                      />

                      <div className="comment-edit-actions">
                        <button
                          type="button"
                          className="comment-save-button"
                          onClick={() => saveEditing(comment.id)}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          className="comment-cancel-button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{comment.text}</p>

                      {comment.updatedAt && (
                        <span className="comment-edited">
                          Edited on {formatDate(comment.updatedAt)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="comment-side">
                <span className="comment-date">
                  {formatDate(comment.createdAt)}
                </span>

                {(canEdit(comment) || canDelete(comment)) && (
                  <div className="comment-menu">
                    <button type="button" className="comment-menu-button">
                      ⋮
                    </button>

                    <div className="comment-menu-dropdown">
                      {canEdit(comment) && (
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                        >
                          Edit
                        </button>
                      )}

                      {canDelete(comment) && (
                        <button
                          type="button"
                          className="danger-option"
                          onClick={() => handleDelete(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
