import React, { useEffect, useState } from 'react';
import { Calendar, Zap, ExternalLink } from 'lucide-react';
import api from '../../services/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [tab, setTab] = useState('events');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/').then(res => {
      setEvents(res.data.events || []);
      setHackathons(res.data.hackathons || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const currentList = tab === 'events' ? events : hackathons;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📅 Events & Hackathons</h1>
        <p>{events.length} events and {hackathons.length} hackathons listed on campus.</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[{ key: 'events', label: '🎪 Campus Events', count: events.length },
          { key: 'hackathons', label: '⚡ Hackathons', count: hackathons.length }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: tab === t.key ? 'var(--color-accent-primary)' : 'var(--color-border)',
              background: tab === t.key ? 'var(--color-accent-primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            {t.label} <span style={{ opacity: 0.7, marginLeft: '0.25rem' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '3rem' }}>Loading...</div>
      ) : tab === 'events' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {events.map(event => (
            <div key={event.eventid} className="bento-card glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={18} color="#818cf8" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '0.35rem' }}>{event.event_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{event.department}</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={12} color="#818cf8" />
                <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {hackathons.map(hack => (
            <div key={hack.hackathon_id} className="bento-card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{hack.hackathon_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>by {hack.organizer}</div>
                </div>
              </div>

              {hack.eligibility && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', borderLeft: '2px solid rgba(245,158,11,0.4)', paddingLeft: '0.75rem' }}>
                  {hack.eligibility}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(244,63,94,0.1)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700 }}>
                    Deadline: {hack.registration_deadline ? new Date(hack.registration_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                {hack.link && (
                  <a href={hack.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                    Register <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
