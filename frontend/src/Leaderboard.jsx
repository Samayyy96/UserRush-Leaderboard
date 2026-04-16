import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Lock } from "lucide-react";
import "./Leaderboard.css";

// ── Hardcoded final rankings (snapshot taken at event end) ──────────────────
const FINAL_LEADERBOARD = [
  { gameId: "LIT2025024", users: 97 },
  { gameId: "LIT2025009", users: 78 },
  { gameId: "LCB2025024", users: 69 },
  { gameId: "LCI2025015", users: 68 },
  { gameId: "LCB2025040", users: 64 },
  { gameId: "LCI2025040", users: 62 },
  { gameId: "LCB2025010", users: 61 },
  { gameId: "LCI2025013", users: 61 },
  { gameId: "LCI2025002", users: 52 },
  { gameId: "LCI2025018", users: 51 },
  { gameId: "LCI2025023", users: 38 },
  { gameId: "LCS2025059", users: 34 },
  { gameId: "LCB2025006", users: 27 },
  { gameId: "LCI2025011", users: 25 },
];

const Leaderboard = () => {
  const leaderboard = FINAL_LEADERBOARD;

  // Safe access for top 3
  const first  = leaderboard[0];
  const second = leaderboard[1];
  const third  = leaderboard[2];
  const rest   = leaderboard.slice(3);

  const formatNumber = (num) => new Intl.NumberFormat().format(num || 0);

  return (
    <div className="lb-container">
      <div className="lb-glow-bg"></div>

      <div className="lb-content">
        <h1 className="lb-main-title">UserRush Rankings</h1>

        {/* Podiums */}
        <div className="lb-podiums">
          {/* Rank 2 */}
          <motion.div
            className="podium-card podium-silver"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            {second && (
              <>
                <div className="avatar-wrapper is-silver"><Medal size={45} strokeWidth={1.5} color="#cbd5e1" /></div>
                <h3>{second.gameId}</h3>
                <p className="earn-points">Rank 2</p>
                <div className="prize">{formatNumber(second.users)}</div>
                <p className="prize-label">Users</p>
              </>
            )}
          </motion.div>

          {/* Rank 1 */}
          <motion.div
            className="podium-card podium-gold"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          >
            {first && (
              <>
                <div className="avatar-wrapper is-first is-gold"><Trophy size={55} strokeWidth={1.5} color="#fbbf24" /></div>
                <h3 className="gold-name">{first.gameId}</h3>
                <p className="earn-points">Rank 1</p>
                <div className="prize is-large">{formatNumber(first.users)}</div>
                <p className="prize-label">Users</p>
              </>
            )}
          </motion.div>

          {/* Rank 3 */}
          <motion.div
            className="podium-card podium-bronze"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            {third && (
              <>
                <div className="avatar-wrapper is-bronze"><Award size={45} strokeWidth={1.5} color="#d97706" /></div>
                <h3>{third.gameId}</h3>
                <p className="earn-points">Rank 3</p>
                <div className="prize">{formatNumber(third.users)}</div>
                <p className="prize-label">Users</p>
              </>
            )}
          </motion.div>
        </div>

        {/* List Table */}
        <motion.div
          className="lb-table-container"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        >
          <div className="lb-table-header">
            <div className="col-rank">Rank</div>
            <div className="col-user">User name</div>
            <div className="col-reward">Users</div>
          </div>

          <div className="lb-table-body">
            <AnimatePresence>
              {rest.map((player, idx) => {
                const rank = idx + 4;
                return (
                  <motion.div
                    key={player.gameId}
                    className="lb-table-row"
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="col-rank">{rank}</div>
                    <div className="col-user">
                      <div className="user-info" style={{ marginLeft: "10px" }}>
                        <span className="name">{player.gameId}</span>
                      </div>
                    </div>
                    <div className="col-reward">{formatNumber(player.users)}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer — event ended banner */}
        <motion.div
          className="countdown countdown-ended"
          style={{ marginTop: '5rem', paddingBottom: '3rem', borderTop: 'none', width: 'auto' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          <Lock size={16} className="clock-icon ended-icon" />
          <span className="time ended-time" style={{ fontSize: '1rem' }}>🏁 Event has ended — rankings are final.</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
