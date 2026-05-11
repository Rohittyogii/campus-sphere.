import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Library as LibIcon, CheckCircle2, Clock, Search, RotateCcw, Sparkles, BookMarked, Hash, ChevronRight, UserPlus, Bookmark, Filter, ArrowRight } from 'lucide-react';
import api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────
const clusterColors = {
  0: { bg: '#eef2ff', color: '#6366f1', label: 'CS' },
  1: { bg: '#d1fae5', color: '#10b981', label: 'Math' },
  2: { bg: '#fef3c7', color: '#f59e0b', label: 'Eng' },
  3: { bg: '#fbcfe8', color: '#ec4899', label: 'Mgmt' },
  4: { bg: '#cffafe', color: '#0891b2', label: 'Sci' },
};

const getCluster = (label) => {
  const key = Object.keys(clusterColors).find(k => clusterColors[k].label === label?.slice(0, 3));
  return clusterColors[key] || clusterColors[0];
};

// Robust image component with fallback
const BookCover = ({ bookId, style, alt = "Book Cover" }) => {
  const [error, setError] = useState(false);
  const coverUrl = `/library/${bookId}.jpg`;

  if (error || !bookId) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style
      }}>
        <div style={{ color: '#94a3b8', opacity: 0.3 }}>
          <BookMarked size={40} />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
          NO COVER
        </span>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={alt}
      onError={() => setError(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'all 0.3s', ...style }}
    />
  );
};

// ── Components ─────────────────────────────────────────────────────
const SleekCard = ({ children, style, onClick, accentColor = '#6366f1', bookId, badge }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        padding: '0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        height: '100%',
        overflow: 'hidden',
        ...style
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = `${accentColor}44`;
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}10`;
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = '#f1f5f9';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
      }}
    >
      <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden', background: '#f8fafc' }}>
        <BookCover bookId={bookId} />
        {badge && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '0.3rem 0.6rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800, color: accentColor, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {badge}
          </div>
        )}
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flexGrow: 1 }}>
        {children}
      </div>
    </div>
  );
};

const Library = () => {
  const [books, setBooks] = useState([]);
  const [issued, setIssued] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const PAGE_SIZE = 40;

  const categories = [
    'All',
    'Civil Engineering',
    'Computer Science',
    'Economics',
    'Electrical Engineering',
    'Electronics',
    'Language',
    'Law',
    'Management',
    'Mathematics',
    'Mechanical Engineering',
    'Science'
  ];


  const fetchData = async (pageNum = 0, isNewSearch = false) => {
    if (loading && !isNewSearch) return;
    setLoading(true);
    try {
      const skip = pageNum * PAGE_SIZE;
      let url = `/library/books?skip=${skip}&limit=${PAGE_SIZE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory && selectedCategory !== 'All') url += `&category=${selectedCategory}`;
      if (showOnlyAvailable) url += `&only_available=true`;

      const res = await api.get(url);
      const newBooks = res.data || [];


      if (isNewSearch) {
        setBooks(newBooks);
      } else {
        setBooks(prev => [...prev, ...newBooks]);
      }

      setHasMore(newBooks.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssued = async () => {
    try {
      const res = await api.get('/library/my-issued');
      setIssued(res.data || []);
    } catch (err) {
      console.error('Failed to fetch issued books', err);
    }
  };

  useEffect(() => {
    fetchIssued();
    api.get('/recommendations/all').then(res => {
      setRecommendedBooks(res.data?.books || []);
    }).catch(() => { });
    setTimeout(() => setMounted(true), 60);
  }, []);

  // Effect for search - reset and fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchData(0, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Effect for category - reset and fetch
  useEffect(() => {
    setPage(0);
    fetchData(0, true);
  }, [selectedCategory, showOnlyAvailable]);



  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage);
  };

  const handleIssue = async (bookId, title) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/library/issue/${bookId}`);
      if (res.data.error) setShowToast({ type: 'error', text: res.data.error });
      else {
        setShowToast({ type: 'success', text: `Success! "${title}" has been issued.` });
        fetchIssued();
      }
    } catch {
      setShowToast({ type: 'error', text: 'Service unavailable. Try again later.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setShowToast(null), 3000);
    }
  };


  const handleReturn = async (issueId, title) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/library/return/${issueId}`);
      if (res.data.error) {
        setShowToast({ type: 'error', text: res.data.error });
      } else {
        setShowToast({ type: 'success', text: `"${title || 'Book'}" returned successfully.` });
        fetchIssued();
      }
    } catch {


      setShowToast({ type: 'error', text: 'Failed to return book.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const filteredBooks = useMemo(() => {
    return books;
  }, [books]);

  return (
    <div style={{
      background: '#FFFFFF',
      minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.5s ease',
      position: 'relative',
      color: '#0f172a'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <div style={{ padding: '0.75rem 1.75rem 2.5rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academic Resources</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Library <span style={{ color: '#8B1D1D' }}>Portal</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search across 6500+ books..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '14px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                  fontSize: '0.85rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── My Books (Issued) ──────────────────────────────────── */}
        {issued.length > 0 && (
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <BookMarked size={20} color="#10b981" />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Currently Issued</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {issued.map((b, i) => {
                const due = new Date(b.due_date);
                const today = new Date();
                const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                const isOverdue = daysLeft < 0;
                return (
                  <div key={b.id} style={{
                    background: isOverdue ? '#fff1f2' : '#fff',
                    borderRadius: '24px',
                    border: `1px solid ${isOverdue ? '#fecaca' : '#f1f5f9'}`,
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '84px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      background: '#f8fafc'
                    }}>
                      <BookCover bookId={b.book_id} />
                    </div>

                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isOverdue ? '#e11d48' : '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Clock size={12} />
                        {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days remaining`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReturn(b.id, b.title)}
                      disabled={actionLoading}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '12px', border: 'none',
                        background: isOverdue ? '#e11d48' : '#0f172a', color: '#fff',
                        fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                        transition: 'all 0.2s', opacity: actionLoading ? 0.6 : 1
                      }}
                    >
                      Return
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Smart Picks ────────────────────────────────────────── */}
        {recommendedBooks.length > 0 && search === '' && (
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={20} color="#a855f7" />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recommendations</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {recommendedBooks.slice(0, 4).map((b, i) => {
                const cluster = getCluster(b.cluster_label);
                return (
                  <SleekCard key={i} accentColor="#a855f7" bookId={b.book_id} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }} badge={`${b.match_score}% Match`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cluster.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cluster.color }}>
                        <BookOpen size={18} />
                      </div>
                      <div style={{ padding: '0.3rem 0.6rem', background: '#f8fafc', color: '#64748b', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800 }}>
                        {b.cluster_label || 'General'}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 600 }}>{b.author || 'Academic Resource'}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.75rem', color: b.available !== false ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {b.available !== false ? `● ${b.quantity || 1} Available` : '● Out of Stock'}
                      </span>

                      <button
                        disabled={!b.available || actionLoading}
                        onClick={() => handleIssue(b.book_id, b.title)}
                        style={{ background: 'none', border: 'none', color: '#9333ea', fontSize: '0.8rem', fontWeight: 800, cursor: b.available ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: b.available ? 1 : 0.5 }}
                      >
                        Borrow <ChevronRight size={14} />
                      </button>
                    </div>
                  </SleekCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Explorer ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Master Catalog</h2>
              <div style={{ padding: '0.3rem 0.8rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                {search ? `Searching for "${search}"` : 'Exploring All Books'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Filter size={16} style={{ position: 'absolute', left: '1rem', color: '#94a3b8', zIndex: 1 }} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    minWidth: '220px',
                    transition: 'all 0.2s'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Departments' : cat}
                    </option>
                  ))}
                </select>
                <ChevronRight size={14} style={{ position: 'absolute', right: '1rem', color: '#94a3b8', transform: 'rotate(90deg)' }} />
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                background: '#f8fafc',
                padding: '0.75rem 1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                userSelect: 'none'
              }}>
                <div
                  onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '6px',
                    border: `2px solid ${showOnlyAvailable ? '#6366f1' : '#cbd5e1'}`,
                    background: showOnlyAvailable ? '#6366f1' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {showOnlyAvailable && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Available Only</span>
              </label>
            </div>

          </div>


          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredBooks.map((book, i) => {
              const cluster = getCluster(book.cluster_label);
              return (
                <SleekCard key={book.book_id || i} accentColor={cluster.color} bookId={book.book_id} className="fade-in" style={{ animationDelay: `${(i % 20) * 0.02}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cluster.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cluster.color }}>
                      <LibIcon size={18} />
                    </div>
                    <div style={{ padding: '0.3rem 0.6rem', borderRadius: '99px', background: '#f8fafc', color: '#64748b', fontSize: '0.6rem', fontWeight: 800 }}>{cluster.label}</div>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0', lineHeight: 1.3, minHeight: '2.6em', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 600 }}>{book.author || 'University Press'}</p>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: book.available !== false ? '#10b981' : '#ef4444' }} />
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{book.available !== false ? `${book.quantity || 1} Available` : 'Reserved'}</span>

                    </div>
                    <button
                      disabled={book.available === false || actionLoading}
                      onClick={(e) => { e.stopPropagation(); handleIssue(book.book_id, book.title); }}
                      style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: book.available !== false ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: book.available !== false ? 1 : 0.5 }}
                      onMouseOver={e => { if (book.available !== false) { e.currentTarget.style.background = cluster.color; e.currentTarget.style.color = '#fff'; } }}
                      onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                    >
                      Borrow
                    </button>
                  </div>
                </SleekCard>
              );
            })}
          </div>

          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', paddingBottom: '3rem' }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  padding: '0.8rem 2rem',
                  borderRadius: '16px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                {loading ? <RotateCcw className="spin" size={18} /> : 'Load More Books'}
              </button>
            </div>
          )}

          {books.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Search size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>No books found matching your search.</h3>
              <p style={{ color: '#94a3b8' }}>Try searching by a different title or author.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', background: '#0f172a', color: '#fff', padding: '1rem 1.75rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', zIndex: 1200, animation: 'fadeIn 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {showToast.type === 'success' ? <CheckCircle2 size={20} color="#22c55e" /> : <Clock size={20} color="#ef4444" />}
          {showToast.text}
        </div>
      )}
    </div>
  );
};

export default Library;
