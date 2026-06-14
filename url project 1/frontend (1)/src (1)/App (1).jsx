import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UrlForm from './components/UrlForm';
import UrlCard from './components/UrlCard';
import StatsDashboard from './components/StatsDashboard';
import PublicStats from './components/PublicStats';
import { 
  Link2, Sparkles, Shield, BarChart3, Database, KeyRound, 
  Plus, Search, Filter, Mail, Lock, ArrowRight, Eye, CheckCircle2, 
  ExternalLink, Calendar, Copy, Check, MousePointerClick, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = ''; // Proxied via Vite config to http://localhost:5000
const REDIRECT_BASE_URL = 'http://localhost:5000'; // Server port for redirection routing

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');
  const [view, setView] = useState(token ? 'dashboard' : 'landing'); // landing, login, register, dashboard, stats
  const [urls, setUrls] = useState([]);
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  
  // Dashboard Overview Metrics
  const [overviewStats, setOverviewStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    topLinks: [],
    recentActivity: []
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, active, expired

  // Login/Register Form States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Public Stats States
  const [publicStatsCode, setPublicStatsCode] = useState('');
  const [publicStatsData, setPublicStatsData] = useState(null);
  const [publicStatsLoading, setPublicStatsLoading] = useState(false);
  const [publicStatsError, setPublicStatsError] = useState('');

  // Check on boot if visiting a public stats link
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/stats/')) {
      const code = path.substring(7); // extracts shortCode
      if (code) {
        setPublicStatsCode(code);
        setView('public-stats');
        fetchPublicStats(code);
      }
    }
  }, []);

  const fetchPublicStats = async (code) => {
    setPublicStatsLoading(true);
    setPublicStatsError('');
    try {
      const res = await fetch(`/api/analytics/public/${code}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load public stats');
      }
      setPublicStatsData(data);
    } catch (err) {
      setPublicStatsError(err.message);
    } finally {
      setPublicStatsLoading(false);
    }
  };

  // Auto-verify token on launch
  useEffect(() => {
    if (token) {
      verifyToken();
      fetchDashboardData();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        handleLogout();
      }
    } catch (_) {
      handleLogout();
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      // Fetch user urls
      const urlsRes = await fetch('/api/urls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (urlsRes.ok) {
        const urlsData = await urlsRes.json();
        setUrls(urlsData);
      }

      // Fetch overview aggregates
      const statsRes = await fetch('/api/analytics/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setOverviewStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required');
      setAuthLoading(false);
      return;
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (data.errors && data.errors[0]?.msg) || 'Authentication failed');
      }

      // Save credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      setToken(data.token);
      setUserEmail(data.email);
      setAuthEmail('');
      setAuthPassword('');
      setView('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken('');
    setUserEmail('');
    setUrls([]);
    setView('landing');
  };

  const handleUrlDelete = async (urlId) => {
    try {
      const response = await fetch(`/api/urls/${urlId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete URL');
      }
      // Refresh
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUrlEditDestination = async (urlId, newDestUrl, newShortCode) => {
    const response = await fetch(`/api/urls/${urlId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ originalUrl: newDestUrl, shortCode: newShortCode })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to edit URL settings');
    }
    // Refresh
    fetchDashboardData();
    return data;
  };

  const handleUrlToggleActive = async (urlId) => {
    try {
      const response = await fetch(`/api/urls/${urlId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to toggle active status');
      }
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUrlTogglePublic = async (urlId) => {
    try {
      const response = await fetch(`/api/urls/${urlId}/toggle-public`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to toggle public stats');
      }
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter & Search Logic
  const filteredUrls = urls.filter(url => {
    const title = url.title || '';
    const originalUrl = url.originalUrl || '';
    const shortCode = url.shortCode || '';

    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false;
    if (filterType === 'expired') return isExpired;
    if (filterType === 'active') return !isExpired;
    return true; // all
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative Blur Backdrops */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <Navbar 
        userEmail={userEmail} 
        onLogout={handleLogout} 
        onGoHome={() => {
          if (token) setView('dashboard');
          else setView('landing');
          setSelectedUrlId(null);
        }} 
      />

      <main className="container" style={{ flexGrow: 1, paddingBottom: '4rem' }}>
        
        {/* LANDING / MARKETING VIEW */}
        {view === 'landing' && (
          <div className="fade-in" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            {/* Hero Section */}
            <div style={{ maxWidth: '800px', margin: '0 auto 4rem auto' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(236, 72, 153, 0.1)', 
                color: 'var(--accent-cyan)', 
                padding: '0.5rem 1rem', 
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                border: '1px solid rgba(236, 72, 153, 0.2)',
                marginBottom: '1.5rem'
              }}>
                <Sparkles size={14} />
                <span>Next-Generation URL Management</span>
              </div>

              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
                fontWeight: 800, 
                lineHeight: 1.1, 
                letterSpacing: '-0.03em', 
                marginBottom: '1.5rem' 
              }}>
                Shorten Links. <br/>
                <span style={{ 
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #d946ef 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  Track Performance.
                </span>
              </h1>

              <p style={{ 
                fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                maxWidth: '600px', 
                margin: '0 auto 2.5rem auto' 
              }}>
                A powerful tool to optimize, secure, and customize your links with real-time browser, device, and OS analytics tracking.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => setView('register')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Get Started Free</span>
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => setView('login')} className="btn btn-secondary">
                  Sign In to Dashboard
                </button>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid-3" style={{ marginTop: '2rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-cyan)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Link2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Smart Shortening</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Create secure, unique shortened URLs. Customize aliases, assign expiration dates, and generate instant QR Codes.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-blue)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <BarChart3 size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Deep Analytics</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Understand your audience. Visualize trends, trace browser/OS preferences, isolate device sizes, and inspect live click logs.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                <div style={{ background: 'rgba(217, 70, 239, 0.1)', color: 'var(--accent-purple)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Database size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bulk CSV Handling</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Import hundreds of URLs at once. Upload a standard CSV file and obtain download links instantly in batch operations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AUTHENTICATION VIEWS: LOGIN / REGISTER */}
        {(view === 'login' || view === 'register') && (
          <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <div className="glass-panel glow-border" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {view === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {view === 'login' 
                    ? 'Enter your credentials to manage your links' 
                    : 'Sign up to build and analyze shortened links'}
                </p>
              </div>

              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'left' }}>
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={(e) => handleAuthSubmit(e, view)}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '45px' }} disabled={authLoading}>
                  {authLoading ? <div className="spinner"></div> : view === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {view === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <span onClick={() => { setView('register'); setAuthError(''); }} style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
                      Sign Up
                    </span>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <span onClick={() => { setView('login'); setAuthError(''); }} style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
                      Sign In
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROTECTED USER DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Overview Aggregate Statistics */}
            <div className="grid-3">
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(244, 63, 94, 0.03) 100%)', borderColor: 'rgba(236, 72, 153, 0.25)' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-cyan)', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 0 15px rgba(236, 72, 153, 0.25)' }}>
                  <Link2 size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Links</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--accent-cyan)' }}>
                    {statsLoading ? '...' : overviewStats.totalLinks}
                  </h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.12) 0%, rgba(236, 72, 153, 0.03) 100%)', borderColor: 'rgba(217, 70, 239, 0.25)' }}>
                <div style={{ background: 'rgba(217, 70, 239, 0.15)', color: 'var(--accent-purple)', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 0 15px rgba(217, 70, 239, 0.25)' }}>
                  <MousePointerClick size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Clicks</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--accent-purple)' }}>
                    {statsLoading ? '...' : overviewStats.totalClicks}
                  </h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.03) 100%)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)' }}>
                  <RefreshCw size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Sync Status</span>
                  <button 
                    onClick={fetchDashboardData} 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '0.4rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: '24px', background: 'var(--gradient-primary)' }}
                  >
                    <RefreshCw size={12} className={statsLoading ? 'spin' : ''} style={{ animation: statsLoading ? 'spin 1s linear infinite' : 'none' }} />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Aggregate Overview Trend Chart */}
            {overviewStats.totalClicks > 0 && overviewStats.clickHistory && (
              <div className="glass-panel fade-in" style={{ padding: '1.5rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--accent-cyan)" />
                  <span>Account Click Activity (Last 14 Days)</span>
                </h3>
                <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewStats.clickHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={10} 
                        tickLine={false} 
                        tickFormatter={(str) => {
                          const parts = str.split('-');
                          return `${parts[1]}/${parts[2]}`; // MM/DD
                        }}
                      />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.8rem'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="var(--accent-cyan)" 
                        strokeWidth={2} 
                        fillOpacity={1}
                        fill="url(#colorOverview)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Creation Form Area */}
            <UrlForm 
              token={token} 
              onUrlCreated={() => fetchDashboardData()} 
              onBulkCreated={() => fetchDashboardData()} 
            />

            {/* Link List Controls */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>My Shortened Links</h3>
                
                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search links..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Filter size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2rem', height: '38px', fontSize: '0.85rem', width: '130px', cursor: 'pointer' }}
                    >
                      <option value="all">All Links</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid of Links */}
              {filteredUrls.length > 0 ? (
                <div className="grid-2">
                  {filteredUrls.map(url => (
                    <UrlCard
                      key={url._id}
                      url={url}
                      baseUrl={REDIRECT_BASE_URL}
                      onDelete={handleUrlDelete}
                      onEditDestination={handleUrlEditDestination}
                      onTogglePublic={handleUrlTogglePublic}
                      onToggleActive={handleUrlToggleActive}
                      onViewStats={(id) => {
                        setSelectedUrlId(id);
                        setView('stats');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }}>No links found</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {searchQuery || filterType !== 'all' 
                      ? 'Try adjusting your search criteria or filters' 
                      : 'Create your first short link using the form above!'}
                  </p>
                </div>
              )}
            </div>

            {/* Overview - Top Performing and Recent Logs table for analytics */}
            {overviewStats.topLinks?.length > 0 && (
              <div className="grid-2">
                
                {/* Top Links Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Top Performing Links</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {overviewStats.topLinks.map((link, idx) => (
                      <div key={link._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', paddingRight: '1rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.title || 'Untitled'}</p>
                          <a href={`${REDIRECT_BASE_URL}/${link.shortCode}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            /{link.shortCode}
                          </a>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                          {link.clicksCount} clicks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Activity Stream */}
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-blue)' }}>Recent Visit Activity</h3>
                  {overviewStats.recentActivity?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                      {overviewStats.recentActivity.map((activity, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>/{activity.urlId?.shortCode}</span>
                            <span style={{ color: 'var(--text-muted)' }}> was clicked by a </span>
                            <span style={{ color: 'var(--accent-cyan)' }}>{activity.device} ({activity.browser})</span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1.5rem 0' }}>No recent redirection activity recorded.</p>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* ANALYTICS DETAILS VIEW */}
        {view === 'stats' && selectedUrlId && (
          <StatsDashboard
            urlId={selectedUrlId}
            token={token}
            onBack={() => {
              setView('dashboard');
              setSelectedUrlId(null);
              fetchDashboardData();
            }}
          />
        )}

        {/* PUBLIC ANALYTICS DETAILS VIEW */}
        {view === 'public-stats' && (
          <PublicStats
            stats={publicStatsData}
            error={publicStatsError}
            loading={publicStatsLoading}
            onGoHome={() => {
              window.location.pathname = '/';
            }}
          />
        )}

      </main>


    </div>
  );
}

export default App;
