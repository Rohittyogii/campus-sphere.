import React, { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, MapPin, Activity, Award, CheckCircle, XCircle, GraduationCap, Target, ChevronRight, Bell, ArrowRight, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
const campus1 = '/assets/campus1.png';
const campus2 = '/assets/campus2.png';
const campus3 = '/assets/campus3.png';
const universityHero = '/assets/university_hero.jpg';
const eventSports = '/assets/event_sports.png';
const eventDance = '/assets/event_dance.png';
const eventPainting = '/assets/event_painting.png';
const eventEntertainment = '/assets/event_entertainment.png';

// ── Timetable helpers ──────────────────────────────────────────────
const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TT_START = 8;   // 8 AM
const TT_END = 16;  // 4 PM
const PX_MIN = 1.4; // px per minute

const TT_TYPE_COLORS = {
  lecture: { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' },
  lab: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  elective: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
  tutorial: { bg: '#dbeafe', border: '#2563eb', text: '#1e3a8a' },
};
const COURSE_PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#f43f5e', '#14b8a6', '#a855f7', '#f97316'];
const ttCourseColor = (code) => { let h = 0; for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % COURSE_PALETTE.length; return COURSE_PALETTE[h]; };
const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtMins = (m) => { const h = Math.floor(m / 60); const mm = m % 60; const ap = h >= 12 ? 'PM' : 'AM'; return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(mm).padStart(2, '0')} ${ap}`; };
const getTodayName = () => TT_DAYS[Math.max(0, new Date().getDay() - 1)] || 'Monday';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '⛅' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌙' };
  return { text: 'Good Night', emoji: '🌙' };
};

const CircleRing = ({ progress, color, size = 94 }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, progress ?? 75));
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${color}33)` }}>
      {/* Background track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={6} />
      {/* Progress track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </svg>
  );
};

const StatCard = ({ label, value, sub, color = '#6366f1' }) => (
  <div style={{
    background: `${color}05`,
    borderRadius: '24px',
    border: `1px solid ${color}15`,
    padding: '1.5rem',
    flex: 1,
    minWidth: '200px',
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.borderColor = `${color}33`;
      e.currentTarget.style.boxShadow = `0 12px 30px ${color}15`;
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.background = `${color}05`;
      e.currentTarget.style.borderColor = `${color}15`;
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {/* Subtle corner accent */}
    <div style={{
      position: 'absolute', top: -15, left: -15,
      width: 60, height: 60,
      background: color, opacity: 0.05,
      borderRadius: '50%', filter: 'blur(20px)'
    }} />

    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
        {sub}
      </div>
    </div>

    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: '2.5rem', fontWeight: 900, color: '#0f172a',
        fontFamily: "'Space Grotesk', sans-serif",
        lineHeight: 1,
        letterSpacing: '-0.03em'
      }}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
    </div>
  </div>
);

const EventCard = ({ photo, accentColor, category, title, date, seats, description }) => (
  <div
    style={{
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '260px',
      cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      transition: 'transform 0.35s cubic-bezier(.22,.68,0,1.2), box-shadow 0.35s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
      e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.22)`;
      e.currentTarget.querySelector('.ev-img').style.transform = 'scale(1.06)';
      e.currentTarget.querySelector('.ev-register').style.opacity = '1';
      e.currentTarget.querySelector('.ev-register').style.transform = 'translateY(0)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
      e.currentTarget.querySelector('.ev-img').style.transform = 'scale(1.0)';
      e.currentTarget.querySelector('.ev-register').style.opacity = '0';
      e.currentTarget.querySelector('.ev-register').style.transform = 'translateY(8px)';
    }}
  >
    {/* Photo */}
    <img
      className="ev-img"
      src={photo}
      alt={title}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center',
        transition: 'transform 0.5s ease',
      }}
    />

    {/* Gradient overlay — bottom-heavy so photo stays visible */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.05) 100%)',
      pointerEvents: 'none',
    }} />



    {/* Bottom content */}
    <div style={{ position: 'relative', zIndex: 1, padding: '1.25rem 1.25rem 1rem' }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem', lineHeight: 1.25, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.65rem', fontWeight: 500 }}>
        {description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>📅</span> {date}
        </div>
        {/* Register button — fades in on hover */}
        <div
          className="ev-register"
          style={{
            background: accentColor,
            color: '#fff',
            fontSize: '0.65rem', fontWeight: 700,
            padding: '0.35rem 0.9rem',
            borderRadius: '99px',
            opacity: 0,
            transform: 'translateY(8px)',
            transition: 'opacity 0.25s, transform 0.25s',
            boxShadow: `0 2px 10px ${accentColor}88`,
            letterSpacing: '0.04em',
          }}
        >
          Register →
        </div>
      </div>
    </div>
  </div>
);

const AnnouncementItem = ({ title, description, time, color }) => (
  <div style={{
    padding: '1.25rem',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  }}
    onMouseOver={e => {
      e.currentTarget.style.borderColor = '#cbd5e1';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.borderColor = '#f1f5f9';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
    }}
  >
    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        marginTop: '0.4rem',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, marginBottom: '0.6rem' }}>
          {description}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
          {time}
        </div>
      </div>
    </div>
  </div>
);

const fmtTime = (s) => {
  if (!s) return '';
  const [h, m] = s.split(':').map(Number);
  return `${h > 12 ? h - 12 : (h === 0 ? 12 : h)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const Overview = ({ profile }) => {
  const [timetable, setTimetable] = useState([]);
  const [activity, setActivity] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [ttView, setTtView] = useState('week');
  const [ttDayIdx, setTtDayIdx] = useState(() => Math.max(0, Math.min(new Date().getDay() - 1, 5)));
  const [announcements, setAnnouncements] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '', type: 'info' });
  const [isPosting, setIsPosting] = useState(false);

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.description) return;
    setIsPosting(true);
    try {
      const res = await api.post('/announcements/', newAnnouncement);
      setAnnouncements(prev => [res.data, ...prev]);
      setNewAnnouncement({ title: '', description: '', type: 'info' });
      setShowPostForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to post announcement");
    } finally {
      setIsPosting(false);
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useEffect(() => {
    api.get('/student/timetable').then(res => setTimetable(res.data)).catch(() => { });
    api.get('/profile/activity').then(res => setActivity(res.data)).catch(() => { });
    api.get('/announcements/').then(res => setAnnouncements(res.data)).catch(() => { });
    setTimeout(() => setMounted(true), 60);
  }, []);


  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const attendPct = activity
    ? (activity.attendance_total > 0 ? Math.round((activity.attendance_present / activity.attendance_total) * 100) : 0)
    : 0;
  const cgpa = activity?.cgpa ?? '—';
  const booksIssued = activity?.books_issued ?? '—';
  const firstName = profile?.student_name?.split(' ')[0] || 'Student';

  const partnerRows = [campus1, campus2, campus3];

  return (
    <>
      {/* Marquee keyframe injected once */}
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partner-marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll 28s linear infinite;
        }
        .partner-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .greeting-section {
          animation: fadeSlideIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}</style>

      <div style={{
        background: '#FFFFFF',
        minHeight: '100vh',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(10px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}>

        <div style={{ padding: '0.75rem 1.75rem 2.5rem', maxWidth: '1600px', margin: '0 auto' }}>

          {/* Header Layout */}
          <div style={{ marginBottom: '1.5rem' }}>

            {/* Left Column - Main Content */}
            <div className="greeting-section">
              {/* Greeting */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.4rem', fontWeight: 800, color: '#231F20', margin: 0, letterSpacing: '-0.02em' }}>
                    {greeting.text}, {firstName}!
                  </h1>
                </div>
                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0, fontWeight: 500 }}>
                  Here's what's happening at NCU today
                </p>
              </div>

              {/* ── Hero Banner ─────────────────────────────────────────── */}
              <div style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                marginBottom: '1.25rem',
                minHeight: '260px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              }}>
                {/* Background photo */}
                <img
                  src={universityHero}
                  alt="NorthCap University Campus"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 30%',
                  }}
                />
                {/* Official NCU Maroon Scrim */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(139, 29, 29, 0.85) 0%, rgba(139, 29, 29, 0.4) 60%, transparent 100%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }} />

                {/* Banner Content */}
                <div style={{ position: 'relative', zIndex: 1, padding: '2.8rem 2.5rem 3.5rem' }}>
                  <h2 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    margin: '0 0 0.75rem 0',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    textShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  }}>
                    A Beautiful Campus Awaits
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    color: 'rgba(255,255,255,0.88)',
                    margin: 0,
                    fontWeight: 500,
                    maxWidth: '420px',
                    lineHeight: 1.55,
                  }}>
                    World-Class Infrastructure &amp; Serene Environment
                  </p>
                </div>
              </div>

              {/* ── Partner Logos Marquee ───────────────────────────────── */}
              <div style={{
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #eef2f7',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                marginBottom: '1.75rem',
                padding: '0.6rem 0',
              }}>
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                  {/* Left fade mask */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
                    background: 'linear-gradient(to right, #fff 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  {/* Right fade mask */}
                  <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
                    background: 'linear-gradient(to left, #fff 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  <div className="partner-marquee-track">
                    {/* Duplicate for seamless loop */}
                    {[...partnerRows, ...partnerRows].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Partner logos ${(i % 3) + 1}`}
                        style={{
                          height: '72px',
                          width: 'auto',
                          objectFit: 'contain',
                          flexShrink: 0,
                          marginRight: '2rem',
                          filter: 'grayscale(15%)',
                          opacity: 0.9,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Architectural Stat Bar */}
          {/* Solid NCU Branded Bento Blocks */}
          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '3.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {[
              { label: 'GPA', value: cgpa !== '—' ? parseFloat(cgpa).toFixed(2) : '8.49', sub: 'Current Semester', color: '#F58220', text: '#fff' },
              { label: 'Attendance', value: `${attendPct}%`, sub: 'Overall Attendance', color: '#8B1D1D', text: '#fff' },
              { label: 'Books Issued', value: booksIssued !== '—' ? booksIssued : '3', sub: 'Library Loans', color: '#231F20', text: '#fff' },
              { label: 'Campus Activity', value: activity?.attendance_present ?? '62', sub: `of ${activity?.attendance_total ?? 77} classes`, color: '#FFFFFF', text: '#231F20', border: '1px solid #e2e8f0' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: stat.color,
                color: stat.text,
                borderRadius: '24px',
                padding: '1.75rem',
                flex: 1,
                minWidth: '220px',
                boxShadow: '0 4px 25px rgba(0,0,0,0.08)',
                border: stat.border || 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.15)`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 25px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.85, marginBottom: '0.75rem' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, marginBottom: '0.6rem' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75, fontWeight: 500 }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>


          {/* ── Timetable + Announcements side by side ───────── */}
          {(() => {
            const ttGridH = (TT_END - TT_START) * 60 * PX_MIN;
            const visibleDays = ttView === 'week' ? TT_DAYS : [TT_DAYS[ttDayIdx]];
            const entriesByDay = (day) => timetable.filter(e => e.day?.toLowerCase() === day.toLowerCase()).sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
            const timeLabels = Array.from({ length: TT_END - TT_START + 1 }, (_, i) => (TT_START + i) * 60);
            const typeCounts = timetable.reduce((a, e) => { const t = e.type?.toLowerCase() || 'other'; a[t] = (a[t] || 0) + 1; return a; }, {});

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>

                {/* Timetable */}
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: '0.3rem' }}>
                        {ttView === 'day' ? TT_DAYS[ttDayIdx] : 'Weekly Schedule'}
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Your class timetable</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {ttView === 'day' && (
                        <>
                          <button onClick={() => setTtDayIdx(i => Math.max(0, i - 1))} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 9px', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={15} /></button>
                          <button onClick={() => setTtDayIdx(i => Math.min(5, i + 1))} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 9px', cursor: 'pointer', display: 'flex' }}><ChevronRight size={15} /></button>
                        </>
                      )}
                      <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                        {['day', 'week'].map(v => (
                          <button key={v} onClick={() => setTtView(v)} style={{ padding: '5px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: ttView === v ? '#6366f1' : 'transparent', color: ttView === v ? '#fff' : '#64748b', transition: 'all 0.2s' }}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pills */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total Classes', value: timetable.length, color: '#6366f1', bg: '#eef2ff' },
                      { label: 'Lectures', value: typeCounts.lecture || 0, color: '#7c3aed', bg: '#ede9fe' },
                      { label: 'Labs', value: typeCounts.lab || 0, color: '#d97706', bg: '#fef3c7' },
                      { label: 'Electives', value: typeCounts.elective || 0, color: '#16a34a', bg: '#dcfce7' },
                    ].map(p => (
                      <div key={p.label} style={{ background: p.bg, borderRadius: '10px', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: p.color }}>{p.value}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>{p.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: `52px repeat(${visibleDays.length}, 1fr)`, borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                      <div />
                      {visibleDays.map(day => {
                        const cnt = entriesByDay(day).length;
                        const isToday = day === getTodayName();
                        return (
                          <div key={day} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isToday ? '#6366f1' : '#94a3b8', marginBottom: '0.2rem' }}>{day.slice(0, 3)}</div>
                            {cnt > 0 && <div style={{ display: 'inline-block', background: isToday ? '#6366f1' : '#f1f5f9', color: isToday ? '#fff' : '#64748b', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '99px' }}>{cnt} class{cnt !== 1 ? 'es' : ''}</div>}
                          </div>
                        );
                      })}
                    </div>
                    {/* Time body */}
                    <div style={{ display: 'grid', gridTemplateColumns: `52px repeat(${visibleDays.length}, 1fr)`, overflowY: 'auto', maxHeight: '520px' }}>
                      {/* Time labels */}
                      <div style={{ position: 'relative', height: ttGridH, borderRight: '1px solid #f1f5f9' }}>
                        {timeLabels.map(m => (
                          <div key={m} style={{ position: 'absolute', top: (m - TT_START * 60) * PX_MIN - 8, right: 4, fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtMins(m)}</div>
                        ))}
                      </div>
                      {/* Day columns */}
                      {visibleDays.map(day => {
                        const entries = entriesByDay(day);
                        const isToday = day === getTodayName();
                        return (
                          <div key={day} style={{ position: 'relative', height: ttGridH, borderLeft: '1px solid #f1f5f9', background: isToday ? 'rgba(99,102,241,0.015)' : 'transparent' }}>
                            {timeLabels.map(m => <div key={m} style={{ position: 'absolute', top: (m - TT_START * 60) * PX_MIN, left: 0, right: 0, borderTop: '1px solid #f8fafc' }} />)}
                            {entries.map((e, i) => {
                              const top = (toMins(e.start_time) - TT_START * 60) * PX_MIN;
                              const height = Math.max((toMins(e.end_time) - toMins(e.start_time)) * PX_MIN - 4, 28);
                              const accent = ttCourseColor(e.course_code || '?');
                              const colors = TT_TYPE_COLORS[e.type?.toLowerCase()] || TT_TYPE_COLORS.lecture;
                              return (
                                <div key={e.id ?? i} style={{ position: 'absolute', top, left: 3, right: 3, height, background: colors.bg, border: `1.5px solid ${accent}`, borderLeft: `4px solid ${accent}`, borderRadius: '7px', padding: '5px 7px', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s', zIndex: 1 }}
                                  onMouseOver={ev => ev.currentTarget.style.boxShadow = `0 3px 10px ${accent}44`}
                                  onMouseOut={ev => ev.currentTarget.style.boxShadow = 'none'}
                                >
                                  <div style={{ fontWeight: 700, fontSize: '0.7rem', color: accent, lineHeight: 1.2 }}>{e.course_code}</div>
                                  {height > 40 && <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{fmtMins(toMins(e.start_time))} – {fmtMins(toMins(e.end_time))}</div>}
                                  {height > 55 && e.room_no && <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Room {e.room_no}</div>}
                                  {height > 38 && <div style={{ position: 'absolute', bottom: 4, right: 5, background: accent, color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase' }}>{e.type || 'Class'}</div>}
                                </div>
                              );
                            })}
                            {entries.length === 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '0.68rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>No classes</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>{/* end timetable col */}

                {/* Announcements column */}
                <div style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
                  padding: '1.5rem',
                  position: 'sticky',
                  top: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bell size={15} color="#6366f1" />
                      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Announcements</h2>
                    </div>
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => setShowPostForm(!showPostForm)}
                        style={{ background: '#6366f115', border: 'none', color: '#6366f1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {showPostForm ? 'Cancel' : '+ Post'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Latest updates and notices</p>

                  {showPostForm && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                      <input
                        placeholder="Announcement Title"
                        value={newAnnouncement.title}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                      />
                      <textarea
                        placeholder="Description..."
                        value={newAnnouncement.description}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.5rem', fontSize: '0.8rem', minHeight: '60px' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {['info', 'warning', 'success'].map(t => (
                          <button
                            key={t}
                            onClick={() => setNewAnnouncement({ ...newAnnouncement, type: t })}
                            style={{
                              flex: 1, padding: '4px', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid',
                              background: newAnnouncement.type === t ? '#6366f1' : '#fff',
                              color: newAnnouncement.type === t ? '#fff' : '#64748b',
                              borderColor: newAnnouncement.type === t ? '#6366f1' : '#e2e8f0'
                            }}
                          >
                            {t.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handlePostAnnouncement}
                        disabled={isPosting || !newAnnouncement.title || !newAnnouncement.description}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: isPosting ? 0.7 : 1 }}
                      >
                        {isPosting ? 'Posting...' : 'Post Now'}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {announcements.length > 0 ? (
                      announcements.map((a, i) => (
                        <div key={a.id || i} style={{ padding: '0.85rem 0.9rem', borderRadius: '10px', background: '#fafbfc', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: a.type === 'warning' ? '#ef4444' : a.type === 'success' ? '#10b981' : '#3b82f6',
                              flexShrink: 0, marginTop: 5
                            }} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', marginBottom: '0.2rem', lineHeight: 1.3 }}>{a.title}</div>
                              <div style={{ fontSize: '0.71rem', color: '#64748b', lineHeight: 1.4, marginBottom: '0.35rem' }}>{a.description}</div>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>{timeAgo(a.created_at)}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>
                        No recent announcements.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Featured Events */}
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: '0.3rem' }}>
                  Featured Events
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Live from campus — register before seats fill up</p>
              </div>
              <a href="#" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#eef2ff', padding: '0.45rem 1rem', borderRadius: '99px', transition: 'background 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#eef2ff'; }}
              >
                View All <ChevronRight size={14} />
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <EventCard
                photo={eventSports}
                accentColor="#f59e0b"
                category="⚽ Sports"
                title="Inter-College Basketball Championship"
                description="Women's basketball tournament — cheer for NCU!"
                date="May 10, 2026 · 10:00 AM"
                seats="200"
              />
              <EventCard
                photo={eventDance}
                accentColor="#ec4899"
                category="💃 Cultural"
                title="Fiesta Dance Showcase"
                description="Annual group dance competition on the main stage"
                date="May 14, 2026 · 5:30 PM"
                seats="350"
              />
              <EventCard
                photo={eventPainting}
                accentColor="#8b5cf6"
                category="🎨 Art"
                title="Canvas & Colors Exhibition"
                description="Student art showcase — live portrait & freestyle sessions"
                date="May 17, 2026 · 11:00 AM"
                seats="80"
              />
              <EventCard
                photo={eventEntertainment}
                accentColor="#0ea5e9"
                category="🎭 Drama"
                title="Annual Theatre Night"
                description="Student drama society presents the spring play"
                date="May 20, 2026 · 6:00 PM"
                seats="500"
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Overview;
