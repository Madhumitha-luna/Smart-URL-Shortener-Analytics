import React from 'react';
import { Link2, LogOut, User, BarChart3 } from 'lucide-react';

const Navbar = ({ userEmail, onLogout, onGoHome }) => {
  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', marginBottom: '2rem' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
        {/* Logo */}
        <div 
          onClick={onGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'var(--gradient-primary)',
            padding: '0.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)'
          }}>
            <Link2 size={22} color="white" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LinkVibe
          </span>
        </div>

        {/* Auth Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {userEmail ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <User size={16} />
                <span>{userEmail}</span>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Link Management Dashboard
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
