import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, BookOpen, User, Users, Info, ChevronRight, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import api from '../../services/api';

const OpenElectives = () => {
  const [electives, setElectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseType, setCourseType] = useState('All');
  const [selectedOE, setSelectedOE] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);

  useEffect(() => {
    // Fetch catalog
    api.get('/oe/')
      .then(res => setElectives(res.data || []))
      .catch(err => console.error("Error fetching OEs:", err))
      .finally(() => setLoading(false));

    // Fetch recommendations
    api.get('/recommendations/all')
      .then(res => setRecommendations(res.data.open_electives || []))
      .catch(err => console.error("Error fetching recommendations:", err))
      .finally(() => setRecLoading(false));

    setTimeout(() => setMounted(true), 100);
  }, []);

  const filtered = useMemo(() => {
    return electives.filter(e => {
      const term = search.toLowerCase();
      const matchSearch = (
        e.course?.toLowerCase().includes(term) ||
        e.code?.toLowerCase().includes(term) ||
        e.offered_by?.toLowerCase().includes(term) ||
        e.descriptions?.toLowerCase().includes(term)
      );

      const type = e.course_type?.toLowerCase() || '';
      let matchType = courseType === 'All';
      if (courseType === 'Full MOOC') matchType = type.includes('full mooc');
      else if (courseType === 'MOOC') matchType = type === 'mooc';
      else if (courseType === 'Regular') matchType = type === 'regular' || type === '';

      return matchSearch && matchType;
    });
  }, [electives, search, courseType]);

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.6s ease-out',
      padding: '2rem 3rem',
      maxWidth: '1600px',
      margin: '0 auto',
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .course-card:hover { border-color: #6366f144 !important; transform: translateY(-4px); box-shadow: 0 12px 30px rgba(99,102,241,0.08) !important; }
        .filter-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; }
        .rec-card:hover { transform: scale(1.02); }
      `}</style>

      {/* ── Details Modal ─────────────────────────────────────────── */}
      {selectedOE && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={() => setSelectedOE(null)}>
          <div
            className="scale-up"
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '700px',
              borderRadius: '32px',
              padding: '3rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>

            <button
              onClick={() => setSelectedOE(null)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <span style={{ padding: '0.4rem 0.8rem', background: '#6366f115', color: '#6366f1', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>{selectedOE.code}</span>
              <span style={{ padding: '0.4rem 0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>{selectedOE.course_type || 'Regular'}</span>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>{selectedOE.course}</h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#6366f1" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Offered By</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>{selectedOE.offered_by}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color="#6366f1" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Structure</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>L-T-P: {selectedOE.l_t_p || '3-0-0'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#6366f1" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Availability</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: (selectedOE.vacancy === 'Full' || selectedOE.vacancy === '0') ? '#f43f5e' : '#10b981' }}>
                    {selectedOE.vacancy === 'Full' ? 'No Vacancy' : `${selectedOE.vacancy || '—'} Slots Available`}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #eef2f6', marginBottom: '2.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Info size={18} color="#6366f1" /> Course Description
              </h4>
              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8, margin: 0 }}>
                {selectedOE.descriptions || "This interdisciplinary course offers students a comprehensive understanding of the subject matter, focusing on practical applications and theoretical foundations. Students will engage with modern methodologies and collaborative projects throughout the semester."}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                disabled={selectedOE.vacancy === 'Full' || selectedOE.vacancy === '0'}
                style={{
                  flexGrow: 1,
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: (selectedOE.vacancy === 'Full' || selectedOE.vacancy === '0') ? '#cbd5e1' : '#6366f1',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: (selectedOE.vacancy === 'Full' || selectedOE.vacancy === '0') ? 'not-allowed' : 'pointer',
                  boxShadow: (selectedOE.vacancy === 'Full' || selectedOE.vacancy === '0') ? 'none' : '0 8px 20px rgba(99,102,241,0.3)'
                }}
              >
                Enroll in Course
              </button>
              <button
                onClick={() => setSelectedOE(null)}
                style={{ padding: '1.25rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header & Stats ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academic Pathways</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Open <span style={{ color: '#6366f1' }}>Electives</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>Explore and select interdisciplinary courses for your next semester.</p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{electives.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Courses</div>
          </div>
          <div style={{ background: '#6366f110', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #6366f120', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6366f1' }}>{filtered.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>Filtered</div>
          </div>
        </div>
      </div>

      {/* ── Personalized Recommendations Section ────────────────── */}
      {recommendations.length > 0 && !recLoading && (
        <div className="fade-in" style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10b98115', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Recommended For You</h3>
            <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rec-card"
                onClick={() => setSelectedOE(rec)}
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  border: '1px solid #10b98120',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{rec.match_label || 'High Match'}</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{rec.course}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>{rec.offered_by}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{rec.match_score}%</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: rec.has_vacancy ? '#10b981' : '#f43f5e', textTransform: 'uppercase' }}>
                    {rec.has_vacancy ? 'Available' : 'Full'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filters ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by course name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3.5rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#0f172a',
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
          />
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <select
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
            className="filter-select"
            style={{
              width: '100%',
              padding: '1rem 2.5rem 1rem 3.5rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
          >
            <option value="All">All Courses</option>
            <option value="Full MOOC">Full MOOC</option>
            <option value="MOOC">MOOC</option>
            <option value="Regular">Regular</option>
          </select>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Curating electives...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {filtered.map((oe, i) => (
            <div
              key={oe.id}
              className="course-card"
              style={{
                background: '#fff',
                borderRadius: '24px',
                border: '1px solid #f1f5f9',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                animation: `fadeIn 0.4s ease-out forwards ${i * 0.05}s`,
                opacity: 0,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Card Accents */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)', borderRadius: '0 0 0 100%' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '0.4rem 0.8rem',
                  background: '#6366f110',
                  color: '#6366f1',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}>
                  {oe.code}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: (oe.vacancy === 'Full' || oe.vacancy === '0') ? '#f43f5e' : '#10b981'
                }}>
                  {(oe.vacancy === 'Full' || oe.vacancy === '0') ? 'No Vacancy' : `Availability: ${oe.vacancy || '—'}`}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.3 }}>{oe.course}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <User size={14} color="#94a3b8" />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{oe.offered_by}</span>
                </div>
              </div>

              <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {oe.descriptions ? oe.descriptions.slice(0, 160) + (oe.descriptions.length > 160 ? '...' : '') : 'No course description available for this elective.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Structure</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{oe.l_t_p || '3-0-0'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Type</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{oe.course_type || 'Open'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOE(oe)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  View Details <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <BookOpen size={32} color="#cbd5e1" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>No electives found</h3>
          <p style={{ color: '#64748b' }}>Try adjusting your search or department filter.</p>
        </div>
      )}
    </div>
  );
};

export default OpenElectives;
