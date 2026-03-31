import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Activity } from "lucide-react";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        "https://gameforge-leaderboard.onrender.com/leaderboard"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();

      if (data?.leaderboard) {
        setLeaderboard(data.leaderboard.slice(0, 10));
      }

      setError(null);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="rank-icon gold" size={24} />;
      case 1:
        return <Medal className="rank-icon silver" size={24} />;
      case 2:
        return <Award className="rank-icon bronze" size={24} />;
      default:
        return <span className="rank-number">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Activity className="spinner" size={40} />
        <p>Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>
          Global <span>Rankings</span>
        </h1>
        <p>Top 10 by registered emails</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <ul className="leaderboard-list">
        <AnimatePresence>
          {leaderboard.map((player, index) => (
            <motion.li
              key={player.gameId}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 25 },
                opacity: { duration: 0.2 },
              }}
              className={`player-row ${index < 3 ? "top-three" : ""}`}
            >
              <div className="player-rank">{getRankIcon(index)}</div>

              <div className="player-info">
                <span className="player-id">{player.gameId}</span>

                <div className="email-list">
                  {player.emails?.map((email) => (
                    <span key={email} className="email-pill">
                      {email}
                    </span>
                  ))}
                </div>
              </div>

              <div className="player-score">
                <span className="score-value">{player.users}</span>
                <span className="score-label">emails</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default Leaderboard;