import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import { collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Projects.css";

const ICONS = ["🎮", "🕹️", "🚀", "⚔️", "🧩", "🎯", "🌌", "💎", "🐲", "🔥", "🏆", "🎲"];
const getIcon = (str = "") => ICONS[str.charCodeAt(0) % ICONS.length];

/* ─── Project Card ─── */
const ProjectCard = memo(({ project, isOwner }) => {
  const link = project.gameLink || project.game_link || "";
  const formattedLink = link.startsWith("http") ? link : `https://${link}`;
  const title = project.projectTitle || project.roll_no || "Untitled Project";
  const author = project.displayName || "Unknown Creator";

  return (
    <div className={`project-card ${isOwner ? "owner-card" : ""}`}>
      <div className="card-top">
        <div className="card-icon">{getIcon(title)}</div>
        {isOwner && <div className="owner-badge">✦ Yours</div>}
      </div>

      <div className="card-body">
        <h3 className="project-title">
          <span className={`status-dot ${project.active === true || project.active === "true" ? "active" : "inactive"}`}></span>
          {title}
        </h3>
        <p className="project-author">by {author}</p>
      </div>

      <div className="card-footer">
        <a href={formattedLink} target="_blank" rel="noreferrer" className="view-btn">
          Launch Project
          <span className="view-btn-icon">↗</span>
        </a>
      </div>
    </div>
  );
});

/* ─── Main Page ─── */
const Projects = () => {
  const user = useSelector((state) => state.auth.user);

  const [projects, setProjects]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [gameLink, setGameLink]     = useState("");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Realtime subscription
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    setLoading(true);
    const q = query(collection(db, "projects"), orderBy("timestamp", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const userSubmission = useMemo(() =>
    !user || !projects.length ? null : projects.find((p) => p.uid === user.uid || p.id === user.uid),
    [projects, user]
  );

  // Pre-fill form when editing
  useEffect(() => {
    if (userSubmission) {
      setProjectTitle(userSubmission.projectTitle || "");
      setGameLink(userSubmission.gameLink || "");
    }
  }, [userSubmission]);

  // Filter by search query and status filter
  const filtered = useMemo(() => {
    let result = projects;
    
    if (statusFilter === "active") {
      result = result.filter(p => p.active === true || p.active === "true");
    } else if (statusFilter === "inactive") {
      result = result.filter(p => p.active !== true && p.active !== "true");
    }

    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((p) => {
      const title  = (p.projectTitle || p.roll_no || "").toLowerCase();
      const author = (p.displayName || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [projects, search, statusFilter]);

  const openForm = useCallback(() => {
    if (!user) return alert("You must be logged in to submit a project.");
    if (!userSubmission) { setProjectTitle(""); setGameLink(""); }
    setShowForm(true);
  }, [user, userSubmission]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!projectTitle.trim() || !gameLink.trim() || !user?.uid) return;

    try {
      setSubmitting(true);
      const dataToSave = {
        uid:          user.uid,
        displayName:  user.displayName,
        email:        user.email,
        projectTitle: projectTitle.trim(),
        gameLink:     gameLink.trim(),
        timestamp:    serverTimestamp(),
      };
      
      // Only set the default 'active' field if it's a completely new project
      if (!userSubmission) {
        dataToSave.active = false;
      }

      await setDoc(doc(db, "projects", user.uid), dataToSave, { merge: true });

      setShowForm(false);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to save. Make sure you are logged in.");
    } finally {
      setSubmitting(false);
    }
  }, [projectTitle, gameLink, user, userSubmission]);

  return (
    <div className="projects-page">

      {/* ── Hero ── */}
      <section className="projects-hero">
        <div className="hero-badge">🎮 IIITL Creators</div>
        <h1>Student <span className="gradient-text">Game Gallery</span></h1>
        <p>Browse and play games built by IIITL students. Submit your own to join the gallery.</p>
      </section>

      {/* ── Main content ── */}
      <main className="projects-main">

        {/* Toolbar: search + count + add button */}
        <div className="projects-toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search projects or creators…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="active">🟢 Active</option>
              <option value="inactive">🔴 Inactive</option>
            </select>
            <p className="projects-count">
              {loading ? "Loading…" : (
                <><strong>{filtered.length}</strong> of {projects.length} project{projects.length !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          <button className="add-btn" onClick={openForm}>
            {userSubmission ? "✏️ Edit My Game" : "+ Add My Game"}
          </button>
        </div>

        {/* Cards */}
        <div className="projects-grid">
          {loading ? (
            <div className="loader-container">
              <div className="spinner" />
              <p>Fetching projects…</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isOwner={user && (project.uid === user.uid || project.id === user.uid)}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">{search ? "🔎" : "🎮"}</div>
              <p>{search ? `No results for "${search}"` : "No projects yet. Be the first to submit!"}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Submission Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-top">
                <h2>{userSubmission ? "Edit Your Project" : "Submit a Project"}</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <p>
                {userSubmission
                  ? "Update your existing submission below."
                  : "One submission per account. Make it count!"}
              </p>
            </div>

            <form className="project-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="proj-title">Project Title</label>
                <input
                  id="proj-title"
                  type="text"
                  placeholder="e.g. Space Explorer 3D"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="proj-link">Game URL</label>
                <input
                  id="proj-link"
                  type="text"
                  placeholder="https://your-game.vercel.app"
                  value={gameLink}
                  onChange={(e) => setGameLink(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-small" /> Saving…</>
                    : userSubmission ? "Save Changes" : "Publish to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;