import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Activity, User } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = ({ currentPlayerId = 'GDG-Player-15' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      // The API returns { leaderboard: [{ gameId: '...', users: 10 }, ...] }
      if (data && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      // Fallback data for preview/testing if backend is down
      if (leaderboard.length === 0) {
        setLeaderboard(Array.from({ length: 25 }, (_, i) => ({
          gameId: `GDG-Player-${i + 1}`,
          users: 1500 - (i * 35)
        })));
      }
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
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

  const top10 = leaderboard.slice(0, 10);
  const currentPlayerIndex = leaderboard.findIndex(p => p.gameId === currentPlayerId);
  const currentPlayer = currentPlayerIndex !== -1 ? leaderboard[currentPlayerIndex] : null;
  const isCurrentPlayerTop10 = currentPlayerIndex !== -1 && currentPlayerIndex < 10;
  const showPinnedPlayer = currentPlayer && !isCurrentPlayerTop10;

  const renderPlayerRow = (player, index, isPinned = false) => {
    const isCurrent = player.gameId === currentPlayerId;
    // For pinned player, index is their actual global rank - 1
    const actualRankIndex = isPinned ? currentPlayerIndex : index;
    
    return (
      <motion.li
        key={isPinned ? `pinned-${player.gameId}` : player.gameId}
        layout={!isPinned} // Only animate layout for main list
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{
          layout: { type: 'spring', stiffness: 300, damping: 25 },
          opacity: { duration: 0.2 }
        }}
        className={`player-row ${actualRankIndex < 3 ? 'top-three' : ''} ${isCurrent ? 'current-player' : ''} ${isPinned ? 'pinned-row' : ''}`}
      >
        <div className="player-rank">
          {getRankIcon(actualRankIndex)}
        </div>
        <div className="player-info">
          <span className="player-id">
            {player.gameId}
            {isCurrent && <span className="you-badge">YOU</span>}
          </span>
        </div>
        <div className="player-score">
          <span className="score-value">
            {player.users.toLocaleString()}
          </span>
          <span className="score-label">pts</span>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Global <span>Rankings</span></h1>
        <p>Real-time player statistics</p>
      </div>

      <ul className="leaderboard-list">
        <AnimatePresence>
          {top10.map((player, index) => renderPlayerRow(player, index))}
        </AnimatePresence>
      </ul>

      {showPinnedPlayer && (
        <div className="pinned-container">
          <div className="ellipsis">•••</div>
          <ul className="leaderboard-list">
            {renderPlayerRow(currentPlayer, currentPlayerIndex, true)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
