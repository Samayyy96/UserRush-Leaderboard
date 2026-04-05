import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, Medal, Award } from "lucide-react";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [slowApi, setSlowApi]         = useState(false);
  const [error, setError]             = useState(null);
  const [totalUsers, setTotalUsers]   = useState(0);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState("");

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("https://gameforge-leaderboard.onrender.com/leaderboard");
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      const data = await response.json();
      if (data?.leaderboard) {
        let total = 0;
        data.leaderboard.forEach(p => total += (p.users || 0));
        setTotalUsers(total);
        
        const validPrefixes = ['LCS', 'LCI', 'LIT', 'LCB'];
        const filteredBoard = data.leaderboard.filter(player => {
          const id = String(player.gameId || "").toUpperCase();
          return id.length === 10 && validPrefixes.some(prefix => id.startsWith(prefix));
        });
        setLeaderboard(filteredBoard.slice(0, 10));
      }
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
    const slowTimer = setTimeout(() => setSlowApi(true), 6000);
    const interval  = setInterval(fetchLeaderboard, 5000);

    // April 13, 2026 12:00 PM local time
    const targetDate = new Date("2026-04-13T12:00:00");
    const updateTime = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft("0d 0h 0m 0s");
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };
    
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => { clearInterval(interval); clearTimeout(slowTimer); clearInterval(clockInterval); };
  }, []);

  // Safe access for top 3
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const rest = leaderboard.slice(3);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  return (
    <div className="lb-container">
      <div className="lb-glow-bg"></div>

      {loading ? (
        <div className="lb-loading-state">
          <div className="spinner"></div>
          <p>Loading the arena...</p>
        </div>
      ) : error ? (
        <div className="lb-error-state">
           <p>{error}</p>
           <button onClick={fetchLeaderboard}>Retry</button>
        </div>
      ) : (
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
                  <div className="prize">
                    {formatNumber(second.users)}
                  </div>
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
                  <div className="prize is-large">
                    {formatNumber(first.users)}
                  </div>
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
                  <div className="prize">
                    {formatNumber(third.users)}
                  </div>
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
                      <div className="col-reward">
                        {formatNumber(player.users)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Footer Timer */}
          <motion.div 
            className="countdown"
            style={{ marginTop: '5rem', paddingBottom: '3rem', borderTop: 'none', width: 'auto' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          >
            <Clock size={16} className="clock-icon" />
            <span className="ends-in" style={{ fontSize: '1rem' }}>Ends in</span>
            <span className="time" style={{ fontSize: '1.2rem' }}>{timeLeft}</span>
          </motion.div>

        </div>
      )}
    </div>
  );
};

export default Leaderboard;