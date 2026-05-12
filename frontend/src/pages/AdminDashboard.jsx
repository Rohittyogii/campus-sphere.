import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, Search,
  Globe, ToggleLeft, ToggleRight, BarChart2,
  CheckCircle, XCircle, Clock, MessageSquare, Loader2,
  Menu, ChevronLeft, Bell, Calendar, Filter,
  FileUp, FileDown
} from 'lucide-react';
import api from '../services/api';
const sidebarLogo = '/assets/NCU-Logo.svg';
import './Dashboard.css';

// ─── Sidebar tabs ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'stats', label: 'Platform Stats', icon: BarChart2, section: 'MANAGEMENT' },
  { key: 'modules', label: 'Module Registry', icon: ToggleRight },
  { key: 'students', label: 'Student List', icon: Users },
  { key: 'lost_found', label: 'Lost & Found Queue', icon: Search },
  { key: 'iro', label: 'IRO Applications', icon: Globe },
  { key: 'announcements', label: 'Announcements', icon: Bell },
  { key: 'feedback', label: 'Feedback Summary', icon: MessageSquare },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = '#818cf8', icon: Icon }) => (
  <div className="bento-card" style={{ padding: '1.25rem 1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
    <div style={{ width: 48, height: 48, borderRadius: '14px', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ text, color }) => (
  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '10px', background: `${color}15`, color, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
    {text}
  </span>
);

const appStatusColor = (s) => {
  const status = s?.toUpperCase();
  if (status === 'APPROVED') return '#10b981';
  if (status === 'REJECTED') return '#f43f5e';
  if (status === 'PENDING') return '#818cf8';
  return '#6366f1';
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [iroApps, setIroApps] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '', type: 'info' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [newStudent, setNewStudent] = useState({ student_name: '', roll_no: '', email: '', password: '', branch: '', course: '', specialization: '', role: 'student' });
  const [filters, setFilters] = useState({ name: '', roll_no: '', branch: '', specialization: '', role: '' });
  const [activeFilterMenu, setActiveFilterMenu] = useState(null); // 'branch', 'role', etc.
  const [feedbackSummary, setFeedbackSummary] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  useEffect(() => {
    setLoading(true);
    const fetchers = {
      stats: () => api.get('/admin/stats').then(r => setStats(r.data)),
      modules: () => api.get('/admin/modules').then(r => setModules(r.data)),
      students: () => api.get('/admin/students?limit=500').then(r => setStudents(r.data)),
      lost_found: () => api.get('/lost-found/pending').then(r => setPending(r.data)),
      iro: () => api.get('/iro/applications').then(r => setIroApps(r.data)),
      announcements: () => api.get('/announcements/').then(r => setAnnouncements(r.data)),
      feedback: () => Promise.all([
        api.get('/feedback/summary'),
        api.get('/feedback/')
      ]).then(([sum, list]) => {
        setFeedbackSummary(sum.data);
        setFeedbackList(list.data);
      }),
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

  const postAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.description) return;
    try {
      await api.post('/announcements/', newAnnouncement);
      setNewAnnouncement({ title: '', description: '', type: 'info' });
      const r = await api.get('/announcements/');
      setAnnouncements(r.data);
      alert("Announcement posted successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to post announcement");
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.post('/admin/students', newStudent);
      alert("Student registered successfully!");
      setShowAddStudent(false);
      setNewStudent({ student_name: '', roll_no: '', email: '', password: '', branch: '', course: '', specialization: '', role: 'student' });
      const r = await api.get('/admin/students?limit=100');
      setStudents(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to register student");
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/admin/students/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download template");
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await api.post('/admin/students/bulk', formData);
      alert(`Import complete!\nSuccess: ${res.data.imported}\nErrors: ${res.data.errors.length}`);
      if (res.data.errors.length > 0) {
        console.error("Bulk Import Errors:", res.data.errors);
      }
      fetchers.students();
    } catch (err) {
      alert(err.response?.data?.detail || "Bulk import failed");
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const filteredStudents = students.filter(s => {
    return (
      (s.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
      (s.roll_no || '').toLowerCase().includes(filters.roll_no.toLowerCase()) &&
      (filters.branch === '' || s.branch === filters.branch) &&
      (filters.specialization === '' || s.specialization === filters.specialization) &&
      (filters.role === '' || s.role === filters.role)
    );
  });

  const uniqueBranches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();
  const uniqueSpecs = [...new Set(students.map(s => s.specialization).filter(Boolean))].sort();
  const uniqueRoles = [...new Set(students.map(s => s.role).filter(Boolean))].sort();

  const activeTab = TABS.find(t => t.key === tab);

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem', color: '#94a3b8' }}>
        <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite' }} />
      </div>
    );

    switch (tab) {
      case 'stats':
        return stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <StatCard label="Total Students" value={stats.total_students} color="#0ea5e9" icon={Users} />
            <StatCard label="Books in Library" value={stats.total_books} color="#818cf8" icon={BarChart2} />
            <StatCard label="Books Issued" value={stats.total_issued} color="#f59e0b" icon={BarChart2} />
            <StatCard label="Cafe Items" value={stats.total_cafe_items} color="#ec4899" icon={BarChart2} />
            <StatCard label="Campus Clubs" value={stats.total_clubs} color="#10b981" icon={Users} />
            <StatCard label="Events" value={stats.total_events} color="#a855f7" icon={BarChart2} />
            <StatCard label="Hackathons" value={stats.total_hackathons} color="#f43f5e" icon={BarChart2} />
            <StatCard label="Open Electives" value={stats.total_open_electives} color="#0ea5e9" icon={BarChart2} />
            <StatCard label="Lost & Found Reports" value={stats.total_lost_found_reports} color="#64748b" icon={Search} />
            <StatCard label="Pending L&F Approvals" value={stats.pending_lost_found} color="#f43f5e" icon={Clock} />
          </div>
        ) : null;

      case 'modules':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {modules.map(m => (
              <div key={m.module_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'block' }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{m.prefix}</span>
                    <StatusBadge text={m.type} color="#818cf8" />
                  </div>
                </div>
                <button
                  onClick={() => toggleModule(m.module_id)}
                  style={{ background: m.enabled ? '#10b981' : '#f1f5f9', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', color: m.enabled ? '#fff' : '#64748b', fontWeight: 800, fontSize: '0.75rem', transition: 'all 0.2s' }}
                >
                  {m.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {m.enabled ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            ))}
          </div>
        );

      case 'students':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Registered Students</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    style={{ background: '#f8fafc', color: '#6366f1', border: '1px solid #6366f130', padding: '0.6rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FileUp size={14} /> Bulk Actions
                  </button>

                  {showBulkMenu && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '1.25rem', minWidth: '260px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>Bulk Registration</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div
                          onClick={() => { downloadTemplate(); setShowBulkMenu(false); }}
                          style={{ padding: '1rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <FileDown size={18} color="#6366f1" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>1. Get Template</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>Download the Excel format to fill student data.</p>
                        </div>

                        <label
                          style={{ padding: '1rem', borderRadius: '16px', background: '#6366f108', border: '1px dashed #6366f140', cursor: 'pointer', display: 'block', transition: 'transform 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <FileUp size={18} color="#6366f1" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>2. Upload File</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>Upload the filled Excel to import in one go.</p>
                          <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => { handleBulkImport(e); setShowBulkMenu(false); }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {showAddStudent ? 'Cancel' : '+ Register'}
                </button>
              </div>
            </div>

            {showAddStudent && (
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <input placeholder="Full Name" value={newStudent.student_name} onChange={e => setNewStudent({ ...newStudent, student_name: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <input placeholder="Roll No (e.g. 22CSU123)" value={newStudent.roll_no} onChange={e => setNewStudent({ ...newStudent, roll_no: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <input placeholder="Email Address" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <input placeholder="Password" type="password" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <input placeholder="Branch (e.g. SOET)" value={newStudent.branch} onChange={e => setNewStudent({ ...newStudent, branch: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <input placeholder="Specialization" value={newStudent.specialization} onChange={e => setNewStudent({ ...newStudent, specialization: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                <select value={newStudent.role} onChange={e => setNewStudent({ ...newStudent, role: e.target.value })} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
                <button
                  onClick={handleAddStudent}
                  style={{ gridColumn: 'span 3', background: '#10b981', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Confirm Registration
                </button>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', overflow: 'visible' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {['Name', 'Roll No', 'Email', 'Branch', 'Specialization', 'CGPA', 'Role'].map(h => {
                        const filterKey = h.toLowerCase().replace(' ', '_');
                        const hasFilter = ['Name', 'Roll No', 'Branch', 'Specialization', 'Role'].includes(h);
                        const isActive = filters[filterKey] !== '';

                        return (
                          <th key={h} style={{ position: 'relative', textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {h}
                              {hasFilter && (
                                <Filter
                                  size={12}
                                  style={{ cursor: 'pointer', color: isActive ? '#6366f1' : '#94a3b8', transition: 'color 0.2s' }}
                                  onClick={() => setActiveFilterMenu(activeFilterMenu === h ? null : h)}
                                />
                              )}
                            </div>

                            {activeFilterMenu === h && (
                              <div style={{ position: 'absolute', top: '90%', left: '1.5rem', zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '1rem', minWidth: '200px', textTransform: 'none', letterSpacing: 'normal' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                  Filter {h}
                                  <span onClick={() => setFilters({ ...filters, [filterKey]: '' })} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>Clear</span>
                                </div>

                                {['Name', 'Roll No'].includes(h) ? (
                                  <input
                                    autoFocus
                                    value={filters[filterKey]}
                                    onChange={e => setFilters({ ...filters, [filterKey]: e.target.value })}
                                    placeholder={`Search ${h}...`}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', background: '#f8fafc', color: '#0f172a' }}
                                  />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div
                                      onClick={() => setFilters({ ...filters, [filterKey]: '' })}
                                      style={{ padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', background: filters[filterKey] === '' ? '#6366f115' : 'transparent', color: filters[filterKey] === '' ? '#6366f1' : '#475569', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                      All
                                    </div>
                                    {(h === 'Branch' ? uniqueBranches : h === 'Specialization' ? uniqueSpecs : uniqueRoles).map(val => (
                                      <div
                                        key={val}
                                        onClick={() => setFilters({ ...filters, [filterKey]: val })}
                                        style={{ padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', background: filters[filterKey] === val ? '#6366f115' : 'transparent', color: filters[filterKey] === val ? '#6366f1' : '#475569', fontSize: '0.8rem', fontWeight: 600 }}
                                      >
                                        {val}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setActiveFilterMenu(null)}
                                    style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontWeight: 700 }}>{s.name}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600 }}>{s.roll_no}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{s.email}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{s.branch}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{s.specialization || '—'}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: s.cgpa >= 8 ? '#10b981' : s.cgpa >= 6.5 ? '#f59e0b' : '#f43f5e', fontWeight: 900 }}>{s.cgpa ?? '—'}</td>
                        <td style={{ padding: '1.25rem 1.5rem' }}><StatusBadge text={s.role} color={s.role === 'admin' ? '#f43f5e' : '#818cf8'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'lost_found':
        return pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '64px', height: '64px', background: '#10b98115', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>All Clear!</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No pending Lost & Found items to moderate.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map(item => (
              <div key={item.id} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <StatusBadge text={item.item_type} color={item.item_type === 'lost' ? '#f43f5e' : '#10b981'} />
                      <StatusBadge text={item.category || 'Other'} color="#818cf8" />
                    </div>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.4rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{item.description}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📍 {item.location_found}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={() => moderateLF(item.id, 'approved')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} /> APPROVE
                    </button>
                    <button onClick={() => moderateLF(item.id, 'rejected')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#f43f5e', padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <XCircle size={16} /> REJECT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'iro':
        return iroApps.length === 0 ? (
          <div style={{ color: '#64748b', padding: '4rem', textAlign: 'center' }}>No applications submitted yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {iroApps.map(app => (
              <div key={app.id} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{app.student_name} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>({app.student_roll})</span></div>
                    <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.4rem', fontWeight: 600 }}>
                      {app.program} → <span style={{ color: '#818cf8' }}>{app.university}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 600 }}>Term: {app.term} • CGPA: {app.cgpa}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge text={app.status} color={appStatusColor(app.status)} />
                    <div style={{ marginTop: '0.75rem' }}>
                      <select
                        value={app.status}
                        onChange={e => updateIRO(app.id, e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'announcements':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'sticky', top: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>Create Announcement</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  placeholder="Title"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#f8fafc', color: '#0f172a' }}
                />
                <textarea
                  placeholder="Description..."
                  value={newAnnouncement.description}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', minHeight: '100px', background: '#f8fafc', color: '#0f172a' }}
                />
                <select
                  value={newAnnouncement.type}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#f8fafc', color: '#0f172a' }}
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Red)</option>
                  <option value="success">Success (Green)</option>
                </select>
                <button
                  onClick={postAnnouncement}
                  disabled={!newAnnouncement.title || !newAnnouncement.description}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s' }}
                >
                  Post Announcement
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Active Announcements</h3>
              {announcements.map(a => (
                <div key={a.id} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: a.type === 'warning' ? '#f43f5e' : a.type === 'success' ? '#10b981' : '#3b82f6', marginTop: 4 }} />
                      <div>
                        <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '0.4rem' }}>{a.title}</h4>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{a.description}</p>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', fontWeight: 600 }}>
                          Posted on {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                  No announcements yet.
                </div>
              )}
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {feedbackSummary.map(f => (
                <div key={f.module} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>{f.module.replace('_', ' ')}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: f.avg_rating >= 4 ? '#10b981' : f.avg_rating >= 3 ? '#f59e0b' : '#f43f5e', marginBottom: '0.25rem' }}>
                    {f.avg_rating}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                    {'★'.repeat(Math.round(f.avg_rating))}{'☆'.repeat(5 - Math.round(f.avg_rating))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>{f.response_count} responses</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f43f5e12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} color="#f43f5e" />
                </div>
                Detailed Feedback Log
              </h3>
              {feedbackList.slice().reverse().map(f => (
                <div key={f.id} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{f.student_name} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>({f.roll_no})</span></div>
                      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem', alignItems: 'center' }}>
                        <StatusBadge text={f.module.replace('_', ' ')} color="#818cf8" />
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 900 }}>{'★'.repeat(f.rating)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                      {new Date(f.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  {f.comment && (
                    <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '16px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, borderLeft: '4px solid #f43f5e' }}>
                      "{f.comment}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className={`dashboard-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ─── Admin Sidebar ────────────────────────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="sidebar-header">
          <h2 style={{ marginBottom: 0, opacity: 1, transition: 'opacity 0.2s' }}>
            <img
              src={sidebarLogo}
              alt="Logo"
              className="brand-logo"
            />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
                <span style={{ fontSize: '16px' }}>Admin Panel</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0', textTransform: 'none' }}>Campus Sphere Control</span>
              </div>
            )}
          </h2>
        </div>

        <nav className="nav-menu">
          {TABS.map((item, idx) => (
            <React.Fragment key={item.key}>
              {item.section && !collapsed && <div className="nav-section-label">{item.section}</div>}
              <button
                onClick={() => setTab(item.key)}
                className={`nav-item ${tab === item.key ? 'active' : ''}`}
                style={{ width: 'calc(100% - 4px)', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div className="nav-icon">
                  <item.icon size={18} />
                </div>
                {!collapsed && <span>{item.label}</span>}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="nav-item logout-btn" style={{ background: 'transparent', width: 'calc(100% - 4px)' }}>
            <div className="nav-icon"><LogOut size={18} /></div>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="main-content" style={{ background: '#f4f7fe' }}>
        <header className="top-header">
          <div className="top-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#f43f5e" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div style={{ height: '16px', width: '1px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="top-header-title" style={{ fontSize: '14px', marginBottom: 0 }}>{activeTab.label}</h1>
                <p className="top-header-subtitle" style={{ fontSize: '11px', marginTop: '2px' }}>Administrative Insights & Management</p>
              </div>
            </div>
          </div>
          <div className="top-header-right">
            <div style={{ textAlign: 'right', marginRight: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>System Administrator</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>MASTER ACCESS</div>
            </div>
            <div className="header-avatar" style={{ width: '36px', height: '36px', background: '#f43f5e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '12px' }}>
              AD
            </div>
          </div>
        </header>

        <div className="main-scroll" style={{ padding: '2rem' }}>
          <div className="fade-in">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
