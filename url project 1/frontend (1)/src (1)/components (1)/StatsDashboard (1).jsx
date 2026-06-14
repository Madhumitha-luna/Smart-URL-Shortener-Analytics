import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MousePointerClick, Activity, Monitor, Compass, ShieldAlert, HeartHandshake, Link as LinkIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatsDashboard = ({ urlId, token, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/analytics/url/${urlId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlId) {
      fetchStats();
    }
  }, [urlId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Generating analytics reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <p style={{ marginBottom: '1rem' }}>Error: {error}</p>
        <button onClick={onBack} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { url, clicksCount, lastVisited, deviceStats, browserStats, osStats, clickHistory, recentHistory } = stats;

  const formattedLastVisited = lastVisited 
    ? new Date(lastVisited).toLocaleString() 
    : 'Never';

  const renderProgressList = (dataList, total) => {
    if (!dataList || dataList.length === 0) {
      return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left' }}>No analytics recorded yet.</p>;
    }

    // Sort by count descending
    const sorted = [...dataList].sort((a, b) => b.value - a.value);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sorted.map((item, index) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          let gradient = 'var(--gradient-primary)';
          if (index % 3 === 1) gradient = 'var(--gradient-secondary)';
          if (index % 3 === 2) gradient = 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))';

          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name || 'Unknown'}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.value} ({pct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: gradient,
                  borderRadius: '3px',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary btn-icon"
            style={{ width: '40px', height: '40px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {url.title || 'Link Analytics'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>/{url.shortCode}</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <a href={url.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} className="hover-underline">
                <span>{url.originalUrl.length > 50 ? `${url.originalUrl.substring(0, 50)}...` : url.originalUrl}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Widgets */}
      <div className="grid-3">
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.75rem', borderRadius: '12px' }}>
            <MousePointerClick size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Clicks</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{clicksCount}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Last Clicked</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{formattedLastVisited}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', padding: '0.75rem', borderRadius: '12px' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Created Date</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{new Date(url.createdAt).toLocaleDateString()}</h3>
          </div>
        </div>
      </div>

      {/* Daily Click Trend Line Chart */}
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Click History (Last 14 Days)</h3>
        {clicksCount > 0 ? (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clickHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  tickFormatter={(str) => {
                    const parts = str.split('-');
                    return `${parts[1]}/${parts[2]}`; // MM/DD
                  }}
                />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth={3} 
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-secondary)' }}>
            No clicks recorded yet. Share your short link to gather click data.
          </div>
        )}
      </div>

      {/* Breakdowns Grid */}
      {clicksCount > 0 && (
        <div className="grid-3">
          
          {/* Device Type */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-cyan)' }}>
              <Monitor size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Devices</h3>
            </div>
            {renderProgressList(deviceStats, clicksCount)}
          </div>

          {/* Browser */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>
              <Compass size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Browsers</h3>
            </div>
            {renderProgressList(browserStats, clicksCount)}
          </div>

          {/* OS */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-purple)' }}>
              <ShieldAlert size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>OS</h3>
            </div>
            {renderProgressList(osStats, clicksCount)}
          </div>

        </div>
      )}

      {/* Recent Activity Logs */}
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Visit History</h3>
        {recentHistory && recentHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>IP Address</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Device</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>OS</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Browser</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((log, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{log.device}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{log.os}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{log.browser}</td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={log.referrer}>
                      {log.referrer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: 'var(--text-secondary)' }}>
            No visit logs available.
          </div>
        )}
      </div>

    </div>
  );
};

export default StatsDashboard;
