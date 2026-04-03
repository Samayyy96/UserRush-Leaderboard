import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [slowApi, setSlowApi]         = useState(false);
  const [error, setError]             = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("https://gameforge-leaderboard.onrender.com/leaderboard");
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      const data = await response.json();
      if (data?.leaderboard) setLeaderboard(data.leaderboard.slice(0, 10));
      setError(null);
      setSlowApi(false);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Warn user if API is taking too long (Render.com cold start)
    const slowTimer = setTimeout(() => setSlowApi(true), 6000);
    const interval  = setInterval(fetchLeaderboard, 5000);
    return () => { clearInterval(interval); clearTimeout(slowTimer); };
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy className="rank-icon gold"   size={22} />;
      case 1: return <Medal  className="rank-icon silver" size={22} />;
      case 2: return <Award  className="rank-icon bronze" size={22} />;
      default: return <span className="rank-number">#{index + 1}</span>;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-inner">

        {/* Header */}
        <div className="leaderboard-header">
          <div className="lb-badge">🏆 Live Rankings</div>
          <h1>UserRush <span>Leaderboard</span></h1>
          <p>Top games ranked by number of registered players</p>
        </div>

        {/* Card */}
        <div className="leaderboard-card">

          {loading ? (
            <div className="lb-loading">
              <div className="lb-spinner" />
              <p className="lb-loading-text">Loading rankings…</p>
              {slowApi && (
                <p className="lb-slow-hint">
                  ⏳ Server is waking up — this can take ~30 seconds on first load.
                </p>
              )}
            </div>
          ) : error ? (
            <div className="lb-error">
              <span>⚠️</span>
              <p>{error}</p>
              <button className="lb-retry" onClick={fetchLeaderboard}>Retry</button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="lb-empty">
              <p>No data yet. Check back soon!</p>
            </div>
          ) : (
            <ul className="leaderboard-list">
              <AnimatePresence>
                {leaderboard.map((player, index) => (
                  <motion.li
                    key={player.gameId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 25 },
                      opacity: { duration: 0.18 },
                      delay: index * 0.04,
                    }}
                    className={`player-row ${index < 3 ? "top-three" : ""} rank-${index + 1}`}
                  >
                    <div className="player-rank">{getRankIcon(index)}</div>

                    <div className="player-info">
                      <span className="player-id">{player.gameId}</span>
                    </div>

                    <div className="player-score">
                      <span className="score-value">{player.users}</span>
                      <span className="score-label">users</span>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <p className="lb-footer">Updates every 5 seconds · IIITL UserRush Event</p>
      </div>
    </div>
  );
};

export default Leaderboard;