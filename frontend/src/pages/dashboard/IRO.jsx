import React, { useEffect, useState, useMemo } from 'react';
import { Globe, Target, Users, BookOpen, HelpCircle, Star, Phone, Send, CheckCircle, MapPin, ExternalLink, Calendar, MessageSquare, Award, ArrowRight, ChevronRight, X, User, Search, LayoutGrid, Clock, Filter, Quote, Sun, ClipboardList, Rss } from 'lucide-react';
import api from '../../services/api';

// ─── Asset Mapping ───────────────────────────────────────────────────────────
const getAssetUrl = (path) => `/iro/${path}`;

const UNIS_WITH_IMAGES = [
  'Alma University', 'BINUS University', 'City College of New York', 'George Washington University',
  'Loyola Marymount University USA', 'NTHU', 'Northern Illinois University', 'Providence University',
  'Queensland University of technology', 'Salem University', 'Santa Clara University',
  'Shibaura Institute of Technology Japan', 'UDF Centro Universitario', 'Universidad Autonoma de Guadalajara',
  'University Teknologi Malaysia', 'University of Chester', 'University of Dayton Arena',
  'University of East Anglia UK', 'University of Illinois', 'University of North Florida',
  'University of Regina', 'Vilnius University', 'University of Dayton', 'Loyola Marymount',
  'Shibaura', 'Chester', 'North Florida', 'East Anglia', 'Illinois', 'Regina', 'Vilnius'
];

const getUniImage = (uniName) => {
  const match = UNIS_WITH_IMAGES.find(name => uniName.toLowerCase().includes(name.toLowerCase()));
  if (!match) return null;
  // Use the specific filename mapping for known assets
  const fileName = match.replace(/ /g, '_').replace(/,/g, '');
  return getAssetUrl(`University/${fileName}.png`);
};

// ─── Components ───────────────────────────────────────────────────────────
const UniLogo = ({ uni, img }) => {
  if (img) {
    return (
      <div style={{ width: 64, height: 64, borderRadius: '18px', background: '#f8fafc', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
        <img src={img} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt={uni} />
      </div>
    );
  }

  // High-end fallback for missing images
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const color = colors[uni.length % colors.length];

  return (
    <div style={{
      width: 64, height: 64, borderRadius: '18px', background: `${color}10`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${color}20`, fontSize: '1.5rem', fontWeight: 900,
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      {uni.charAt(0)}
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: '#fff',
    padding: '1rem 1.5rem',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}10`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} />
    </div>
    <div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{label}</div>
    </div>
  </div>
);

const IRO = ({ profile }) => {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [myApps, setMyApps] = useState([]);
  const [formData, setFormData] = useState({
    program: 'Semester Exchange',
    university: 'Select University',
    term: 'Spring 2026',
    cgpa: '',
    purpose: '',
    confirmed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.university || formData.university === 'Select University') {
      alert("Please select a target university.");
      return;
    }
    if (!formData.cgpa) {
      alert("Please enter your current CGPA.");
      return;
    }
    if (!formData.confirmed) {
      alert("Please confirm that the submitted details are valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/iro/apply', {
        program: formData.program,
        university: formData.university,
        term: formData.term,
        cgpa: formData.cgpa,
        purpose: formData.purpose
      });

      if (response.status === 200 || response.status === 201) {
        alert("Application submitted successfully! It has been sent to the admin for approval.");
        setFormData({
          program: 'Semester Exchange',
          university: 'Select University',
          term: 'Spring 2026',
          cgpa: '',
          purpose: '',
          confirmed: false
        });
        // Refresh apps list
        const appsRes = await api.get('/iro/my-applications');
        setMyApps(appsRes.data || []);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.detail || "Failed to submit application";
      alert(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchIroData = async () => {
      try {
        const res = await api.get('/iro/');
        setRows(res.data || []);

        const appsRes = await api.get('/iro/my-applications');
        setMyApps(appsRes.data || []);
      } catch (err) {
        console.error("Error fetching IRO data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIroData();
    setTimeout(() => setMounted(true), 60);
  }, []);

  const partnerGroups = useMemo(() => {
    const grouped = {};
    rows.forEach(row => {
      const rawVal = row.global_partners;
      if (!rawVal || rawVal === 'nan' || rawVal.trim() === '') return;

      // Robust cleaning: remove wrapping quotes and trim
      const cleanedVal = rawVal.replace(/^"|"$/g, '').trim();

      // Flexible split: handle '|' with or without spaces
      const parts = cleanedVal.split(/\s*\|\s*/);
      if (parts.length === 0) return;

      const uni = parts[0].trim().replace(/^"|"$/g, '');
      const detail = parts.slice(1).join(' | ').trim().replace(/^"|"$/g, '');

      if (!grouped[uni]) grouped[uni] = new Set();
      if (detail) grouped[uni].add(detail);
    });

    const finalGrouped = {};
    Object.entries(grouped).forEach(([uni, detailsSet]) => {
      finalGrouped[uni] = Array.from(detailsSet);
    });
    return finalGrouped;
  }, [rows]);

  const objectives = useMemo(() => [...new Set(rows.map(r => r.main_objectives).filter(v => v && v !== 'nan' && v.trim() !== ''))], [rows]);
  const pathways = useMemo(() => [...new Set(rows.map(r => r.global_learning_pathways).filter(v => v && v !== 'nan' && v.trim() !== ''))], [rows]);
  const testimonials = useMemo(() => {
    const raw = [...new Set(rows.map(r => r.student_testimonials).filter(v => v && v !== 'nan' && v.trim() !== ''))];
    return raw.map(text => {
      // Improved parsing: Name | Degree/Context | Quote
      const parts = text.split(/[|–-]/);
      const name = parts[0]?.trim() || "NCU Student";

      let subtitle = "Global Participant";
      let quote = text;

      if (parts.length > 1) {
        // Try to separate degree from quote
        const contextPart = parts[1].trim();
        const quoteMatch = contextPart.match(/(.*?[.!?])\s+(.*)/);
        if (quoteMatch) {
          subtitle = quoteMatch[1].trim();
          quote = quoteMatch[2].trim();
        } else {
          subtitle = contextPart;
          quote = parts.slice(2).join(' ').trim() || contextPart;
        }
      }

      // Final cleanup for quote if it still contains the subtitle
      if (quote === subtitle) {
        const fallbackMatch = text.match(/["“](.*?)["”]/);
        if (fallbackMatch) quote = fallbackMatch[1];
      }

      return {
        name,
        subtitle,
        text: quote.length > 300 ? quote.substring(0, 297) + "..." : quote,
        image: getAssetUrl(`StudentTestimonial/${name}.png`)
      };
    });
  }, [rows]);
  const connections = useMemo(() => [
    {
      title: "HeritEdge 2024: Connecting Cultures, Expanding Horizons",
      date: "18 Nov, 2024",
      description: "NCU organized the HeritEdge International Cultural & Knowledge Exchange Programme, uniting students from Russia and India for a vibrant showcase of culture, AI insights, and lab tours.",
      link: "https://www.ncuindia.edu/heritedge-2024-connecting-cultures-expanding-horizons/",
      image: getAssetUrl('CampusConnection/HeritEdge 2024_ Connecting Cultures, Expanding Horizons.png')
    },
    {
      title: "International Students’ Day Celebration",
      date: "17 Nov, 2024",
      description: "NCU celebrates global education and transformative partnerships with 30+ prestigious institutions worldwide, empowering students with international exposure and cross-cultural understanding.",
      link: "https://www.ncuindia.edu/international-students-day/",
      image: getAssetUrl('CampusConnection/International StudentsΓÇÖ Day.png')
    },
    {
      title: "Success in Denmark: Three Weeks of Achievement",
      date: "10 Oct, 2024",
      description: "Our 3rd-year BBA students, Ritvik Dalal and Karan Vir Singh, achieved outstanding academic results during their intensive three-week international immersion programme in Denmark.",
      link: "https://www.ncuindia.edu/three-weeks-in-denmark-with-outstanding-achievements/",
      image: getAssetUrl('CampusConnection/Three Weeks in Denmark with Outstanding Achievements.png')
    },
    {
      title: "Study Abroad: UEA UK Summer Programme",
      date: "15 Sep, 2024",
      description: "NCU hosted an engaging session with the University of East Anglia (UEA), UK, exploring transformative summer study abroad opportunities and global engagement for our students.",
      link: "https://www.ncuindia.edu/make-your-summer-count-with-ueas-study-abroad-programme/",
      image: getAssetUrl('CampusConnection/Make Your Summer Count with UEAΓÇÖs Study Abroad Programme.png')
    },
    {
      title: "AYLTLC 2025: Asian Youth Leaders Summit",
      date: "05 Feb, 2025",
      description: "The IRO invites aspiring leaders to the 12th Asian Youth Leaders Travel and Learning Camp in Singapore, offering a unique platform to network with global student leaders.",
      link: "https://www.ncuindia.edu/join-the-12th-asian-youth-leaders-travel-and-learning-camp-ayltlc-2025-in-singapore/",
      image: getAssetUrl('CampusConnection/Join the 12th Asian Youth Leaders Travel and Learning Camp (AYLTLC) 2025 in Singapore.png')
    }
  ], []);
  const aboutInfo = useMemo(() => [...new Set(rows.map(r => r.about_iro).filter(v => v && v !== 'nan' && v.trim() !== ''))], [rows]);
  const faqs = useMemo(() => [...new Set(rows.map(r => r.faqs).filter(v => v && v !== 'nan' && v.trim() !== ''))], [rows]);
  const vision = useMemo(() => [...new Set(rows.map(r => r.vision).filter(v => v && v !== 'nan' && v.trim() !== ''))], [rows]);

  const uniToCountry = useMemo(() => ({
    'Northern Illinois University': 'USA',
    'University of Illinois': 'USA',
    'George Washington University': 'USA',
    'Santa Clara University': 'USA',
    'University of North Florida': 'USA',
    'Salem State University': 'USA',
    'Loyola Marymount University': 'USA',
    'Texas A&M University': 'USA',
    'University of Dayton': 'USA',
    'ASU': 'USA',
    'Arizona State University': 'USA',
    'Shibaura Institute of Technology': 'Japan',
    'SIT': 'Japan',
    'Universiti Teknologi Malaysia': 'Malaysia',
    'UTM': 'Malaysia',
    'Sunway University': 'Malaysia',
    'Queensland University of Technology': 'Australia',
    'QUT': 'Australia',
    'Coventry University': 'UK',
    'University of East Anglia': 'UK',
    'UEA': 'UK',
    'University of Brighton': 'UK',
    'University of York': 'UK',
    'University of Chester': 'UK',
    'Universitas Esa Unggul': 'Indonesia',
    'BINUS University': 'Indonesia',
    'National Tsing Hua University': 'Taiwan',
    'NTHU': 'Taiwan',
    'Providence University': 'Taiwan',
    'Almaty Management University': 'Kazakhstan',
    'Alma University': 'Kazakhstan',
    'Aalborg University': 'Denmark',
    'University of Regina': 'Canada',
    'Vilnius University': 'Lithuania',
    'UDF Centro Universitário': 'Brazil',
    'Universidad Autónoma de Guadalajara': 'Mexico',
    'UAG': 'Mexico'
  }), []);

  const countries = useMemo(() => {
    const set = new Set();
    Object.entries(partnerGroups).forEach(([uni, details]) => {
      let found = false;
      for (const [key, country] of Object.entries(uniToCountry)) {
        if (uni.toLowerCase().includes(key.toLowerCase())) {
          set.add(country);
          found = true;
          break;
        }
      }
      const common = ['USA', 'UK', 'Taiwan', 'Japan', 'Indonesia', 'India', 'Malaysia', 'Germany', 'France', 'Australia', 'Canada', 'Kazakhstan', 'Denmark', 'Mexico', 'Singapore', 'Lithuania', 'Brazil'];
      details.forEach(detail => {
        common.forEach(c => {
          if (detail.toLowerCase().includes(c.toLowerCase())) {
            set.add(c);
            found = true;
          }
        });
      });
      if (!found) {
        common.forEach(c => {
          if (uni.toLowerCase().includes(c.toLowerCase())) set.add(c);
        });
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [partnerGroups, uniToCountry]);

  const filteredPartners = useMemo(() => {
    return Object.entries(partnerGroups).filter(([uni, details]) => {
      const matchesSearch = uni.toLowerCase().includes(search.toLowerCase()) ||
        details.join(' ').toLowerCase().includes(search.toLowerCase());

      let countryOfUni = '';
      for (const [key, c] of Object.entries(uniToCountry)) {
        if (uni.toLowerCase().includes(key.toLowerCase())) {
          countryOfUni = c;
          break;
        }
      }

      const matchesCountry = selectedCountry === 'All' ||
        countryOfUni.toLowerCase() === selectedCountry.toLowerCase() ||
        details.join(' ').toLowerCase().includes(selectedCountry.toLowerCase()) ||
        uni.toLowerCase().includes(selectedCountry.toLowerCase());
      return matchesSearch && matchesCountry;
    });
  }, [partnerGroups, search, selectedCountry, uniToCountry]);

  const tabs = [
    { key: 'about', label: 'About IRO' },
    { key: 'partners', label: 'Global Partners' },
    { key: 'connections', label: 'Campus Connections' },
    { key: 'testimonials', label: 'Student Testimonials' },
    { key: 'faq', label: 'FAQ' },
    { key: 'apply', label: 'Apply for Program' },
    { key: 'applications', label: 'My Applications' },
  ];

  if (!mounted) return null;

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      <div style={{ padding: '2rem 3rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── Welcome Header ───────────────────────────────────── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Welcome, <span style={{ color: '#6366f1' }}>{profile?.full_name || 'Rohit Kumar'}!</span>
          </h1>
        </div>

        {/* ── Horizontal Navigation ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: 'none', border: 'none', padding: '0 0 0.75rem 0', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: activeTab === t.key ? 800 : 600,
                color: activeTab === t.key ? '#6366f1' : '#64748b',
                position: 'relative', transition: 'all 0.3s ease'
              }}
            >
              {t.label}
              {activeTab === t.key && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#6366f1', borderRadius: '99px' }} />
              )}
            </button>
          ))}
        </div>


        {/* ── Tab Content ───────────────────────────────────────── */}
        <div className="fade-in" key={activeTab}>
          {activeTab === 'about' && (
            <>
              {/* ── Main Hero Section ─────────────────────────────── */}
              <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', marginBottom: '3rem', minHeight: '400px', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
                <img src={getAssetUrl('HeroPage/1.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="Hero" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '3rem', left: '3rem', right: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ maxWidth: '600px' }}>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>Broaden Your Vision</h2>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', margin: 0 }}>Discover opportunities to study at over 50+ prestigious global universities.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>The World is Your Classroom</h3>
                  {aboutInfo.length > 0 ? (
                    aboutInfo.map((info, i) => (
                      <p key={i} style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>{info}</p>
                    ))
                  ) : (
                    <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                      The International Relations Office (IRO) at NCU is dedicated to fostering global citizenship through strategic academic partnerships.
                      Our mission is to provide students with transformative international experiences that enhance their academic and personal growth.
                    </p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                    {objectives.slice(0, 6).map((obj, i) => (
                      <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #eef2f6', display: 'flex', gap: '1rem', alignItems: 'start' }}>
                        <div style={{ color: '#6366f1', marginTop: '0.2rem' }}><CheckCircle size={18} /></div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#0f172a' }}>Strategic Goal</h4>
                          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{obj}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pathways.length > 0 && (
                    <div style={{ marginTop: '3rem' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>Global Learning Pathways</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pathways.map((p, i) => (
                          <div key={i} style={{ padding: '1rem 1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <BookOpen size={16} color="#64748b" />
                            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                  <img src={getAssetUrl('HeroPage/5.png')} style={{ width: '100%', display: 'block' }} alt="About" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(99, 102, 241, 0.2), transparent)' }} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'partners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

              {/* ── Functional Filters ─────────────────────────────── */}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', background: '#f8fafc', padding: '2rem', borderRadius: '32px', border: '1px solid #eef2f6' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Filter by country</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                    >
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronRight size={16} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} />
                  </div>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Search partner or opportunity</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="e.g. scholarship, exchange, TOEFL waiver"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Partner List ──────────────────────────────────── */}
              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>
                  {selectedCountry !== 'All' ? `${selectedCountry} Partners` : 'Global Partner Universities'}
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8', marginLeft: '1rem' }}>({filteredPartners.length} listed)</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                  {filteredPartners.map(([uni, details]) => {
                    const uniImg = getUniImage(uni);
                    return (
                      <div key={uni} style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f1f5f9', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.3s ease', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.06)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}
                      >
                        <UniLogo uni={uni} img={uniImg} />
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem', lineHeight: 1.3 }}>{uni}</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {details.map((d, i) => (
                              <div key={i} style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', opacity: 0.5 }} />
                                {d}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1' }}>View Details</span>
                          <ArrowRight size={18} color="#6366f1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', padding: '3rem' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Frequently Asked Questions</h3>
                <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>Find answers to the most common queries about our global programs.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {(faqs.length > 0 ? faqs : [
                  "What are the eligibility criteria for the Semester Exchange Program?",
                  "How do I apply for a Global Internship?",
                  "Are there any scholarships available for international programs?",
                  "Will my credits be transferred back to NCU?",
                  "What is the deadline for the Summer Immersion program?",
                  "Do I need to pay extra tuition fees to the host university?"
                ]).map((f, i) => (
                  <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #eef2f6', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#6366f115', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HelpCircle size={18} />
                      </div>
                      <p style={{ fontSize: '0.95rem', color: '#0f172a', margin: 0, lineHeight: 1.6, fontWeight: 700 }}>{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem' }}>
              {connections.map((item, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}>
                  {item.image && (
                    <div style={{ width: '100%', height: '260px', background: '#f8fafc', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
                      <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} alt={item.title} />
                      <div style={{ position: 'absolute', bottom: '1rem', right: '1.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: '#6366f1', padding: '0.4rem 0.8rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                          {item.date}
                        </span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', lineHeight: 1.4, fontWeight: 800, marginBottom: '1rem' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.7, marginBottom: '2rem', flexGrow: 1 }}>
                      {item.description}
                    </p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: '#6366f1',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        marginTop: 'auto'
                      }}
                    >
                      Read More <ChevronRight size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem' }}>
              {testimonials.length > 0 ? (
                testimonials.map((t, i) => (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: '32px',
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ width: '100%', height: '280px', position: 'relative', background: '#f8fafc', overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
                      <img
                        src={t.image}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '15px' }}
                        alt={t.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);display:flex;align-items:center;justify-content:center;color:#fff"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                        }}
                      />
                      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                          <Quote size={20} color="#6366f1" />
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '2rem 2.5rem 2.5rem 2.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.25rem', marginBottom: '0.4rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.4 }}>{t.subtitle}</div>
                      </div>
                      <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, fontStyle: 'italic', margin: 0, flexGrow: 1 }}>
                        "{t.text}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0', gridColumn: '1 / -1' }}>
                  <p style={{ color: '#64748b', fontWeight: 600 }}>No student testimonials found in records.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'apply' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
              <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', padding: '3rem', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Ready to Go Global?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Program Selection</label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#0f172a', outline: 'none' }}
                      >
                        <option>Semester Exchange</option>
                        <option>Summer Immersion</option>
                        <option>Global Internship</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Select University</label>
                      <select
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#0f172a', outline: 'none' }}
                      >
                        <option>Select University</option>
                        {Object.keys(partnerGroups).map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Target Term</label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                        style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#0f172a', outline: 'none' }}
                      >
                        <option>Spring 2026</option>
                        <option>Fall 2026</option>
                        <option>Spring 2027</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Current CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g. 8.50"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#0f172a', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Purpose of Study</label>
                    <textarea
                      rows={4}
                      placeholder="Briefly describe your interest in this program..."
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', resize: 'none', color: '#0f172a', fontWeight: 500, outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      id="confirm-valid"
                      checked={formData.confirmed}
                      onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                    <label htmlFor="confirm-valid" style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                      I have confirmed submitted details are valid
                    </label>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      background: isSubmitting ? '#cbd5e1' : '#6366f1',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(99,102,241,0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => !isSubmitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseOut={e => !isSubmitting && (e.currentTarget.style.transform = 'none')}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ background: '#f8fafc', borderRadius: '32px', padding: '2.5rem', border: '1px solid #eef2f6', marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <HelpCircle size={24} color="#6366f1" /> Application Help
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[
                      'Check the university eligibility criteria.',
                      'Keep your transcripts ready in PDF format.',
                      'Submit the personal statement before the deadline.',
                      'Consult the IRO advisor for credit transfer queries.'
                    ].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f120', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 800 }}>{i + 1}</div>
                        <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '32px', padding: '2.5rem', color: '#fff' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Need Quick Help?</h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>Our AI companion can answer all your questions about global programs.</p>
                  <button style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: '#fff', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Talk to AI Advisor</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', padding: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 800 }}>Application Tracking</h3>
                <div style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>{myApps.length} Active Requests</div>
              </div>
              {myApps.length === 0 ? (
                <div style={{ padding: '5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                  <ClipboardList size={64} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>No applications yet</h4>
                  <p style={{ color: '#64748b', marginBottom: '2rem' }}>Your submitted programs will appear here for tracking.</p>
                  <button onClick={() => setActiveTab('apply')} style={{ padding: '0.75rem 2rem', borderRadius: '12px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Start My First Application</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myApps.map(app => (
                    <div key={app.id} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#6366f110', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={24} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{app.university}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{app.program} • Submitted on {new Date(app.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                          <div style={{ padding: '4px 12px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{app.status}</div>
                        </div>
                        <ChevronRight size={24} color="#cbd5e1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Info ────────────────────────────────────────── */}
        <div style={{ marginTop: '5rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contact Office</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                <Phone size={16} color="#6366f1" /> +91 124 2365811
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Email Support</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                <Send size={16} color="#6366f1" /> iro@ncuindia.edu
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Global Presence</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['IN', 'US', 'UK', 'TW', 'MY', 'JP'].map(c => (
                <div key={c} style={{ width: 24, height: 24, borderRadius: '4px', background: '#f1f5f9', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        select { outline: none; transition: all 0.2s; }
        select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
      `}</style>
    </div>
  );
};

export default IRO;
