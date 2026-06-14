import React, { useState, useRef } from 'react';
import { Link2, Sparkles, Calendar, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const UrlForm = ({ onUrlCreated, onBulkCreated, token }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk CSV States
  const [bulkMode, setBulkMode] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!originalUrl) {
      setError('Please enter a URL to shorten');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias.trim() || undefined,
          expiresAt: expiresAt || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to shorten URL');
      }

      setSuccess(`URL successfully shortened to code: ${data.shortCode}`);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresAt('');
      if (onUrlCreated) onUrlCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        setCsvFile(file);
        setError('');
      } else {
        setError('Only CSV files are allowed');
        setCsvFile(null);
      }
    }
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBulkResult(null);

    if (!csvFile) {
      setError('Please choose a CSV file to upload');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch('/api/urls/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process bulk upload');
      }

      setBulkResult(data);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onBulkCreated) onBulkCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,originalUrl,customAlias,expiresAt\nhttps://google.com,google-search,2026-12-31\nhttps://github.com/trending,,\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_bulk_urls.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      {/* Mode Selector Tab */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setBulkMode(false); setError(''); setSuccess(''); setBulkResult(null); }}
          className="btn btn-sm"
          style={{
            background: !bulkMode ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
            color: !bulkMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            border: !bulkMode ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
          }}
        >
          Single URL
        </button>
        <button
          onClick={() => { setBulkMode(true); setError(''); setSuccess(''); setBulkResult(null); }}
          className="btn btn-sm"
          style={{
            background: bulkMode ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
            color: bulkMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            border: bulkMode ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
          }}
        >
          Bulk Import (CSV)
        </button>
      </div>

      {/* Errors & Success */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--danger)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--success)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Single URL Mode */}
      {!bulkMode && (
        <form onSubmit={handleSubmitSingle}>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>
                <Link2 size={18} />
              </div>
              <input
                type="url"
                placeholder="Enter your long URL here (e.g. https://example.com/very/long/path)..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.75rem', height: '48px' }}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: '48px', position: 'absolute', right: '4px', top: '4px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}
                disabled={loading}
              >
                {loading ? <div className="spinner"></div> : 'Shorten'}
              </button>
            </div>

            {/* Advanced Toggle */}
            <div style={{ textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Sparkles size={12} color="var(--accent-cyan)" />
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options (Custom Alias, Expiry)'}
              </button>
            </div>

            {/* Advanced Form Settings */}
            {showAdvanced && (
              <div className="fade-in grid-2" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Custom Alias</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. my-promo"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Expiry Date</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="form-input"
                    disabled={loading}
                    min={new Date().toISOString().substring(0, 16)}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Bulk CSV Mode */}
      {bulkMode && (
        <div>
          <form onSubmit={handleCsvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.01)',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
                disabled={loading}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.75rem', borderRadius: '50%' }}>
                  <Upload size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {csvFile ? csvFile.name : 'Click to select CSV File'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    File size limit 5MB. Must contain originalUrl header.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <FileText size={14} />
                <span>Download CSV Template</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !csvFile}
                style={{ minWidth: '150px' }}
              >
                {loading ? <div className="spinner"></div> : 'Upload & Shorten'}
              </button>
            </div>
          </form>

          {/* Bulk Results Summary */}
          {bulkResult && (
            <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontWeight: 600 }}>Bulk Shortening Results:</h4>
              <p style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{bulkResult.message}</p>
              
              {bulkResult.errors && bulkResult.errors.length > 0 && (
                <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem' }}>Error details:</p>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {bulkResult.errors.map((err, idx) => (
                      <li key={idx} style={{ marginBottom: '0.2rem' }}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlForm;
