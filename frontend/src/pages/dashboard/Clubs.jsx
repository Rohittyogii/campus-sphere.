import React, { useEffect, useState } from 'react';
import { Users, ChevronRight, Search } from 'lucide-react';
import api from '../../services/api';

const clubColors = [
  { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' },
  { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' },
  { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' },
  { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
];

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clubs/').then(res => {
      setClubs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = clubs.filter(c =>
    c.club_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🎭 Campus Clubs</h1>
        <p>Explore {clubs.length} student clubs and societies active on campus.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search clubs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: '2.75rem', borderRadius: 'var(--radius-full)' }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '3rem' }}>Loading clubs...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map((club, idx) => {
            const style = clubColors[idx % clubColors.length];
            const isOpen = expanded === club.clubid;
            return (
              <div
                key={club.clubid}
                className="bento-card glass-panel"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', border: isOpen ? `1px solid ${style.color}` : '1px solid var(--color-border)' }}
                onClick={() => setExpanded(isOpen ? null : club.clubid)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={20} color={style.color} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{club.club_name}</div>
                    <div style={{ fontSize: '0.75rem', color: style.color, fontWeight: 600 }}>Club ID: {club.clubid}</div>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-secondary)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {isOpen && club.description && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                    {club.description}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-secondary)', padding: '3rem' }}>
              No clubs found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Clubs;
