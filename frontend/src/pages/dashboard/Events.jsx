import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Calendar, Zap, ExternalLink, Clock, Building2, Trophy, Sparkles, ChevronRight, Users, Rocket, Target, Star, Filter, Share2, Search, ArrowUpRight, ShieldCheck, MapPin, X, CheckCircle2, Layers, Cpu, Globe, SlidersHorizontal } from 'lucide-react';
import api from '../../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return 'Open';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const SleekCard = ({ children, style, onClick, accentColor = '#6366f1' }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        padding: '1.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
      {children}
    </div>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [suggestedHackathons, setSuggestedHackathons] = useState([]);
  const [tab, setTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showToast, setShowToast] = useState(null);

  useEffect(() => {
    api.get('/events/').then(res => {
      setEvents(res.data.events || []);
      setHackathons(res.data.hackathons || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/recommendations/all').then(res => {
      setSuggestedHackathons(res.data?.events?.hackathons || []);
    }).catch(() => { });

    setTimeout(() => setMounted(true), 60);
  }, []);

  const departments = useMemo(() => {
    const depts = events.map(e => e.department).filter(Boolean);
    return ['All', ...new Set(depts)];
  }, [events]);

  const filteredItems = useMemo(() => {
    const list = tab === 'events' ? events : hackathons;
    return list.filter(item => {
      const name = (item.event_name || item.hackathon_name || '').toLowerCase();
      const org = (item.organizer || item.department || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || org.includes(searchQuery.toLowerCase());
      const matchesDept = tab === 'events' ? (filterDept === 'All' || item.department === filterDept) : true;
      return matchesSearch && matchesDept;
    });
  }, [tab, events, hackathons, searchQuery, filterDept]);

  const handleRegister = (name) => {
    setShowToast(`Successfully registered for ${name}!`);
    setTimeout(() => setShowToast(null), 3000);
  };

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
        select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
      `}</style>

      <div style={{ padding: '0.75rem 1.75rem 2.5rem', maxWidth: '1600px', margin: '0 auto' }}>


        {/* ── Search & Filter Row ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '280px', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '14px',
                background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                fontSize: '0.85rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {tab === 'events' && (
            <div style={{ position: 'relative' }}>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                style={{
                  padding: '0.7rem 2.5rem 0.7rem 1.25rem', borderRadius: '14px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none'
                }}
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <SlidersHorizontal size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        {/* ── Content Layout ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '14px', width: 'fit-content', gap: '0.25rem' }}>
              {[
                { id: 'events', label: 'University Events', icon: Calendar },
                { id: 'hackathons', label: 'Tech Hackathons', icon: Zap },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setFilterDept('All'); }}
                  style={{
                    background: tab === t.id ? '#fff' : 'transparent',
                    color: tab === t.id ? '#0f172a' : '#64748b',
                    border: 'none', padding: '0.6rem 1.5rem', borderRadius: '11px',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: tab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '0.6rem'
                  }}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '6rem', textAlign: 'center', color: '#94a3b8' }}>Synchronizing data...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '8rem', textAlign: 'center', background: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                <Search size={48} style={{ color: '#cbd5e1', marginBottom: '1.5rem' }} />
                <h3 style={{ fontWeight: 800, color: '#64748b', margin: 0 }}>No results found</h3>
                <p style={{ color: '#94a3b8', fontWeight: 500, marginTop: '0.5rem' }}>Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredItems.map((item, i) => {
                  const accent = tab === 'events' ? '#6366f1' : '#f59e0b';
                  return (
                    <SleekCard key={i} accentColor={accent} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '14px',
                          background: `${accent}10`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: accent
                        }}>
                          {tab === 'events' ? <Calendar size={24} /> : <Trophy size={24} />}
                        </div>
                        <div style={{
                          padding: '0.35rem 0.75rem', borderRadius: '99px', background: '#fef2f2', color: '#ef4444',
                          fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          <Clock size={12} /> {formatDate(item.registration_deadline || item.date)}
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0', lineHeight: 1.25 }}>
                          {item.event_name || item.hackathon_name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                          <MapPin size={14} /> {item.organizer || item.department}
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid #fff' }} />
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>42 attending</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (tab === 'hackathons' && item.link) {
                              window.open(item.link, '_blank', 'noopener,noreferrer');
                            } else {
                              handleRegister(item.event_name || item.hackathon_name);
                            }
                          }}
                          style={{
                            background: accent, color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '10px',
                            fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                          }}
                          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                          onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                          Register
                          {tab === 'hackathons' && item.link && <ArrowUpRight size={14} />}
                        </button>
                      </div>
                    </SleekCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>



            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={18} color="#f59e0b" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Smart Picks for You</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suggestedHackathons.slice(0, 3).map((h, i) => (
                  <div key={i} style={{
                    padding: '1.25rem', background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9',
                    display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer',
                    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{h.hackathon_name}</h5>
                    <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 800 }}>{h.match_score}% Skills Match</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '2.5rem', right: '2.5rem',
          background: '#0f172a', color: '#fff', padding: '1rem 1.75rem',
          borderRadius: '16px', fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)', zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} color="#22c55e" />
          {showToast}
        </div>
      )}
    </div>
  );
};

export default Events;
