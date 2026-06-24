import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIssue } from "../api/issuesApi";
import { getUsers } from "../api/usersApi";
import { uploadAttachment } from "../api/attachmentsApi";
import "../styles/NewIssuePage.css";
import bugLogo from "../assets/newissue-logo.png";
import logob from "../assets/bugboard-logob.png";
import StatusPopup from "../components/StatusPopup";

const issueTypes = [
  {
    value: "BUG",
    label: "Bug",
    description: "Something isn't working",
    icon: "🐞",
  },
  {
    value: "QUESTION",
    label: "Question",
    description: "Need help or info",
    icon: "❔",
  },
  {
    value: "DOCUMENTATION",
    label: "Documentation",
    description: "Improvements to docs",
    icon: "📄",
  },
  {
    value: "FEATURE",
    label: "Feature",
    description: "New feature request",
    icon: "⭐",
  },
];

const priorities = [
  { value: "LOW", label: "Low", color: "green" },
  { value: "MEDIUM", label: "Medium", color: "yellow" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "CRITICAL", label: "Critical", color: "red" },
];

export default function NewIssuePage() {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser?.role === "ADMIN";

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    priority: "",
    image: null,
    assignedToEmail: "",
    dueDate: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignedEmailError, setAssignedEmailError] = useState("");
  const [users, setUsers] = useState([]);
  const [statusPopupMessage, setStatusPopupMessage] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      if (!isAdmin) {
        return;
      }

      try {
        const usersData = await getUsers();
        setUsers(Array.isArray(usersData) ? usersData : usersData.content || []);
      } catch (error) {
        console.error(error);
        setPopupMessage({
          type: "error",
          title: "Users not loaded",
          message: "Unable to load users. Please try again.",
        });  
      }
    }

    loadUsers();
  }, [isAdmin]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "assignedToEmail") {
      setAssignedEmailError("");
    }

    setPopupMessage(null);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCardSelect = (name, value) => {
    setPopupMessage(null);

    setFormData((prev) => ({
      ...prev,
      [name]: prev[name] === value ? "" : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      setFormData((prev) => ({
        ...prev,
        image: null,
      }));
      setSelectedAttachment(null);
      setImagePreview(null);
      setImageName("")
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPopupMessage({
        type: "error",
        title: "Invalid attachment",
        message: "You can only upload image files.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPopupMessage({
        type: "error",
        title: "File too large",
        message: "The image cannot be larger than 5 MB.",
      });
      event.target.value = "";
      return;
    }

    setPopupMessage(null);

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    setImageName(file.name);
    setImagePreview(URL.createObjectURL(file));
    setSelectedAttachment(file);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Il titolo è obbligatorio.";
    }

    if (!formData.description.trim()) {
      return "La descrizione è obbligatoria.";
    }

    if (!formData.type) {
      return "Il tipo di issue è obbligatorio.";
    }

    if (isAdmin && formData.assignedToEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.assignedToEmail)) {
        return "Inserisci un indirizzo email valido per assegnare la issue.";
      }
    }

    if (isAdmin && formData.dueDate) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const selectedDate = new Date(formData.dueDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < currentDate) {
        return "La deadline non può essere precedente alla data di oggi.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setPopupMessage(null);
    setAssignedEmailError("");

    const validationError = validateForm();

    if (validationError) {
      setPopupMessage({
        type: "error",
        title: "Check the fields",
        message: validationError,
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority || "LOW",
        assignedToEmail: isAdmin ? formData.assignedToEmail || null : null,
        dueDate: isAdmin ? formData.dueDate || null : null,
      };

      const createdIssue = await createIssue(payload);
      if (selectedAttachment) {
        await uploadAttachment(createdIssue.id, selectedAttachment);
      }

      setPopupMessage({
        type: "success",
        title: "Issue created",
        message: "Your issue has been added successfully.",
        redirectTo: `/issues/${createdIssue.id}`,
      });
    } catch (error) {
      console.error(error);

      const data = error.response?.data;

      let backendMessage = "Errore durante la creazione della issue.";

      if (typeof data === "string") {
        backendMessage = data;
      } else if (data?.message) {
        backendMessage = data.message;
      } else if (data?.error) {
        backendMessage = data.error;
      } else if (data?.detail) {
        backendMessage = data.detail;
      }

      if (error.response?.status === 400 && formData.assignedToEmail) {
        backendMessage =
          backendMessage === "Errore durante la creazione della issue."
            ? "No user found with this email. Please check the address and try again."
            : backendMessage;

        setAssignedEmailError(backendMessage);
      }

      setPopupMessage({
        type: "error",
        title: "Issue not created",
        message: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      priority: "",
      image: null,
      assignedToEmail: "",
      dueDate: "",
    });

    setImagePreview(null);
    setImageName("");
    setSelectedAttachment(null);
    setPopupMessage(null);
    setAssignedEmailError("");
  };

  return (
    <main className="page new-issue-page">
      <img src={logob} alt="" className="new-issue-background-logo" aria-hidden="true"/>
      <form className="new-issue-card" onSubmit={handleSubmit}>
        <header className="new-issue-header">
          <div className="new-issue-title-area">
            <div className="new-issue-logo">
              <img src={bugLogo} alt="BugBoard26 logo" />
            </div>

            <div>
              <h2>Create new issue</h2>
              <p>Fill in the details below to report a new issue.</p>
            </div>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={() => navigate("/issues")}
            aria-label="Chiudi"
          >
            ×
          </button>
        </header>

        <section className="issue-panel">
          <p className="section-kicker">Required fields</p>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="title">Title *</label>
              <span>{formData.title.length} / 120</span>
            </div>

            <div className="input-with-icon">
              <span>Tt</span>
              <input
                id="title"
                name="title"
                type="text"
                maxLength="120"
                placeholder="Enter a clear and concise title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="description">Description *</label>
              <span>{formData.description.length} / 1000</span>
            </div>

            <div className="textarea-with-icon">
              <span>☰</span>
              <textarea
                id="description"
                name="description"
                rows="5"
                maxLength="1000"
                placeholder="Provide as much detail as possible..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type *</label>

            <div className="type-grid">
              {issueTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`choice-card ${
                    formData.type === type.value ? "selected" : ""
                  }`}
                  onClick={() => handleCardSelect("type", type.value)}
                >
                  <span className="choice-radio"></span>
                  <span className="choice-icon">{type.icon}</span>

                  <span>
                    <strong>{type.label}</strong>
                    <small>{type.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="issue-panel">
          <p className="section-kicker">Optional fields</p>

          <div className="optional-grid">
            <div className="form-group">
              <label>Priority</label>

              <div className="priority-grid">
                {priorities.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    className={`priority-pill ${
                      formData.priority === priority.value ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleCardSelect("priority", priority.value)
                    }
                  >
                    <span className={`priority-dot ${priority.color}`}></span>
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group attachment-group">
              <label htmlFor="image">Attachment</label>

              <label className="upload-box" htmlFor="image">
                <span className="upload-icon">☁</span>
                <strong>{imageName || "Drag and drop a file here "}</strong>
                <small><br />or click to browse</small>
                <small> <br />Max size 5 MB, jpg, png</small>
              </label>

              <input
                id="image"
                name="image"
                className="hidden-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Anteprima allegato" />
                </div>
              )}
            </div>

            {isAdmin && (
              <>
                <div className="form-group">
                  <label htmlFor="assignedToEmail">Assignee</label>

                  <select
                    id="assignedToEmail"
                    name="assignedToEmail"
                    value={formData.assignedToEmail}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select a user optional</option>

                    {users.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.email}{" "}
                        {user.email === storedUser?.email
                          ? "(You)"
                          : user.role === "ADMIN"
                          ? "(Admin)"
                          : ""}
                      </option>
                    ))}
                  </select>

                  {assignedEmailError && (
                    <p className="field-error">{assignedEmailError}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due date</label>

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    min={today}
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {popupMessage && (
          <StatusPopup
            type={popupMessage.type}
            title={popupMessage.title}
            message={popupMessage.message}
            onClose={() => {
              const shouldGoHome = popupMessage.type === "success";

              setPopupMessage(null);

              if (shouldGoHome) {
                navigate("/issues");
              }
            }}
            actionLabel={popupMessage.redirectTo ? "View details" : undefined}
            onAction={
              popupMessage.redirectTo
                ? () => {
                    const redirectTo = popupMessage.redirectTo;
                    setPopupMessage(null);
                    navigate(redirectTo);
                  }
                : undefined
            }
          />
        )}

        <footer className="form-actions new-issue-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetForm}
            disabled={loading}
          >
            Clear field
          </button>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create issue"}
          </button>
        </footer>
      </form>
    </main>
  );
}
