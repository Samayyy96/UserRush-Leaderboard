import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ShieldAlert, Plus, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import './Admin.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://gameforge-leaderboard.onrender.com';

const Admin = () => {
  const { user } = useSelector((state) => state.auth);
  const [domains, setDomains] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError('');
      if (!auth.currentUser) throw new Error("No authenticated user.");

      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_URL}/admin/domains`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domains');
      }

      setDomains(data.domains || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      setGamesLoading(true);
      setError('');
      if (!auth.currentUser) throw new Error("No authenticated user.");

      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_URL}/admin/games`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch games');
      }

      setGames(data.games || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setGamesLoading(false);
    }
  };

  const toggleGameStatus = async (gameId, currentStatus) => {
    try {
      setActionLoading(gameId);
      setError('');
      
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_URL}/admin/game-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          game_id: gameId, 
          is_approved: !currentStatus 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setGames(prev => prev.map(g => 
        g.game_id === gameId ? { ...g, is_approved: !currentStatus } : g
      ));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDomains();
      fetchGames();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (!auth.currentUser) throw new Error("No authenticated user.");
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_URL}/admin/whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain: domainInput.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to whitelist domain');
      }

      setSuccess(data.message);
      setDomains(data.domains || []);
      setDomainInput('');

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && error.includes('Forbidden')) {
    return (
      <div className="admin-container">
        <div className="admin-forbidden">
          <ShieldAlert size={64} className="error-icon" />
          <h1>Access Denied</h1>
          <p>You do not have administrator privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <ShieldCheck size={32} className="admin-header-icon" />
        <h1>Firebase Admin</h1>
        <p>Manage Authorized Domains for Authentication</p>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <h2>Whitelist New Domain</h2>
          <form className="whitelist-form" onSubmit={handleSubmit}>
            <div className="input-row">
              <input
                type="text"
                placeholder="e.g. your-game.vercel.app"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={submitting}
              />
              <button
                type="submit"
                className="btn-whitelist"
                disabled={submitting || !domainInput.trim()}
              >
                {submitting ? 'Adding...' : <><Plus size={18} /> Whitelist</>}
              </button>
            </div>
            {error && !error.includes('Forbidden') && (
              <div className="alert-error"><AlertTriangle size={16} /> {error}</div>
            )}
            {success && (
              <div className="alert-success"><CheckCircle size={16} /> {success}</div>
            )}
          </form>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <h2>Authorized Domains</h2>
            <div className="domain-count">{domains.length} total</div>
          </div>

          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <span>Loading current domains...</span>
            </div>
          ) : domains.length > 0 ? (
            <div className="domain-list">
              {domains.map((domain, idx) => (
                <div key={idx} className="domain-item">
                  <span className="domain-name">{domain}</span>
                  <span className="domain-badge">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">No authorized domains found.</div>
          )}
        </div>

        <div className="admin-card">
          <div className="card-header">
            <h2>Leaderboard Management</h2>
            <div className="domain-count">{games.length} games</div>
          </div>
          <p className="card-subtext">Approve or disapprove games to control their visibility on the leaderboard.</p>

          {gamesLoading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <span>Loading games...</span>
            </div>
          ) : games.length > 0 ? (
            <div className="game-list">
              <div className="game-list-header">
                <span>Game ID</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {games.map((game) => (
                <div key={game.game_id} className="game-item">
                  <span className="game-name">{game.game_id}</span>
                  <span className={`game-status-badge ${game.is_approved ? 'approved' : 'pending'}`}>
                    {game.is_approved ? 'Approved' : 'Hidden'}
                  </span>
                  <button 
                    className={`btn-toggle ${game.is_approved ? 'btn-revoke' : 'btn-approve'}`}
                    onClick={() => toggleGameStatus(game.game_id, game.is_approved)}
                    disabled={actionLoading === game.game_id}
                  >
                    {actionLoading === game.game_id ? '...' : (game.is_approved ? 'Hide' : 'Show')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">No tracked games found in the system.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
