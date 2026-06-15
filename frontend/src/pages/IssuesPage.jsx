import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getIssues } from "../api/issuesApi";
import "./IssuesPage.css";
import logo from "../assets/BUGBOARD26.png";
import createdIssuesIcon from "../assets/created-issues.png";
import UserPage from "./UserPage";
import NewUserPage from "./NewUserPage";
import ChangePasswordPage from "./ChangePasswordPage";

const initialFilters = {
  type: "",
  status: "OPEN",
  priority: "",
  assignment: "",
  sort: "updatedAt,desc",
  keyword: "",
};

export default function IssuesPage() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const ISSUES_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser?.role === "ADMIN";

  const [showNewUserModal, setShowNewUserModal] = useState(false);

  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
  const [statusPopupMessage, setStatusPopupMessage] = useState("");

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDueDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (date) => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    return due < today;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.type, filters.status, filters.priority, filters.assignment, filters.sort, filters.keyword,]);

  useEffect(() => {
    loadIssues();
  }, [filters.type, filters.status, filters.priority, filters.sort]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError("");

      const baseParams = {
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        sort:
          filters.sort === "priority-highest" ||
          filters.sort === "priority-lowest" ||
          filters.sort === "deadline-nearest" ||
          filters.sort === "deadline-latest"
            ? undefined
            : filters.sort || undefined,
      };

      let statusesToLoad = [];

      if (filters.status === "OPEN") {
        statusesToLoad = ["TODO", "IN_PROGRESS"];
      } else if (filters.status === "") {
        statusesToLoad = ["TODO", "IN_PROGRESS", "RESOLVED", "CLOSED"];
      } else {
        statusesToLoad = [filters.status];
      }

      const responses = await Promise.all(
        statusesToLoad.map((status) =>
          getIssues({
            ...baseParams,
            status,
          })
        )
      );

      const mergedIssues = responses.flatMap((data) =>
        Array.isArray(data) ? data : data.content || []
      );

      const uniqueIssues = mergedIssues.filter(
        (issue, index, array) =>
          array.findIndex((item) => item.id === issue.id) === index
      );

      setIssues(uniqueIssues);
    } catch (err) {
      console.error(err);
      setError("Errore durante il caricamento delle issue.");
    } finally {
      setLoading(false);
    }
  };

  const getAssignedEmail = (issue) => {
    return issue.assignedToEmail || issue.assignedTo?.email || "";
  };

  const filteredIssues = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    let result = issues.filter((issue) => {
      const assignedEmail = getAssignedEmail(issue);

      const matchesKeyword =
        !keyword ||
        issue.title?.toLowerCase().includes(keyword) ||
        issue.description?.toLowerCase().includes(keyword) ||
        assignedEmail.toLowerCase().includes(keyword);

      const currentUserEmail = storedUser?.email?.toLowerCase() || "";

      const matchesAssignment =
        filters.assignment === "" ||
        (filters.assignment === "assigned" && assignedEmail) ||
        (filters.assignment === "unassigned" && !assignedEmail) ||
        (filters.assignment === "assignedToMe" &&
          assignedEmail.toLowerCase() === currentUserEmail);

      return matchesKeyword && matchesAssignment;
    });

    const priorityOrder = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };

    if (filters.sort === "priority-lowest") {
      result = [...result].sort((a, b) => {
        return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      });
    }

    if (filters.sort === "priority-highest") {
      result = [...result].sort((a, b) => {
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
    }

    if (filters.sort === "deadline-nearest") {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }

    if (filters.sort === "deadline-latest") {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(b.dueDate) - new Date(a.dueDate);
      });
    }

    return result;
  }, [issues, filters.keyword, filters.assignment, filters.sort]);

  const totalPages = Math.ceil(filteredIssues.length / ISSUES_PER_PAGE);

  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * ISSUES_PER_PAGE;
    const endIndex = startIndex + ISSUES_PER_PAGE;

    return filteredIssues.slice(startIndex, endIndex);
  }, [filteredIssues, currentPage]);

  const stats = useMemo(() => {
    return {
      total: filteredIssues.length,
      open: filteredIssues.filter(
        (issue) => issue.status === "TODO" || issue.status === "IN_PROGRESS"
      ).length,
      critical: filteredIssues.filter((issue) => issue.priority === "CRITICAL").length,
      unassigned: filteredIssues.filter((issue) => !getAssignedEmail(issue)).length,
    };
  }, [filteredIssues]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const normalizeLabel = (value) => {
    if (!value) return "-";

    const labels = {
      TODO: "Todo",
      IN_PROGRESS: "WIP",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      DOCUMENTATION: "Docs",
      BUG: "Bug",
      FEATURE: "Feature",
      QUESTION: "Question",
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical",
    };

    return labels[value] || value;
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="brand-area">
          <div className="brand-logo"><img src={logo} alt="BugBoard26 logo" className="brand-logo-img"/></div>
          <h1>BugBoard26</h1>
        </div>

        <div className="topbar-actions">
          <button className="primary-action" onClick={() => navigate("/issues/new")}>
              <span className="new-user-topbar-plus">＋</span>
              New issue
          </button>

          {isAdmin && (
            <button type="button" className="secondary-action new-user-topbar-button" onClick={() => setShowNewUserModal(true)} >
              <span className="new-user-topbar-plus">＋</span>
              New user
            </button>
          )}

          <button
            type="button"
            className="topbar-user-button"
            title="User profile"
            onClick={() => setShowUserPopup(true)}
          >
            👤
          </button>

          <button
            className="icon-button"
            title="Logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login", { replace: true });
            }}
          >
            ↪
          </button>
        </div>
      </header>

     <section className="dashboard-heading">
        <img className="heading-icon-img" src={createdIssuesIcon} alt="" aria-hidden="true"/>

        <div className="heading-text">
          <h2>Created issues</h2>
          <p>{filteredIssues.length} issue trovate</p>
        </div>
      </section>

      <section className="issues-shell">
        <div className="filters-row">
          <div className="filters-title">
            <span className="filters-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <circle cx="9" cy="6" r="2" fill="white" />
                
                <line x1="4" y1="12" x2="20" y2="12" />
                <circle cx="15" cy="12" r="2" fill="white" />
                
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="7" cy="18" r="2" fill="white" />
              </svg>
            </span>
            FILTRI
          </div>

          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="">Type: all</option>
            <option value="BUG">Bug</option>
            <option value="DOCUMENTATION">Docs</option>
            <option value="FEATURE">Feature</option>
            <option value="QUESTION">Question</option>
          </select>

          <select name="priority" value={filters.priority} onChange={handleFilterChange}>
            <option value="">Priority: all</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="OPEN">Status: open</option>
            <option value="">Status: all</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">Work in progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select name="assignment" value={filters.assignment} onChange={handleFilterChange}>
            <option value="">Assignment: all</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="assignedToMe">Assigned to me</option>
          </select>

          <select name="sort" value={filters.sort} onChange={handleFilterChange}>
            <option value="updatedAt,desc">Ordered: last update</option>
            <option value="updatedAt,asc">Ordered: oldest update</option>
            <option value="deadline-nearest">Deadline: nearest</option>
            <option value="deadline-latest">Deadline: latest</option>
            <option value="priority-highest">Priority: highest</option>
            <option value="priority-lowest">Priority: lowest</option>
          </select>

          <div className="search-box">
            <input
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Search issue..."
            />
            <span>⌕</span>
          </div>

          <button type="button" className="reset-filters-button" onClick={handleResetFilters}>
            Reset
          </button>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {loading ? (
          <div className="empty-state">Caricamento issue...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="empty-state">Nessuna issue trovata.</div>
        ) : (
          <div className="issues-list">
            {paginatedIssues.map((issue) => (
              <article className="issue-card" key={issue.id}>
                <div className="issue-main">
                  <h3>{issue.title}</h3>
                  <p>{issue.description}</p>

                  <div className="badges-row">
                    <span className="badge badge-type">
                      {normalizeLabel(issue.type)}
                    </span>

                    <span className={`badge badge-priority ${issue.priority?.toLowerCase()}`}>
                      {normalizeLabel(issue.priority)}
                    </span>

                    <span className={`badge badge-status ${issue.status?.toLowerCase()}`}>
                      {normalizeLabel(issue.status)}
                    </span>
                  </div>
                </div>

                <div className="issue-meta">
                  <div>
                    <span className="meta-icon">♙</span>
                    {getAssignedEmail(issue) || "Non assegnata"}
                  </div>

                  <div className={isExpired(issue.dueDate) ? "expired-date" : ""}>
                    <span className="meta-icon">▣</span>
                    <strong>Deadline:</strong> {formatDueDate(issue.dueDate)}
                  </div>

                  <div>
                    <span className="meta-icon">◷</span>
                    Ultima modifica: {formatDate(issue.updatedAt || issue.createdAt)}
                  </div>
                </div>

                <button
                  className="open-button"
                  onClick={() => navigate(`/issues/${issue.id}`)}
                >
                  View details
                  <span>›</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {!loading && filteredIssues.length > 0 && totalPages > 1 && (
        <div className="pagination-row">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? "active-page" : ""}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            ›
          </button>

          <p>
            Showing{" "}
            {Math.min((currentPage - 1) * ISSUES_PER_PAGE + 1, filteredIssues.length)}
            -
            {Math.min(currentPage * ISSUES_PER_PAGE, filteredIssues.length)} of{" "}
            {filteredIssues.length} issues
          </p>
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card summary-title">
          <span>▦</span>
          <p>Riepilogo issue</p>
        </div>

        <div className="summary-card">
          <span>Total</span>
          <strong className="blue">{stats.total}</strong>
        </div>

        <div className="summary-card">
          <span>Open</span>
          <strong className="green">{stats.open}</strong>
        </div>

        <div className="summary-card">
          <span>Critical</span>
          <strong className="red">{stats.critical}</strong>
        </div>

        <div className="summary-card">
          <span>Unassigned</span>
          <strong className="orange">{stats.unassigned}</strong>
        </div>

      </section>

      {showUserPopup && (
        <UserPage
          onClose={() => setShowUserPopup(false)}
          onChangePassword={() => {
            setShowUserPopup(false);
            setShowChangePasswordPopup(true);
          }}
        />
      )}

      {showChangePasswordPopup && (
        <ChangePasswordPage
          isPopup={true}
          onClose={() => setShowChangePasswordPopup(false)}
           onSuccess={() => {
            setShowChangePasswordPopup(false);
            setStatusPopupMessage("Password changed successfully.");
          }}
        />
      )}
      
      {showNewUserModal && (
        <NewUserPage
          onClose={() => setShowNewUserModal(false)}
          onSuccess={() => {
            setShowNewUserModal(false);
            setStatusPopupMessage("User created successfully.");
          }}
        />
      )}

      {statusPopupMessage && (
        <div className="status-modal-overlay" onClick={() => setStatusPopupMessage("")}>
          <section
            className="status-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="status-modal-close" onClick={() => setStatusPopupMessage("")}
            aria-label="Close" >
              ×
            </button>

            <div className="status-modal-icon">✓</div>

            <h2>Done</h2>
            <p>{statusPopupMessage}</p>

            <button
              type="button"
              className="status-modal-button"
              onClick={() => setStatusPopupMessage("")}
            >
              OK
            </button>
          </section>
        </div>
      )}

    </main>
  );
}
