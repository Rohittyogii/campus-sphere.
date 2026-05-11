import React, { useEffect, useState, useMemo } from 'react';
import { Users, Search, ChevronRight, Sparkles, Rocket, Target, MapPin, Globe, CheckCircle2, SlidersHorizontal, UserPlus, Heart } from 'lucide-react';
import api from '../../services/api';

const getClubImage = (clubId, index) => {
  // Normalize the ID: handles "C001", "1", or fallback to index if missing
  const rawId = String(clubId || index + 1);
  const formattedId = rawId.startsWith('C') ? rawId : `C${rawId.padStart(3, '0')}`;
  return `/clubs/${formattedId}.png`;
};


const SleekCard = ({ children, style, onClick, accentColor = '#6366f1', image }) => {
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
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', background: '#f8fafc' }}>
        <img
          src={image}
          alt="Club Banner"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flexGrow: 1 }}>
        {children}
      </div>
    </div>
  );
};

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [matchedClubs, setMatchedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedClubForJoin, setSelectedClubForJoin] = useState(null);


  useEffect(() => {
    api.get('/clubs/').then(res => {
      setClubs(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/recommendations/all').then(res => {
      setMatchedClubs(res.data?.clubs || []);
    }).catch(() => { });

    setTimeout(() => setMounted(true), 60);
  }, []);

  const filteredClubs = useMemo(() => {
    return clubs.filter(c =>
      (c.club_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clubs, searchQuery]);

  const handleJoin = (name) => {
    setSelectedClubForJoin({ name });
    setIsJoinModalOpen(true);
  };

  const handleConfirmJoin = (role) => {
    setIsJoinModalOpen(false);
    setShowToast(`${role} request sent to ${selectedClubForJoin?.name}!`);
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
      `}</style>

      <div style={{ padding: '0.75rem 1.75rem 2.5rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Community Portal</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Clubs <span style={{ color: '#8B1D1D' }}>Hub</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by name or interests..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '14px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
                  fontSize: '0.85rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Smart Picks ────────────────────────────────────────── */}
        {matchedClubs.length > 0 && searchQuery === '' && (
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={20} color="#a855f7" />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Smart Picks</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {matchedClubs.slice(0, 4).map((c, i) => (
                <SleekCard key={i} accentColor="#a855f7" image={getClubImage(c.clubid, i)} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                      <Users size={18} />
                    </div>
                    <div style={{ padding: '0.3rem 0.6rem', background: '#f3e8ff', color: '#9333ea', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800 }}>
                      {c.match_score}% Match
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0', lineHeight: 1.3, minHeight: '2.6em' }}>{c.club_name}</h3>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Recommended</span>
                    <button onClick={() => handleJoin(c.club_name)} style={{ background: 'none', border: 'none', color: '#9333ea', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Join <ChevronRight size={14} />
                    </button>
                  </div>
                </SleekCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Explorer ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>All Communities</h2>
            <div style={{ padding: '0.3rem 0.8rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{filteredClubs.length} Active</div>
          </div>

          {loading ? (
            <div style={{ padding: '6rem', textAlign: 'center', color: '#94a3b8' }}>Syncing datastream...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {filteredClubs.map((club, i) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];
                const accent = colors[i % colors.length];
                return (
                  <SleekCard key={club.clubid} accentColor={accent} image={getClubImage(club.clubid, i)} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                        <Users size={18} />
                      </div>
                      <div style={{ padding: '0.3rem 0.6rem', borderRadius: '99px', background: '#f8fafc', color: '#64748b', fontSize: '0.6rem', fontWeight: 800 }}>ID #{club.clubid}</div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.3, minHeight: '2.6em' }}>{club.club_name}</h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{club.description || 'Join our vibrant community and grow together.'}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid #fff' }} />
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>250+ Members</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleJoin(club.club_name); }}
                        style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onMouseOver={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                      >
                        <UserPlus size={12} /> Join
                      </button>
                    </div>
                  </SleekCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal Overlay */}
      {isJoinModalOpen && (
        <div 
          onClick={() => setIsJoinModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', maxWidth: '420px',
              borderRadius: '28px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '18px', 
                background: '#f1f5f9', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', color: '#6366f1', margin: '0 auto 1rem'
              }}>
                <Users size={32} />
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                Join {selectedClubForJoin?.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Choose how you want to contribute to the community
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleConfirmJoin('Membership')}
                style={{
                  padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0',
                  background: '#fff', display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  width: '100%', outline: 'none'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Become a member</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Full access to events and discussions</div>
                </div>
                <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
              </button>

              <button 
                onClick={() => handleConfirmJoin('Volunteer')}
                style={{
                  padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0',
                  background: '#fff', display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  width: '100%', outline: 'none'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Volunteer</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Help organize events and gain experience</div>
                </div>
                <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
              </button>
            </div>

            {/* Close */}
            <button 
              onClick={() => setIsJoinModalOpen(false)}
              style={{
                marginTop: '1.5rem', width: '100%', background: 'none', border: 'none',
                color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                padding: '0.5rem', outline: 'none'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', background: '#0f172a', color: '#fff', padding: '1rem 1.75rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', zIndex: 1200, animation: 'fadeIn 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={20} color="#22c55e" /> {showToast}
        </div>
      )}

    </div>
  );
};

export default Clubs;
