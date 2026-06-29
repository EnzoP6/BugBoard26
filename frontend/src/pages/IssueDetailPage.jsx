import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {getIssueById, updateIssueStatus, assignIssue, updateIssue,} from "../api/issuesApi";
import { getCurrentUser, isAdmin } from "../utils/auth";
import { getUsers } from "../api/usersApi";
import { getIssueImageUrl } from "../utils/imageUrl";
import IssueCommentsPanel from "../components/IssueCommentsPanel";
import StatusPopup from "../components/StatusPopup";
import "../styles/IssueDetailPage.css"

import logo from "../assets/bugboard-logob.png";

function getErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.detail) {
    return data.detail;
  }

  return fallbackMessage;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("it-IT");
}

function isDeadlineExpired(date) {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(date);
  deadlineDate.setHours(0, 0, 0, 0);

  return deadlineDate < today;
}

function getInitial(email) {
  return email ? email.charAt(0).toUpperCase() : "U";
}

function getPriorityVariant(priority) {
  const normalizedPriority = priority?.toLowerCase();

  if (normalizedPriority === "low") {
    return "green";
  }

  if (normalizedPriority === "medium") {
    return "yellow";
  }

  if (normalizedPriority === "high") {
    return "orange";
  }

  if (normalizedPriority === "critical") {
    return "red";
  }

  return "gray";
}

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [status, setStatus] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [imageFullscreen, setImageFullscreen] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);

  const currentUser = getCurrentUser();
  const admin = isAdmin();

  const assignedEmail = issue?.assignedToEmail || issue?.assignedTo?.email || "";
  const canEditIssue = admin || assignedEmail === currentUser?.email;
  const canAssignIssue = admin;
  const issueImageUrl = getIssueImageUrl(issue?.imageUrl || issue?.imagePath || issue?.image);
  
  useEffect(() => {
    async function loadData() {
      try {
        const issueData = await getIssueById(id);

        setIssue(issueData);
        setStatus(issueData.status || "");
        setDeadline(issueData.dueDate || issueData.deadline || "");
        setAssignedToEmail(issueData.assignedToEmail || issueData.assignedTo?.email || "");
        setTitle(issueData.title || "");
        setDescription(issueData.description || "");
        setPriority(issueData.priority || "");

        if (admin) {
          const usersData = await getUsers();
          setUsers(usersData);
        }
      } catch (error) {
        console.error(error);
        setPageMessage("Error loading issue.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, admin]);

  async function handleAdminUpdate() {
    if (!canEditIssue) {
      setPageMessage("You do not have permission to modify this issue.");
      return;
    }

    try {
      setSaving(true);
      setPageMessage("");

      await updateIssue(id, {
        title,
        description,
        priority: priority || null,
        dueDate: deadline || null,
      });

      await updateIssueStatus(id, status);

      if (canAssignIssue && assignedToEmail) {
        await assignIssue(id, assignedToEmail);
      }

      const refreshed = await getIssueById(id);

      setIssue(refreshed);
      setStatus(refreshed.status || "");
      setEditMode(false);
      setPopupMessage({
        type: "success",
        title: "Change saved",
        message: "The issue details have been updated successfully.",
      });
    } catch (error) {
      console.error(error);

      const statusCode = error?.response?.status;
      const backendMessage = getErrorMessage(error, "");

      if (statusCode === 400) {
        setPageMessage(backendMessage || "Check the fields: some data is missing or invalid.");
        return;
      }

      if (statusCode === 403) {
        setPageMessage(backendMessage || "You do not have permission to modify this issue.");
        return;
      }

      if (statusCode === 404) {
        setPageMessage(backendMessage || "Issue or assigned user not found.");
        return;
      }

      setPageMessage(backendMessage || "Error while editing issue.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="issue-detail-page">
        <p className="issue-detail-loading">Loading issue...</p>
      </main>
    );
  }

  if (!issue) {
    return (
      <main className="issue-detail-page">
        <p className="issue-detail-loading">Issue not found.</p>
      </main>
    );
  }

  const creatorEmail =
    issue.createdByEmail ||
    issue.createdByName ||
    issue.createdBy?.email ||
    "-";

  const assignedTo =
    issue.assignedToEmail ||
    issue.assignedToName ||
    issue.assignedTo?.email ||
    "Not assigned";

  return (
    <main className="issue-detail-page">
      <img src={logo} alt="BugBoard26 background logo" className="issue-detail-background-logo" />
      <div className="issue-detail-wrapper">
        <div className="issue-detail-topbar">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/issues")}
          >
            ← Back to issues
          </button>

          <div className="issue-detail-actions">
            {canEditIssue && (
              <button
                type="button"
                className="edit-issue-button"
                onClick={() => setEditMode((currentValue) => !currentValue)}
              >
                ✎ Edit issue
              </button>
            )}

            

          </div>
        </div>

        <section className="issue-detail-card">
          <div className="issue-main-column">
            <div className="issue-title-row">
              <div className="issue-alert-icon">!</div>

              <div>
                <h1>{issue.title} <span className="issue-title-id">#{issue.id}</span></h1>

                
              </div>
            </div>

            <p className="issue-description">{issue.description}</p>

            <div className="issue-info-grid">
              <Info label="Type" value={issue.type || "-"} variant="blue" />
              <Info label="Assigned to" value={assignedTo} />
              <Info label="Priority" value={issue.priority || "Not set"} variant={getPriorityVariant(issue.priority)} />
              <Info label="Created" value={formatDate(issue.createdAt || issue.creationDate)}/>
              <Info label="Status" value={issue.status || "-"} variant="gray" />
              <Info label="Last change" value={formatDate(issue.updatedAt || issue.lastChange)} />
              <Info label="Author" value={creatorEmail} />
              <Info label="Deadline" value={formatDate(issue.dueDate || issue.deadline)} danger={isDeadlineExpired(issue.dueDate || issue.deadline)}/>
            </div>
          </div>

          <aside className="issue-attachment-column">
            <h2>📎 Attachment</h2>

            {issueImageUrl ? (
               
              <>
                <button
                  type="button"
                  className="issue-detail-image-wrapper">
                  onClick={() => setImageFullscreen(true)}
                  aria-label="Open attachment fullscreen"
                >
                  <img
                    src={issueImageUrl}
                    alt={`IIssue attachment`}
                    className="issue-detail-image"
                  />
                </button>

                <p className="attachment-hint">Click image to view fullscreen</p>
              </>
            ) : (
              <div className="issue-empty-attachment">
                No attachment uploaded
              </div>
            )}
          </aside>
        </section>

        {editMode && canEditIssue && (
          <section className="issue-edit-card">
            <h2>Edit issue</h2>

            <div className="issue-edit-grid">
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="">Not set</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">WORK IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </label>

              <label className="wide-field">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows="4"
                />
              </label>

              {canAssignIssue && (
                <label>
                  Deadline
                  <input
                    type="date"
                    value={deadline || ""}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                </label>
              )}

              {canAssignIssue && (
                <label>
                  Assigned to
                  <select
                    value={assignedToEmail}
                    onChange={(event) => setAssignedToEmail(event.target.value)}
                  >
                    <option value="">Not assigned</option>

                    {users.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.email}{" "}
                        {user.email === currentUser?.email
                          ? "(You)"
                          : user.role === "ADMIN"
                          ? "(Admin)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="issue-edit-actions">
              <button
                type="button"
                className="cancel-edit-button"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-edit-button"
                onClick={handleAdminUpdate}
                disabled={saving}
              >
                <span className="save-button-content">
                  <Save size={15} strokeWidth={2.4} />
                  Save changes
                </span>
              </button>
            </div>
          </section>
        )}

        {pageMessage && <p className="issue-detail-message">{pageMessage}</p>}

        {popupMessage && (
          <StatusPopup
            type={popupMessage.type}
            title={popupMessage.title}
            message={popupMessage.message}
            onClose={() => setPopupMessage(null)}
            homeLabel="Go home"
            onHome={() => {
              setPopupMessage(null);
              navigate("/issues");
            }}
          />
        )}

        <section className="issue-comments-card">
          <IssueCommentsPanel issueId={id} currentUser={currentUser} />
        </section>
      </div>

      {imageFullscreen && issueImageUrl && (
        <div
          className="image-fullscreen-overlay"
          onClick={() => setImageFullscreen(false)}
        >
          <button
            type="button"
            className="image-fullscreen-close"
            onClick={() => setImageFullscreen(false)}
            aria-label="Close fullscreen image"
          >
            ×
          </button>
      
          <img
            src={issueImageUrl}
            alt="Issue attachment fullscreen"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

function Info({ label, value, variant, danger }) {
  return (
    <div className="issue-info-item">
      <span className="issue-info-label">{label}</span>

      {variant ? (
        <span className={`issue-chip issue-chip-${variant}`}>{value}</span>
      ) : (
        <strong className={danger ? "expired-deadline" : ""}>{value}</strong>
      )}
    </div>
  );
}
