import React, { useEffect, useState } from 'react';
import { Users, Zap, Coffee, BookOpen, GraduationCap, Cpu, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import api from '../../services/api';

// ─── Shared sub-components ────────────────────────────────────────────────────

const ScoreBadge = ({ score, label, color = '#818cf8' }) => (
  <span style={{
    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
    background: `${color}22`, color, fontSize: '0.72rem', fontWeight: 700,
    whiteSpace: 'nowrap'
  }}>
    {score}% · {label}
  </span>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{subtitle}</div>}
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center' }}>
    {text}
  </div>
);

// ─── Main Recommendations Page ─────────────────────────────────────────────────

const Recommendations = ({ profile }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/recommendations/all')
      .then(res => setData(res.data))
      .catch(err => setError('Could not load recommendations. Try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
      <Loader2 size={32} className="spinner" />
      <span>Analyzing your profile...</span>
    </div>
  );

  if (error) return (
    <div className="page-container fade-in">
      <div style={{ color: '#f43f5e', padding: '2rem', textAlign: 'center' }}>{error}</div>
    </div>
  );

  const { clubs = [], events = {}, cafe = {}, open_electives = [], specialization = [], books = [] } = data || {};
  const { events: evtList = [], hackathons: hackList = [] } = events;
  const { top_picks = [], combos = [] } = cafe;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🎯 Personalized For You</h1>
        <p>AI-powered recommendations across 6 modules — based on your skills, career goals, and interests.</p>
      </div>

      {/* ── Specialization Match Bar ───────────────────────────────────── */}
      <div className="bento-card glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <SectionHeader icon={GraduationCap} title="Specialization Fit" subtitle="Keyword scoring across your entire profile" color="#a855f7" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {specialization.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 180, flexShrink: 0, fontSize: '0.85rem', color: s.is_current ? '#a855f7' : 'var(--color-text-secondary)', fontWeight: s.is_current ? 700 : 400 }}>
                {s.specialization_name} {s.is_current && <span style={{ fontSize: '0.65rem', color: '#a855f7' }}>(Current)</span>}
              </div>
              <div style={{ flexGrow: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${s.match_score}%`, height: '100%', background: s.match_score >= 70 ? '#10b981' : s.match_score >= 40 ? '#a855f7' : '#64748b', borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ width: 50, textAlign: 'right', fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{s.match_score}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', width: 110 }}>{s.recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Clubs ──────────────────────────────────────────────────────── */}
        <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={Users} title="Clubs For You" subtitle="Matched to your skills & interests" color="#0ea5e9" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {clubs.length === 0 ? <EmptyState text="No clubs matched your profile." /> :
              clubs.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(14,165,233,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14,165,233,0.1)' }}>
                  <div style={{ flexGrow: 1, marginRight: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{c.club_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{c.description?.slice(0, 80)}...</div>
                  </div>
                  <ScoreBadge score={c.match_score} label={c.match_label} color="#0ea5e9" />
                </div>
              ))}
          </div>
        </div>

        {/* ── Open Electives ──────────────────────────────────────────────── */}
        <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={BookOpen} title="Open Electives" subtitle="Courses aligned with your career path" color="#10b981" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {open_electives.length === 0 ? <EmptyState text="No electives matched your profile." /> :
              open_electives.map((oe, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{oe.course}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>{oe.offered_by}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                      <ScoreBadge score={oe.match_score} label={oe.match_label} color="#10b981" />
                      <span style={{ fontSize: '0.65rem', color: oe.has_vacancy ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                        {oe.has_vacancy ? '● Seats Available' : '● Full'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Hackathons ──────────────────────────────────────────────────── */}
        <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={Zap} title="Hackathons" subtitle="Competitions matching your tech stack" color="#f59e0b" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {hackList.length === 0 ? <EmptyState text="No hackathons matched your profile." /> :
              hackList.slice(0, 4).map((h, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', flexGrow: 1 }}>{h.hackathon_name}</div>
                    <ScoreBadge score={h.match_score} label={h.match_label} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    by {h.organizer} · Deadline: {h.registration_deadline || 'TBD'}
                  </div>
                  {h.link && (
                    <a href={h.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                      Register <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* ── Books ──────────────────────────────────────────────────────── */}
        <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
          <SectionHeader icon={BookOpen} title="Recommended Books" subtitle="Based on content similarity + popularity" color="#818cf8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {books.length === 0 ? <EmptyState text="No books matched your profile." /> :
              books.slice(0, 4).map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ flexGrow: 1, marginRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', lineHeight: 1.3 }}>{b.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{b.author}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                    <ScoreBadge score={b.match_score} label={b.match_label} color="#818cf8" />
                    <span style={{ fontSize: '0.65rem', color: b.available ? '#10b981' : '#64748b', fontWeight: 700 }}>
                      {b.available ? '● Available' : '● Checked Out'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Cafe Picks ─────────────────────────────────────────────────────── */}
      <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
        <SectionHeader icon={Coffee} title="Cafe Picks For You" subtitle="Based on your favourites + popular combos" color="#ec4899" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Top Picks */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Picks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {top_picks.length === 0 ? <EmptyState text="No picks available." /> :
                top_picks.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(236,72,153,0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{item.item_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{item.category}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#ec4899', fontSize: '0.95rem' }}>₹{item.price}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Combos */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meal Combos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {combos.length === 0 ? <EmptyState text="No combos available." /> :
                combos.map((combo, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'rgba(236,72,153,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236,72,153,0.15)' }}>
                    <div style={{ fontWeight: 700, color: '#ec4899', fontSize: '0.82rem', marginBottom: '0.35rem' }}>{combo.combo_type}</div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{combo.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      Total: <span style={{ color: '#fff', fontWeight: 700 }}>₹{combo.total_price}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Recommendations;
