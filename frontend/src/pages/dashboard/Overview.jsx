import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Calendar, Clock, BookOpen, MapPin, Zap, ArrowUpRight,
  TrendingUp, CheckCircle, XCircle, GraduationCap,
  Sun, Moon, CloudSun, ChevronRight, Activity, Award,
  BarChart3, Target, Users, Flame
} from 'lucide-react';

/* ─── Time greeting ──────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sun, emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: CloudSun, emoji: '⛅' };
  return { text: 'Good Evening', icon: Moon, emoji: '🌙' };
};

/* ─── Mini bar chart component ───────────────────────────────────── */
const MiniBarChart = ({ data, color }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '48px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '18px',
            height: `${Math.max((d.value / max) * 42, 4)}px`,
            borderRadius: '4px 4px 2px 2px',
            background: d.active ? color : '#e5e7eb',
            transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          <span style={{ fontSize: '0.55rem', color: '#9ca3af', fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Donut ring ─────────────────────────────────────────────────── */
const DonutRing = ({ value, size = 64, stroke = 5, color = '#4338ca', bgColor = '#f3f4f6' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
    </svg>
  );
};

/* ─── Card wrapper ───────────────────────────────────────────────── */
const Card = ({ children, style = {}, hover = true, ...rest }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #eaedf1',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      transition: 'all 0.25s ease',
      ...style,
    }}
    onMouseOver={hover ? (e) => {
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    } : undefined}
    onMouseOut={hover ? (e) => {
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
      e.currentTarget.style.transform = 'none';
    } : undefined}
    {...rest}
  >
    {children}
  </div>
);

/* ─── Section Label ──────────────────────────────────────────────── */
const SectionLabel = ({ icon: Icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
    {Icon && <Icon size={13} color="#9ca3af" />}
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#9ca3af',
    }}>{text}</span>
  </div>
);

/* ═══ OVERVIEW ═══ */
const Overview = ({ profile }) => {
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    api.get('/student/timetable').then(res => setTimetable(res.data));
    api.get('/student/attendance').then(res => setAttendance(res.data.slice(0, 6)));
    setTimeout(() => setMounted(true), 60);
  }, []);

  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.length - presentCount;
  const attendPct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 100;
  const firstName = profile?.student_name?.split(' ')[0] || 'Student';

  /* Next class */
  const now = new Date();
  const nextClass = timetable.find(t => {
    if (!t.start_time) return false;
    const [h, m] = t.start_time.split(':').map(Number);
    const ct = new Date(); ct.setHours(h, m, 0, 0);
    return ct > now;
  });

  const fmtTime = (s) => {
    if (!s) return '';
    const [h, m] = s.split(':').map(Number);
    return `${h > 12 ? h - 12 : (h === 0 ? 12 : h)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  /* Fake weekly study data for the mini chart */
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S'];
  const dayOfWeek = today.getDay(); // 0=Sun
  const barData = weekDays.map((label, i) => ({
    label,
    value: Math.floor(Math.random() * 8) + 2,
    active: i < (dayOfWeek === 0 ? 6 : dayOfWeek),
  }));

  return (
    <div style={{
      background: '#f4f5f7',
      minHeight: '100vh',
      padding: '1.75rem 2.25rem 3rem',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(8px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{greeting.emoji}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af' }}>{greeting.text}</span>
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.9rem', fontWeight: 700, color: '#111827',
              letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2,
            }}>
              {firstName}'s Dashboard
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0.3rem 0 0', fontWeight: 500 }}>
              {dateStr}
            </p>
          </div>

          {/* Quick stats pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem',
              background: '#fff', border: '1px solid #eaedf1', borderRadius: '99px',
              fontSize: '0.78rem', fontWeight: 600, color: '#374151',
            }}>
              <BookOpen size={14} color="#4338ca" /> {timetable.length} Classes
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem',
              background: attendPct >= 75 ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${attendPct >= 75 ? '#a7f3d0' : '#fecdd3'}`,
              borderRadius: '99px',
              fontSize: '0.78rem', fontWeight: 600,
              color: attendPct >= 75 ? '#059669' : '#e11d48',
            }}>
              <Target size={14} /> {attendPct}% Attendance
            </div>
          </div>
        </div>

        {/* ═══ BENTO GRID ═══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '1.25rem',
        }}>

          {/* ─── 1. Schedule (spans 2 cols, 2 rows) ───────────────────── */}
          <Card style={{ gridColumn: '1 / 3', gridRow: '1 / 3', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <SectionLabel icon={Calendar} text="Today's Schedule" />
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0,
                }}>
                  {timetable.length} Sessions Scheduled
                </h2>
              </div>
            </div>

            {timetable.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af',
                borderRadius: '12px', background: '#fafbfc',
              }}>
                <Calendar size={36} color="#d1d5db" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 600, color: '#6b7280', margin: '0 0 0.25rem' }}>No classes today</p>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>Enjoy your free day!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '480px', overflowY: 'auto' }}>
                {timetable.map((t, i) => {
                  const isLab = t.type?.toLowerCase().includes('lab');
                  const isNext = nextClass && t.id === nextClass.id;

                  return (
                    <div key={t.id || i} style={{
                      display: 'grid',
                      gridTemplateColumns: '76px 1fr auto',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: isNext ? '#eef2ff' : '#fafbfc',
                      border: isNext ? '1px solid #c7d2fe' : '1px solid transparent',
                      transition: 'background 0.15s',
                      cursor: 'default',
                    }}
                      onMouseOver={e => { if (!isNext) e.currentTarget.style.background = '#f3f4f6'; }}
                      onMouseOut={e => { if (!isNext) e.currentTarget.style.background = '#fafbfc'; }}
                    >
                      {/* Time pill */}
                      <div style={{
                        textAlign: 'center',
                        padding: '0.35rem 0',
                        borderRadius: '6px',
                        background: isNext ? '#4338ca' : '#fff',
                        color: isNext ? '#fff' : '#374151',
                        border: isNext ? 'none' : '1px solid #e5e7eb',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}>
                        {fmtTime(t.start_time)}
                      </div>

                      {/* Course info */}
                      <div>
                        <div style={{
                          fontWeight: 700, color: '#111827', fontSize: '0.88rem',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                          {t.course_code}
                          {isNext && (
                            <span style={{
                              fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                              background: '#4338ca', color: '#fff',
                              padding: '0.1rem 0.4rem', borderRadius: '3px',
                              animation: 'pulse 2s infinite',
                            }}>NEXT</span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.72rem', color: '#9ca3af',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1px',
                        }}>
                          <MapPin size={10} /> Room {t.room_no}
                        </div>
                      </div>

                      {/* Type badge */}
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem', borderRadius: '5px',
                        background: isLab ? '#fef2f2' : '#eef2ff',
                        color: isLab ? '#dc2626' : '#4338ca',
                        letterSpacing: '0.03em',
                      }}>
                        {t.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ─── 2. Attendance Donut (top-right) ──────────────────────── */}
          <Card style={{ padding: '1.5rem' }}>
            <SectionLabel icon={Activity} text="Attendance" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <DonutRing
                  value={attendPct}
                  size={72}
                  stroke={6}
                  color={attendPct >= 75 ? '#059669' : '#e11d48'}
                  bgColor="#f3f4f6"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {attendPct}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {presentCount}/{attendance.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Sessions attended</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  fontSize: '0.68rem', fontWeight: 600,
                  color: attendPct >= 75 ? '#059669' : '#e11d48',
                  background: attendPct >= 75 ? '#ecfdf5' : '#fff1f2',
                  padding: '0.2rem 0.5rem', borderRadius: '4px',
                }}>
                  {attendPct >= 75 ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {attendPct >= 75 ? 'Above 75%' : 'Below 75%'}
                </div>
              </div>
            </div>
          </Card>

          {/* ─── 3. Quick info card (bottom-right) ────────────────────── */}
          <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <SectionLabel icon={GraduationCap} text="Profile" />
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 700, color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }} title={profile?.branch}>
                  {profile?.branch || 'General'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                  {profile?.roll_no}
                </div>
              </div>
            </div>

            {/* Next class mini card */}
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: nextClass
                ? 'linear-gradient(135deg, #4338ca, #6d28d9)'
                : 'linear-gradient(135deg, #059669, #10b981)',
              color: '#fff',
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                {nextClass ? 'Up Next' : 'Status'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.15rem' }}>
                {nextClass ? nextClass.course_code : 'All Done! 🎉'}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.1rem' }}>
                {nextClass ? `${fmtTime(nextClass.start_time)} · Room ${nextClass.room_no}` : 'No more classes today'}
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ BOTTOM ROW: Attendance Logs + Activity ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>

          {/* Recent Attendance */}
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <SectionLabel icon={BarChart3} text="Logs" />
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0,
                }}>
                  Recent Attendance
                </h3>
              </div>
              <button style={{
                background: 'none', border: 'none', color: '#4338ca',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.2rem',
              }}>
                View All <ChevronRight size={14} />
              </button>
            </div>

            {attendance.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>
                No records yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attendance.map((a, i) => {
                  const isPresent = a.status === 'Present';
                  const dateObj = new Date(a.lecture_date);

                  return (
                    <div key={a.id || i} style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr auto',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.5rem',
                      borderRadius: '8px',
                      transition: 'background 0.12s',
                    }}
                      onMouseOver={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: isPresent ? '#ecfdf5' : '#fef2f2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isPresent
                          ? <CheckCircle size={14} color="#059669" />
                          : <XCircle size={14} color="#dc2626" />
                        }
                      </div>

                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.82rem' }}>
                          {a.course_code}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                          {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700,
                        padding: '0.18rem 0.5rem', borderRadius: '4px',
                        background: isPresent ? '#059669' : '#dc2626',
                        color: '#fff',
                      }}>
                        {a.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Weekly Activity */}
          <Card style={{ padding: '1.5rem' }}>
            <SectionLabel icon={Flame} text="Weekly Activity" />
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem 0',
            }}>
              Campus Engagement
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#fafbfc',
                border: '1px solid #eaedf1',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={12} color="#4338ca" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>Classes</span>
                </div>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 800, color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {timetable.length}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>today</div>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#fafbfc',
                border: '1px solid #eaedf1',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Award size={12} color="#059669" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>Streak</span>
                </div>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 800, color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {presentCount}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>days present</div>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#fafbfc',
                border: '1px solid #eaedf1',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={12} color="#d97706" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>Absent</span>
                </div>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 800, color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {absentCount}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>sessions</div>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                background: '#fafbfc',
                border: '1px solid #eaedf1',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={12} color="#db2777" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>Dept</span>
                </div>
                <div style={{
                  fontSize: '0.9rem', fontWeight: 800, color: '#111827',
                  fontFamily: "'Space Grotesk', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }} title={profile?.branch}>
                  {profile?.branch || '—'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>branch</div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Overview;
