import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Projects.css";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rollNo, setRollNo] = useState("");
  const [gameLink, setGameLink] = useState("");

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        "https://gameforge-leaderboard.onrender.com/projects"
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch(
        "https://gameforge-leaderboard.onrender.com/submit-project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rollNo,
            gameLink
          })
        }
      );

      setRollNo("");
      setGameLink("");
      setShowForm(false);

      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Link to="/" className="projects-btn">
        Back
      </Link>

      <div className="projects-container">
        <div className="projects-header">
          <h1>
            UserRush <span>Gallery</span>
          </h1>
          <p>Add your game link</p>
        </div>

        {!showForm ? (
          <>
            <div className="btn-wrap">
              <button
                className="add-btn"
                onClick={() => setShowForm(true)}
              >
                Add Game
              </button>
            </div>

            <div className="projects-list">
              {projects.length > 0 ? (
                projects.map((project, index) => (
                  <div key={index} className="project-row">
                    <span className="project-roll">
                      {project.roll_no}
                    </span>

                    <a
                      href={
                        project.game_link.startsWith("http")
                          ? project.game_link
                          : `https://${project.game_link}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="view-btn"
                    >
                      View
                    </a>
                  </div>
                ))
              ) : (
                <p className="empty-text">No projects yet</p>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>

            <form className="project-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Roll Number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Game Link"
                value={gameLink}
                onChange={(e) => setGameLink(e.target.value)}
                required
              />

              <button type="submit" className="submit-btn">
                Submit
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default Projects;