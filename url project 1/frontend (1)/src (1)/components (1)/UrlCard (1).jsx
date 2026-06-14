import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Calendar, BarChart3, QrCode, Edit2, CheckSquare, XSquare, ExternalLink, Download, Play, Pause } from 'lucide-react';
import QRCode from 'qrcode';

const UrlCard = ({ url, onDelete, onEditDestination, onToggleActive, onViewStats, onTogglePublic, baseUrl }) => {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editUrlText, setEditUrlText] = useState(url.originalUrl);
  const [editShortCodeText, setEditShortCodeText] = useState(url.shortCode);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const shortUrl = `${baseUrl}/${url.shortCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateQrCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(shortUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }
  };

  useEffect(() => {
    if (qrOpen && !qrDataUrl) {
      generateQrCode();
    }
  }, [qrOpen]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editUrlText) {
      setEditError('Destination URL is required');
      return;
    }

    if (!editShortCodeText) {
      setEditError('Short code / alias is required');
      return;
    }

    setEditLoading(true);
    try {
      await onEditDestination(url._id, editUrlText, editShortCodeText);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update URL settings');
    } finally {
      setEditLoading(false);
    }
  };

  // Check if link is expired
  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false;
  const expiryDateString = url.expiresAt ? new Date(url.expiresAt).toLocaleDateString() : null;

  // Determine active/inactive/expired status
  const isLinkActive = url.isActive && !isExpired;
  let statusText = 'Active';
  let statusColor = '#10b981';
  let statusBg = 'rgba(16, 185, 129, 0.12)';
  
  if (!url.isActive) {
    statusText = 'Inactive';
    statusColor = '#9ca3af';
    statusBg = 'rgba(156, 163, 175, 0.12)';
  } else if (isExpired) {
    statusText = 'Expired';
    statusColor = '#ef4444';
    statusBg = 'rgba(239, 68, 68, 0.12)';
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: statusBg,
        color: statusColor,
        border: `1px solid ${statusColor}30`
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: statusColor,
          marginRight: '2px',
          animation: isLinkActive ? 'pulse 1.8s infinite' : 'none'
        }}></div>
        <span>{statusText} {url.expiresAt && !isExpired && `(Exp: ${expiryDateString})`}</span>
      </div>

      {/* Header Info */}
      <div style={{ textAlign: 'left', paddingRight: '120px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {url.title || 'Untitled Link'}
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Created: {new Date(url.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Original URL Display / Editor */}
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontWeight: 600 }}>Destination</p>
        
        {isEditing ? (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0, gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Destination URL</label>
              <input
                type="url"
                value={editUrlText}
                onChange={(e) => setEditUrlText(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                disabled={editLoading}
                required
              />
            </div>
            
            <div className="form-group" style={{ margin: 0, gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Shortened Code / Custom Alias</label>
              <input
                type="text"
                value={editShortCodeText}
                onChange={(e) => setEditShortCodeText(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                disabled={editLoading}
                required
              />
            </div>

            {editError && <span className="form-error" style={{ fontSize: '0.75rem' }}>{editError}</span>}
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button type="button" onClick={() => { setIsEditing(false); setEditShortCodeText(url.shortCode); setEditUrlText(url.originalUrl); setEditError(''); }} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} disabled={editLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem' }} disabled={editLoading}>
                {editLoading ? <div className="spinner" style={{ width: '12px', height: '12px' }}></div> : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a 
              href={url.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              className="hover-underline"
            >
              <span>{url.originalUrl.length > 55 ? `${url.originalUrl.substring(0, 55)}...` : url.originalUrl}</span>
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </a>
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn btn-secondary btn-icon" 
              style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
              title="Edit destination"
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Short Link Display Panel */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.25rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Shortened URL</span>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-cyan)', textDecoration: 'none' }}>
            {url.shortCode}
          </a>
        </div>

        <button 
          onClick={handleCopy} 
          className="btn btn-secondary btn-icon glow-border"
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          title="Copy short link"
        >
          {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Public Stats Share Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        marginTop: '0.25rem',
        background: 'rgba(255,255,255,0.01)',
        padding: '0.35rem 0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.02)'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={url.isPublicStats || false}
            onChange={() => onTogglePublic(url._id)}
            style={{ cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
          />
          <span style={{ fontSize: '0.8rem' }}>Public Analytics Link</span>
        </label>
        {url.isPublicStats && (
          <button
            onClick={() => {
              const statsLink = `${window.location.origin}/stats/${url.shortCode}`;
              navigator.clipboard.writeText(statsLink).then(() => {
                alert("Copied public analytics link:\n" + statsLink);
              });
            }}
            className="btn btn-secondary btn-sm"
            style={{ 
              padding: '0.2rem 0.5rem', 
              fontSize: '0.75rem', 
              height: 'auto', 
              border: '1px solid rgba(6, 182, 212, 0.2)', 
              background: 'rgba(6, 182, 212, 0.05)', 
              color: 'var(--accent-cyan)' 
            }}
          >
            Copy Link
          </button>
        )}
      </div>

      {/* Footer statistics and Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
        
        {/* Clicks */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Clicks</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{url.clicksCount}</span>
        </div>

        {/* Action button bar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onToggleActive(url._id)}
            className="btn btn-secondary btn-icon"
            style={{ 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 0,
              color: url.isActive ? '#f59e0b' : '#10b981'
            }}
            title={url.isActive ? "Pause Redirection (Close URL)" : "Activate Redirection (Open URL)"}
          >
            {url.isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={() => setQrOpen(!qrOpen)}
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title="QR Code"
          >
            <QrCode size={16} />
          </button>
          
          <button
            onClick={() => onViewStats(url._id)}
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title="Analytics"
          >
            <BarChart3 size={16} color="var(--accent-blue)" />
          </button>
          
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete /${url.shortCode}?`)) {
                onDelete(url._id);
              }
            }}
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title="Delete link"
          >
            <Trash2 size={16} color="var(--danger)" />
          </button>
        </div>
      </div>

      {/* QR Code Popover */}
      {qrOpen && (
        <div className="fade-in glass-panel" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 21, 40, 0.96)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          borderRadius: '16px'
        }}>
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR Code" style={{ width: '130px', height: '130px', borderRadius: '8px', border: '4px solid white', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={qrDataUrl}
                  download={`qr_${url.shortCode}.png`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setQrOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className="spinner"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlCard;
