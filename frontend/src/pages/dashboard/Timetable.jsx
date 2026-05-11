import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const START_HOUR = 8;   // 8:00 AM
const END_HOUR = 16;    // 4:00 PM
const PX_PER_MIN = 1.4; // pixels per minute

const TYPE_COLORS = {
  lecture: { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6', badge: '#7c3aed' },
  lab:     { bg: '#fef3c7', border: '#d97706', text: '#92400e', badge: '#d97706' },
  elective:{ bg: '#dcfce7', border: '#16a34a', text: '#14532d', badge: '#16a34a' },
  tutorial:{ bg: '#dbeafe', border: '#2563eb', text: '#1e3a8a', badge: '#2563eb' },
};

const COURSE_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#0ea5e9','#f43f5e','#14b8a6','#a855f7','#f97316',
];

const courseColor = (code) => {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % COURSE_PALETTE.length;
  return COURSE_PALETTE[h];
};

// "HH:MM:SS" → minutes since midnight
const toMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// minutes → "h:MM AM/PM"
const fmtTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getCurrentDay = () => {
  const d = new Date().getDay(); // 0=Sun
  return DAYS[d === 0 ? 0 : d - 1] || 'Monday';
};

const TimeLabel = ({ mins }) => (
  <div style={{
    position: 'absolute',
    top: (mins - START_HOUR * 60) * PX_PER_MIN - 9,
    right: 0,
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    textAlign: 'right',
  }}>
    {fmtTime(mins)}
  </div>
);

const ClassCard = ({ entry, dayWidth }) => {
  const startMins = toMins(entry.start_time);
  const endMins = toMins(entry.end_time);
  const top = (startMins - START_HOUR * 60) * PX_PER_MIN;
  const height = Math.max((endMins - startMins) * PX_PER_MIN - 4, 30);
  const colors = TYPE_COLORS[entry.type?.toLowerCase()] || TYPE_COLORS.lecture;
  const accent = courseColor(entry.course_code || '?');

  return (
    <div style={{
      position: 'absolute',
      top,
      left: 4,
      right: 4,
      height,
      background: colors.bg,
      border: `1.5px solid ${accent}`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: '8px',
      padding: '6px 8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s, transform 0.2s',
      zIndex: 1,
    }}
      onMouseOver={e => {
        e.currentTarget.style.boxShadow = `0 4px 14px ${accent}33`;
        e.currentTarget.style.transform = 'scale(1.01)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.72rem', color: accent, marginBottom: 2, lineHeight: 1.2 }}>
        {entry.course_code}
      </div>
      {height > 42 && (
        <div style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.3 }}>
          {fmtTime(startMins)} – {fmtTime(endMins)}
        </div>
      )}
      {height > 60 && entry.room_no && (
        <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginTop: 2 }}>
          Room {entry.room_no}
        </div>
      )}
      {height > 75 && entry.faculty_id && (
        <div style={{ fontSize: '0.63rem', color: '#94a3b8' }}>
          {entry.faculty_id}
        </div>
      )}
      {height > 40 && (
        <div style={{
          position: 'absolute', bottom: 5, right: 6,
          background: accent,
          color: '#fff',
          fontSize: '0.58rem',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {entry.type || 'Class'}
        </div>
      )}
    </div>
  );
};

const Timetable = ({ profile }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [dayIndex, setDayIndex] = useState(() => {
    const d = new Date().getDay();
    return Math.max(0, Math.min(d - 1, 5));
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    api.get('/student/timetable')
      .then(res => setTimetable(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => setMounted(true), 60);
  }, []);

  const totalMins = (END_HOUR - START_HOUR) * 60;
  const gridHeight = totalMins * PX_PER_MIN;

  const timeLabels = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    timeLabels.push(h * 60);
  }

  const visibleDays = view === 'week' ? DAYS : [DAYS[dayIndex]];

  const entriesByDay = (day) =>
    timetable
      .filter(e => e.day?.toLowerCase() === day.toLowerCase())
      .sort((a, b) => toMins(a.start_time) - toMins(b.start_time));

  // Stats
  const totalClasses = timetable.length;
  const typeCounts = timetable.reduce((acc, e) => {
    const t = e.type?.toLowerCase() || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{
      background: '#f5f7fb',
      minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(10px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      <div style={{ padding: '1.5rem 1.75rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Top bar ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>

          {/* Day nav (only in Day view) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {view === 'day' && (
              <>
                <button
                  onClick={() => setDayIndex(i => Math.max(0, i - 1))}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', minWidth: 100, textAlign: 'center' }}>
                  {DAYS[dayIndex]}
                </span>
                <button
                  onClick={() => setDayIndex(i => Math.min(5, i + 1))}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {view === 'week' && (
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                Weekly Schedule
              </span>
            )}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {['day', 'week'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 18px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: view === v ? '#6366f1' : 'transparent',
                  color: view === v ? '#fff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary pills ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Classes', value: totalClasses, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Lectures', value: typeCounts.lecture || 0, color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Labs', value: typeCounts.lab || 0, color: '#d97706', bg: '#fef3c7' },
            { label: 'Electives', value: typeCounts.elective || 0, color: '#16a34a', bg: '#dcfce7' },
          ].map(pill => (
            <div key={pill.label} style={{
              background: pill.bg,
              borderRadius: '10px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: pill.color }}>{pill.value}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{pill.label}</span>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ─────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading timetable…</div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: '18px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Day headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${visibleDays.length}, 1fr)`,
              borderBottom: '1px solid #f1f5f9',
              background: '#fafbfc',
            }}>
              <div />
              {visibleDays.map(day => {
                const count = entriesByDay(day).length;
                const isToday = day === getCurrentDay();
                return (
                  <div key={day} style={{
                    padding: '0.85rem 0.5rem',
                    textAlign: 'center',
                    borderLeft: '1px solid #f1f5f9',
                  }}>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isToday ? '#6366f1' : '#94a3b8',
                      marginBottom: '0.2rem',
                    }}>
                      {day.slice(0, 3)}
                    </div>
                    {count > 0 && (
                      <div style={{
                        display: 'inline-block',
                        background: isToday ? '#6366f1' : '#f1f5f9',
                        color: isToday ? '#fff' : '#64748b',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '99px',
                      }}>
                        {count} class{count !== 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${visibleDays.length}, 1fr)`,
              overflowY: 'auto',
              maxHeight: '70vh',
            }}>
              {/* Time labels column */}
              <div style={{ position: 'relative', height: gridHeight, borderRight: '1px solid #f1f5f9' }}>
                {timeLabels.map(mins => <TimeLabel key={mins} mins={mins} />)}
              </div>

              {/* Day columns */}
              {visibleDays.map(day => {
                const entries = entriesByDay(day);
                const isToday = day === getCurrentDay();
                return (
                  <div key={day} style={{
                    position: 'relative',
                    height: gridHeight,
                    borderLeft: '1px solid #f1f5f9',
                    background: isToday ? 'rgba(99,102,241,0.015)' : 'transparent',
                  }}>
                    {/* Hour grid lines */}
                    {timeLabels.map(mins => (
                      <div key={mins} style={{
                        position: 'absolute',
                        top: (mins - START_HOUR * 60) * PX_PER_MIN,
                        left: 0,
                        right: 0,
                        borderTop: '1px solid #f8fafc',
                      }} />
                    ))}

                    {/* Class cards */}
                    {entries.map((entry, i) => (
                      <ClassCard key={entry.id ?? i} entry={entry} />
                    ))}

                    {entries.length === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.7rem',
                        color: '#cbd5e1',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>
                        No classes
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Legend ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_COLORS).map(([type, colors]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: colors.badge }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Timetable;
