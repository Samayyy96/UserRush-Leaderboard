simport React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ShieldAlert, Plus, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import './Admin.css';

const API_URL = 'https://gameforge-leaderboard.onrender.com/';

const Admin = () => {
  const { user } = useSelector((state) => state.auth);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (user) {
      fetchDomains();
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
      </div>
    </div>
  );
};

export default Admin;
