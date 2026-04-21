import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, Search,
  Globe, ToggleLeft, ToggleRight, BarChart2,
  CheckCircle, XCircle, Clock, MessageSquare, Loader2
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

// ─── Sidebar tabs ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'stats',       label: 'Platform Stats',   icon: BarChart2 },
  { key: 'modules',     label: 'Module Registry',  icon: ToggleRight },
  { key: 'students',    label: 'Student List',     icon: Users },
  { key: 'lost_found',  label: 'Lost & Found Queue',icon: Search },
  { key: 'iro',         label: 'IRO Applications', icon: Globe },
  { key: 'feedback',    label: 'Feedback Summary',  icon: MessageSquare },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = '#818cf8', icon: Icon }) => (
  <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ text, color }) => (
  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: `${color}22`, color, fontSize: '0.72rem', fontWeight: 700 }}>
    {text}
  </span>
);

const appStatusColor = (s) => s === 'approved' ? '#10b981' : s === 'rejected' ? '#f43f5e' : s === 'waitlisted' ? '#f59e0b' : '#818cf8';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab]           = useState('stats');
  const [stats, setStats]       = useState(null);
  const [modules, setModules]   = useState([]);
  const [students, setStudents] = useState([]);
  const [pending, setPending]   = useState([]);
  const [iroApps, setIroApps]   = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  // Fetch data whenever tab changes
  useEffect(() => {
    setLoading(true);
    const fetchers = {
      stats:      () => api.get('/admin/stats').then(r => setStats(r.data)),
      modules:    () => api.get('/admin/modules').then(r => setModules(r.data)),
      students:   () => api.get('/admin/students?limit=100').then(r => setStudents(r.data)),
      lost_found: () => api.get('/lost-found/pending').then(r => setPending(r.data)),
      iro:        () => api.get('/iro/applications').then(r => setIroApps(r.data)),
      feedback:   () => api.get('/feedback/summary').then(r => setFeedback(r.data)),
    };
    fetchers[tab]?.().catch(console.error).finally(() => setLoading(false));
  }, [tab]);

  const toggleModule = async (id) => {
    await api.put(`/admin/modules/${id}`);
    const r = await api.get('/admin/modules');
    setModules(r.data);
  };

  const moderateLF = async (id, decision) => {
    await api.put(`/lost-found/${id}/approve`, { decision });
    const r = await api.get('/lost-found/pending');
    setPending(r.data);
  };

  const updateIRO = async (id, status) => {
    await api.put(`/iro/applications/${id}`, { status });
    const r = await api.get('/iro/applications');
    setIroApps(r.data);
  };

  const activeTab = TABS.find(t => t.key === tab);

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );

    switch (tab) {
      // ── Platform Stats ────────────────────────────────────────────────────
      case 'stats':
        return stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            <StatCard label="Total Students"         value={stats.total_students}        color="#0ea5e9" icon={Users} />
            <StatCard label="Books in Library"       value={stats.total_books}           color="#818cf8" icon={BarChart2} />
            <StatCard label="Books Issued"           value={stats.total_issued}          color="#f59e0b" icon={BarChart2} />
            <StatCard label="Cafe Items"             value={stats.total_cafe_items}      color="#ec4899" icon={BarChart2} />
            <StatCard label="Campus Clubs"           value={stats.total_clubs}           color="#10b981" icon={Users} />
            <StatCard label="Events"                 value={stats.total_events}          color="#a855f7" icon={BarChart2} />
            <StatCard label="Hackathons"             value={stats.total_hackathons}      color="#f43f5e" icon={BarChart2} />
            <StatCard label="Open Electives"         value={stats.total_open_electives}  color="#0ea5e9" icon={BarChart2} />
            <StatCard label="Lost & Found Reports"   value={stats.total_lost_found_reports} color="#64748b" icon={Search} />
            <StatCard label="Pending L&F Approvals"  value={stats.pending_lost_found}    color="#f43f5e" icon={Clock} />
          </div>
        ) : <div style={{ color: 'var(--color-text-secondary)' }}>Loading stats...</div>;

      // ── Module Registry ───────────────────────────────────────────────────
      case 'modules':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {modules.map(m => (
              <div key={m.module_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{m.prefix}</span>
                    <StatusBadge text={m.type} color="#818cf8" />
                  </div>
                </div>
                <button
                  onClick={() => toggleModule(m.module_id)}
                  title={m.enabled ? 'Click to disable' : 'Click to enable'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: m.enabled ? '#10b981' : '#64748b', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {m.enabled
                    ? <><ToggleRight size={28} color="#10b981" /> Enabled</>
                    : <><ToggleLeft size={28} color="#64748b" /> Disabled</>
                  }
                </button>
              </div>
            ))}
          </div>
        );

      // ── Student List ──────────────────────────────────────────────────────
      case 'students':
        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Roll No', 'Branch', 'Specialization', 'CGPA', 'Role'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{s.roll_no}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{s.branch}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{s.specialization || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: s.cgpa >= 8 ? '#10b981' : s.cgpa >= 6.5 ? '#f59e0b' : '#f43f5e', fontWeight: 700 }}>{s.cgpa ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge text={s.role} color={s.role === 'admin' ? '#f43f5e' : '#818cf8'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // ── Lost & Found Moderation ────────────────────────────────────────────
      case 'lost_found':
        return pending.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center' }}>
            <CheckCircle size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
            <div>No pending items. All clear!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(item => (
              <div key={item.id} style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <StatusBadge text={item.item_type} color={item.item_type === 'lost' ? '#f43f5e' : '#10b981'} />
                      <StatusBadge text={item.category || 'Other'} color="#818cf8" />
                    </div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>{item.description}</div>}
                    {item.location_found && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>📍 {item.location_found}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => moderateLF(item.id, 'approved')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => moderateLF(item.id, 'rejected')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      // ── IRO Applications ──────────────────────────────────────────────────
      case 'iro':
        return iroApps.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center' }}>No applications submitted yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {iroApps.map(app => (
              <div key={app.id} style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{app.student_name} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '0.82rem' }}>({app.student_roll})</span></div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                      {app.program_type?.replace('_', ' ')} → <span style={{ color: '#a855f7' }}>{app.target_university}</span>
                    </div>
                    {app.preferred_semester && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Semester: {app.preferred_semester}</div>}
                    {app.personal_statement && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', fontStyle: 'italic' }}>"{app.personal_statement?.slice(0, 120)}..."</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <StatusBadge text={app.status} color={appStatusColor(app.status)} />
                    <select
                      value={app.status}
                      onChange={e => updateIRO(app.id, e.target.value)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="waitlisted">Waitlisted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      // ── Feedback Summary ──────────────────────────────────────────────────
      case 'feedback':
        return feedback.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center' }}>No feedback submitted yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {feedback.map(f => (
              <div key={f.module} style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'capitalize', fontWeight: 600 }}>{f.module.replace('_', ' ')}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: f.avg_rating >= 4 ? '#10b981' : f.avg_rating >= 3 ? '#f59e0b' : '#f43f5e' }}>
                  {f.avg_rating}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {'★'.repeat(Math.round(f.avg_rating))}{'☆'.repeat(5 - Math.round(f.avg_rating))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>{f.response_count} responses</div>
              </div>
            ))}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="dashboard-layout fade-in">
      {/* Admin Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2 style={{ color: '#f43f5e' }}>Admin Panel</h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Campus Sphere</div>
        </div>

        <nav className="nav-menu">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`nav-item ${tab === t.key ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar" style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e' }}>A</div>
            <div className="user-info">
              <span className="user-name">Campus Admin</span>
              <span className="user-roll">ADMIN001</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-container fade-in">
          <div className="page-header">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <activeTab.icon size={26} color="#f43f5e" />
              {activeTab.label}
            </h1>
            <p>Campus Sphere Control Panel — Admin Access</p>
          </div>
          <div className="bento-card glass-panel" style={{ padding: '1.5rem' }}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
