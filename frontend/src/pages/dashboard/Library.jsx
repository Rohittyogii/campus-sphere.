import React, { useEffect, useState } from 'react';
import { Book, Library as LibIcon, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [issued, setIssued] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    try {
      const [booksRes, issuedRes] = await Promise.all([
        api.get('/library/books?limit=20'),
        api.get('/library/my-issued')
      ]);
      setBooks(booksRes.data);
      setIssued(issuedRes.data);
    } catch (err) {
      console.error("Failed to fetch library data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssue = async (bookId) => {
    setLoading(true);
    try {
      const res = await api.post(`/library/issue/${bookId}`);
      if (res.data.error) {
        setMessage({ type: 'error', text: res.data.error });
      } else {
        setMessage({ type: 'success', text: res.data.message });
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Service unavailable. Try again later." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleReturn = async (issueId) => {
    setLoading(true);
    try {
      const res = await api.post(`/library/return/${issueId}`);
      setMessage({ type: 'success', text: res.data.message });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to return book." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Digital Library</h1>
        <p>Explore the Master Book Database and track your issued volumes.</p>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-md)',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: message.type === 'success' ? '#10b981' : '#f43f5e',
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      <div className="bento-grid">

        {/* Issued Books */}
        <div className="bento-card glass-panel" style={{ gridColumn: 'span 3', background: 'linear-gradient(135deg, rgba(30,32,41,0.8), rgba(99,102,241,0.05))' }}>
          <h3><CheckCircle size={18} color="#10b981" /> Currently Issued To You</h3>
          {issued.length === 0 ? <p style={{ color: 'var(--color-text-secondary)' }}>No books currently issued.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {issued.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-bg-dark)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '4px', background: '#10b981', borderRadius: '4px' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <h4 style={{ color: '#fff', fontSize: '1rem' }}>{b.title}</h4>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Due: {new Date(b.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => handleReturn(b.id)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  >
                    Return
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master Catalog */}
        <div className="bento-card glass-panel" style={{ gridColumn: 'span 3' }}>
          <h3><LibIcon size={18} color="var(--color-accent-primary)" /> Master Catalog (Preview)</h3>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>Title</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>Author</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>Cluster</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem', color: '#fff' }}>{b.title}</td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{b.author || 'Unknown'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'var(--color-bg-highlight)', color: 'var(--color-accent-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {b.cluster_label || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        disabled={loading}
                        onClick={() => handleIssue(b.id)}
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        Borrow
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};


export default Library;
