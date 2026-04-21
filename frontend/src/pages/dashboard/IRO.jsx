import React, { useEffect, useState } from 'react';
import { Globe, Target, Users, BookOpen, HelpCircle, Star, Phone, Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const tabs = [
  { key: 'about',       label: 'About IRO',       icon: Globe,       color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { key: 'objectives',  label: 'Objectives',       icon: Target,      color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'partners',    label: 'Global Partners',  icon: Users,       color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  { key: 'pathways',    label: 'Learning Pathways',icon: BookOpen,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'faqs',        label: 'FAQs',             icon: HelpCircle,  color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
  { key: 'testimonials',label: 'Testimonials',     icon: Star,        color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { key: 'apply',       label: 'Apply Now',        icon: Send,        color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  { key: 'contact',     label: 'Contact',          icon: Phone,       color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
];

function groupPartners(rows) {
  const grouped = {};
  rows.forEach(row => {
    if (!row.global_partners || row.global_partners === 'nan') return;
    const [uni, ...rest] = row.global_partners.split(' | ');
    const detail = rest.join(' | ').trim();
    if (!grouped[uni]) grouped[uni] = [];
    if (detail) grouped[uni].push(detail);
  });
  return grouped;
}

const IRO = ({ profile }) => {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [myApps, setMyApps] = useState([]);
  const [appSuccess, setAppSuccess] = useState(null);
  const [form, setForm] = useState({
    program_type: 'semester_exchange',
    target_university: '',
    preferred_semester: '',
    personal_statement: '',
  });

  useEffect(() => {
    api.get('/iro/').then(res => {
      setRows(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.get('/iro/my-applications').then(res => setMyApps(res.data || [])).catch(() => {});
  }, []);

  const partnerGroups = groupPartners(rows);
  const aboutRow = rows.find(r => r.about_iro && r.about_iro !== 'nan');
  const objectives = [...new Set(rows.map(r => r.main_objectives).filter(v => v && v !== 'nan'))];
  const faqs = [...new Set(rows.map(r => r.faqs).filter(v => v && v !== 'nan'))];
  const testimonials = [...new Set(rows.map(r => r.student_testimonials).filter(v => v && v !== 'nan'))];
  const pathways = [...new Set(rows.map(r => r.global_learning_pathways).filter(v => v && v !== 'nan'))];
  const contactRow = rows.find(r => r.contact && r.contact !== 'nan');
  const active = tabs.find(t => t.key === activeTab);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/iro/apply', form);
      setAppSuccess(`Application #${res.data.application_id} submitted successfully!`);
      const myRes = await api.get('/iro/my-applications');
      setMyApps(myRes.data || []);
      setForm({ program_type: 'semester_exchange', target_university: '', preferred_semester: '', personal_statement: '' });
      setTimeout(() => setAppSuccess(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const statusColor = (status) => {
    if (status === 'approved') return '#10b981';
    if (status === 'rejected') return '#f43f5e';
    if (status === 'waitlisted') return '#f59e0b';
    return '#818cf8';
  };

  const renderContent = () => {
    if (loading) return <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>;

    switch (activeTab) {
      case 'about':
        return <p style={{ lineHeight: 1.9, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{aboutRow?.about_iro || 'No data available.'}</p>;

      case 'objectives':
        return (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {objectives.map((obj, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, marginTop: '0.1rem' }}>{i + 1}</span>
                <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>{obj}</span>
              </li>
            ))}
          </ul>
        );

      case 'partners':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(partnerGroups).map(([uni, details]) => (
              <div key={uni} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(168,85,247,0.03)' }}>
                <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '0.5rem', fontSize: '0.95rem' }}>🎓 {uni}</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {details.map((d, i) => (
                    <li key={i} style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(168,85,247,0.3)' }}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      case 'pathways':
        return (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {pathways.length === 0 ? <li style={{ color: 'var(--color-text-secondary)' }}>No pathway data available.</li> :
              pathways.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <BookOpen size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.3rem' }} />
                  <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>{p}</span>
                </li>
              ))}
          </ul>
        );

      case 'faqs':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, i) => {
              const [q, ...a] = faq.split(' | ');
              return (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.03)' }}>
                  <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Q: {q}</div>
                  {a.length > 0 && <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>A: {a.join(' | ')}</div>}
                </div>
              );
            })}
          </div>
        );

      case 'testimonials':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {testimonials.map((t, i) => {
              const [name, ...rest] = t.split(' | ');
              return (
                <div key={i} style={{ padding: '1.25rem', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 'var(--radius-md)', background: 'rgba(236,72,153,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={16} color="#ec4899" /></div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{name}</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{rest.join(' | ')}</p>
                </div>
              );
            })}
          </div>
        );

      case 'apply':
        return (
          <div>
            {appSuccess && (
              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#10b981', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <CheckCircle size={16} /> {appSuccess}
              </div>
            )}
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 540 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Program Type</label>
                <select value={form.program_type} onChange={e => setForm(f => ({ ...f, program_type: e.target.value }))} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: '#fff' }}>
                  <option value="semester_exchange">Semester Exchange</option>
                  <option value="summer_immersion">Summer Immersion</option>
                  <option value="internship">International Internship</option>
                  <option value="research">Research Collaboration</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Target University</label>
                <input required placeholder="e.g. Shibaura Institute of Technology, Japan" value={form.target_university} onChange={e => setForm(f => ({ ...f, target_university: e.target.value }))} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Preferred Semester / Year</label>
                <input placeholder="e.g. Spring 2025" value={form.preferred_semester} onChange={e => setForm(f => ({ ...f, preferred_semester: e.target.value }))} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Personal Statement</label>
                <textarea placeholder="Why do you want to apply for this program?" value={form.personal_statement} onChange={e => setForm(f => ({ ...f, personal_statement: e.target.value }))} rows={5} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: '#fff', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }} />
              </div>
              <button type="submit" className="btn-primary">Submit Application</button>
            </form>

            {myApps.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>My Applications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myApps.map(app => (
                    <div key={app.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{app.target_university}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{app.program_type?.replace('_', ' ')} · {app.preferred_semester}</div>
                      </div>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: `${statusColor(app.status)}22`, color: statusColor(app.status), fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'contact':
        return (
          <div style={{ padding: '1.5rem', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 'var(--radius-md)', background: 'rgba(14,165,233,0.03)' }}>
            <pre style={{ color: 'var(--color-text-secondary)', fontFamily: 'inherit', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: 0 }}>
              {contactRow?.contact || 'Contact info not available.'}
            </pre>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🌍 International Relations Office</h1>
        <p>Explore {Object.keys(partnerGroups).length} global university partners, exchange pathways, and apply for international programs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="bento-card glass-panel" style={{ padding: '0.75rem', position: 'sticky', top: '1rem' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.25rem', border: 'none', background: isActive ? tab.bg : 'transparent', color: isActive ? tab.color : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s', textAlign: 'left' }}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bento-card glass-panel" style={{ padding: '1.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: active.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <active.icon size={20} color={active.color} />
            </div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>{active.label}</h2>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default IRO;
