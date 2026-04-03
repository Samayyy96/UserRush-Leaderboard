import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { logoutSuccess } from '../store/authSlice';
import styles from './Header.module.css';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isProjectsPage = location.pathname === '/projects';

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logoutSuccess());
      navigate('/login');
      setDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoArea}>
        {isProjectsPage ? (
          <Link to="/" className={styles.navLink}>
            <span className={styles.navArrow}>←</span> Leaderboard
          </Link>
        ) : (
          <Link to="/projects" className={styles.navLink}>
            View Projects <span className={styles.navArrow} style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>←</span>
          </Link>
        )}
      </div>

      <div className={styles.userProfileWrapper}>
        <div
          className={styles.profileTrigger}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className={styles.userName}>{user.displayName || 'User'}</span>
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              <User size={18} />
            </div>
          )}
        </div>

        {dropdownOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownHeader}>
              <div className={styles.dropdownName}>{user.displayName}</div>
              <div className={styles.dropdownEmail}>{user.email}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
