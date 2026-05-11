import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, ChevronRight, ChevronLeft, CheckCircle, Target,
  BrainCircuit, Sparkles, BookOpen, User, ArrowRight,
  HelpCircle, MessageSquare, Award, Clock, AlertCircle, Save
} from 'lucide-react';
import api from '../../services/api';

const Specialization = ({ profile }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [selection, setSelection] = useState({
    roll_no: profile?.roll_no || '',
    semester: 1,
    selected_keywords: [],
    objective_id: null,
    current_specialization: profile?.specialization || '',
    questionnaire_answers: {}
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/specialization/config');
        setConfig(res.data);
      } catch (err) {
        console.error("Failed to load specialization config:", err);
        setError("Could not connect to the recommendation engine.");
      }
    };
    fetchConfig();
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/specialization/recommendations', selection);
      setResult(res.data);
      if (res.data.allowed) {
        setStep(4);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Calculation failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // ── Validation Logic ───────────────────────────────────────
  const validation = useMemo(() => {
    const roll = (selection.roll_no || "").toUpperCase();
    const batch = roll.substring(0, 2);
    const seqMatch = roll.match(/\d+$/);
    const sequence = seqMatch ? parseInt(seqMatch[0]) : null;
    const semester = selection.semester;

    let res = {
      isValidRoll: false,
      isBatchEligible: false,
      isSemesterEligible: false,
      warning: "",
      year: "",
      allowedSems: []
    };

    if (roll.length < 2) return res;

    // 1. Batch Check
    const rules = {
      "25": { year: "First year", can_opt: true, can_switch: false, opt_sems: [1, 2], switch_sems: [], max_seq: 500 },
      "24": { year: "Second year", can_opt: false, can_switch: true, opt_sems: [], switch_sems: [3, 4, 5], max_seq: 450 },
      "23": { year: "Third year", can_opt: false, can_switch: true, opt_sems: [], switch_sems: [3, 4, 5], max_seq: 450 },
      "22": { year: "Final year", can_opt: false, can_switch: false, opt_sems: [], switch_sems: [], max_seq: 500 }
    };

    const rule = rules[batch];
    if (!rule) {
      res.warning = `Batch '${batch}' is not currently supported.`;
      return res;
    }

    res.year = rule.year;
    res.isBatchEligible = (rule.can_opt || rule.can_switch);
    res.allowedSems = [...rule.opt_sems, ...rule.switch_sems];

    if (!res.isBatchEligible) {
      res.warning = `${rule.year} students (Batch ${batch}) are not eligible for this module.`;
      return res;
    }

    // 2. Sequence Check (Wait for more chars)
    if (roll.length >= 5) {
      if (sequence === null || isNaN(sequence)) {
        res.warning = "Invalid roll number format.";
      } else if (sequence < 1 || sequence > rule.max_seq) {
        res.warning = `Roll sequence ${sequence} is out of bounds for Batch ${batch} (Max: ${rule.max_seq})`;
      } else {
        res.isValidRoll = true;
      }
    }

    // 3. Semester Check
    if (res.isValidRoll) {
      if (res.allowedSems.includes(semester)) {
        res.isSemesterEligible = true;
      } else {
        res.warning = `Semester ${semester} is not allowed for ${rule.year}. Required: ${res.allowedSems.join(' or ')}`;
      }
    }

    return res;
  }, [selection.roll_no, selection.semester]);

  // ── Effect to auto-select valid semester when batch changes ────
  useEffect(() => {
    if (validation.allowedSems.length > 0 && !validation.allowedSems.includes(selection.semester)) {
      setSelection(prev => ({ ...prev, semester: validation.allowedSems[0] }));
    }
  }, [validation.allowedSems]);

  const toggleKeyword = (kw) => {
    setSelection(prev => {
      const exists = prev.selected_keywords.includes(kw);
      if (exists) return { ...prev, selected_keywords: prev.selected_keywords.filter(k => k !== kw) };
      return { ...prev, selected_keywords: [...prev.selected_keywords, kw] };
    });
  };

  // ── Step 1: Eligibility & Profile ───────────────────────────────────────────
  const Step1 = () => (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <User size={32} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Confirm Your Identity</h2>
        <p style={{ color: '#475569', fontWeight: 500 }}>We'll use your current academic standing to determine eligibility and apply switching penalties.</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Roll Number</label>
          <input
            type="text"
            placeholder="e.g. 24CSU101"
            value={selection.roll_no}
            onChange={(e) => setSelection({ ...selection, roll_no: e.target.value })}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--color-border)', color: '#fff', fontWeight: 600 }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Semester</label>
          <select
            value={selection.semester}
            onChange={(e) => setSelection({ ...selection, semester: parseInt(e.target.value) })}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--color-border)', color: '#fff', outline: 'none' }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Specialization</label>
          <input
            type="text"
            placeholder="None (e.g. Full Stack)"
            value={selection.current_specialization}
            onChange={(e) => setSelection({ ...selection, current_specialization: e.target.value })}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--color-border)', color: '#fff' }}
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', borderRadius: '16px', background: '#6366f1', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        Continue to Skills <ChevronRight size={20} />
      </button>
    </div>
  );

  // ── Step 2: Skills & Keywords ──────────────────────────────────────────────
  const Step2 = () => (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>What are your core skills?</h2>
        <p style={{ color: '#475569', fontWeight: 500 }}>Select at least 2 keywords that represent your current knowledge or deep interests.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
        {config?.keywords && config.keywords.length > 0 ? (
          config.keywords.map(kw => {
            const isActive = selection.selected_keywords.includes(kw);
            return (
              <button
                key={kw}
                onClick={() => toggleKeyword(kw)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '99px',
                  background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  border: '1px solid',
                  borderColor: isActive ? '#6366f1' : 'var(--color-border)',
                  color: isActive ? '#fff' : '#cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {kw}
              </button>
            );
          })
        ) : (
          <div style={{ color: '#f43f5e', textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 1rem' }} />
            <p>No keywords found. Please check if the data files are correctly loaded on the server.</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={handleBack} style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, border: '1px solid var(--color-border)', cursor: 'pointer' }}>Back</button>
        <button
          onClick={handleNext}
          disabled={selection.selected_keywords.length < 2}
          style={{
            flex: 2, padding: '1rem', borderRadius: '16px',
            background: selection.selected_keywords.length < 2 ? '#475569' : '#6366f1',
            color: '#fff', fontWeight: 800, border: 'none',
            cursor: selection.selected_keywords.length < 2 ? 'not-allowed' : 'pointer'
          }}
        >
          Next: Preference Quiz
        </button>
      </div>
    </div>
  );

  // ── Step 3: Questionnaire ──────────────────────────────────────────────────
  const Step3 = () => (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Personalized Preference Quiz</h2>
        <p style={{ color: '#475569', fontWeight: 500 }}>This helps us understand your problem-solving style and working preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        {config?.questionnaire.map((q, idx) => (
          <div key={q.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h4 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: '#6366f1' }}>{idx + 1}.</span> {q.question}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map(opt => (
                <button
                  key={opt.text}
                  onClick={() => setSelection({
                    ...selection,
                    questionnaire_answers: { ...selection.questionnaire_answers, [q.id]: opt.text }
                  })}
                  style={{
                    padding: '1.1rem 1.5rem',
                    borderRadius: '14px',
                    textAlign: 'left',
                    background: selection.questionnaire_answers[q.id] === opt.text ? 'rgba(99, 102, 241, 0.1)' : '#fff',
                    border: '1px solid',
                    borderColor: selection.questionnaire_answers[q.id] === opt.text ? '#6366f1' : '#e2e8f0',
                    color: selection.questionnaire_answers[q.id] === opt.text ? '#6366f1' : '#475569',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selection.questionnaire_answers[q.id] === opt.text ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleBack} style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, border: '1px solid var(--color-border)', cursor: 'pointer' }}>Back</button>
        <button
          onClick={handleSubmit}
          disabled={loading || Object.keys(selection.questionnaire_answers).length < config?.questionnaire.length}
          style={{
            flex: 2, padding: '1rem', borderRadius: '16px',
            background: loading ? '#475569' : '#6366f1',
            color: '#fff', fontWeight: 800, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Analyzing..." : "Get Recommendation"}
        </button>
      </div>
    </div>
  );

  // ── Step 4: Results ────────────────────────────────────────────────────────
  const Step4 = () => {
    if (!result) return null;
    const top = result.top_recommendation;

    return (
      <div className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
            <Sparkles size={14} style={{ marginRight: '0.5rem' }} /> Best Fit Recommendation
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>{top.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#6366f1' }}>{top.score}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Match Score</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--color-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: top.confidence === 'High' ? '#10b981' : '#f59e0b' }}>{top.confidence}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Confidence</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Growth Areas */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '2rem', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Target size={22} color="#f43f5e" /> Growth Areas & Skills
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              To excel in <strong>{top.name}</strong>, you should consider focusing on these keywords/topics that aren't currently in your top list:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {top.growth_areas.map(ga => (
                <div key={ga} style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {ga}
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '2rem', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BrainCircuit size={22} color="#6366f1" /> Scoring Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Keyword Match', value: top.breakdown.keywords, icon: BookOpen, color: '#6366f1' },
                { label: 'Career Alignment', value: top.breakdown.objective, icon: Target, color: '#f59e0b' },
                { label: 'Quiz Preference', value: top.breakdown.quiz, icon: MessageSquare, color: '#10b981' },
                { label: 'Stickiness/History', value: top.breakdown.stickiness, icon: Clock, color: '#8b5cf6' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${item.color}10`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>{item.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.value} pts</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (item.value / 40) * 100)}%`, background: item.color, borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Scoreboard */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>Global Scoreboard</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Track</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Match</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {result.recommendations.map(r => (
                  <tr key={r.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{r.name}</div>
                      {r.key === top.key && <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 800 }}>RECOMMENDED</div>}
                    </td>
                    <td style={{ textAlign: 'right', padding: '1rem', color: '#cbd5e1', fontWeight: 800, fontSize: '1.1rem' }}>{r.score}%</td>
                    <td style={{ textAlign: 'right', padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '8px',
                        background: r.score >= 70 ? 'rgba(16, 185, 129, 0.1)' : r.score >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#94a3b8'
                      }}>
                        {r.score >= 70 ? 'STRONG MATCH' : r.score >= 40 ? 'GOOD POTENTIAL' : 'NICHED PATH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => setStep(1)}
          style={{ width: '100%', marginTop: '3rem', padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 800, border: '1px solid var(--color-border)', cursor: 'pointer' }}
        >
          Retake Assessment
        </button>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '2rem 3rem', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── Background Aesthetics ────────────────────────────── */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(50px)', zIndex: -1 }} />

      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
        {step === 1 ? (
          <div className="fade-in">
            <div style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', borderRadius: '8px', background: '#6366f110', color: '#6366f1', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Step 01 / Eligibility
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
              Let's build your <br /><span style={{ color: '#6366f1' }}>Academic Profile.</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500, maxWidth: '500px', lineHeight: 1.6 }}>
              Confirm your current standing to apply university rules.
            </p>
          </div>
        ) : (
          <div /> // Placeholder to keep progress tracker on the right
        )}

        {/* Progress Tracker */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#fff', padding: '0.75rem 1.5rem', borderRadius: '99px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  background: s === step ? '#6366f1' : s < step ? '#10b981' : '#f1f5f9',
                  color: s <= step ? '#fff' : '#94a3b8',
                  fontSize: '0.75rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s'
                }}>
                  {s < step ? '✓' : s}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s === step ? '#0f172a' : '#94a3b8' }}>
                  {s === 1 ? 'Identity' : s === 2 ? 'Skills' : 'Quiz'}
                </span>
                {s < 3 && <div style={{ width: '20px', height: '1px', background: '#f1f5f9' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Steps Rendering ────────────────────────────────────── */}
      {step === 1 && (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            {/* Roll Number Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID / Roll No</label>
                {validation.isValidRoll && !validation.warning && (
                  <div style={{ padding: '0.3rem 0.75rem', borderRadius: '99px', background: '#10b98110', color: '#10b981', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #10b98120' }}>
                    <CheckCircle size={12} /> {validation.year}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. 24CSU101"
                value={selection.roll_no}
                onChange={(e) => setSelection({ ...selection, roll_no: e.target.value })}
                style={{ width: '100%', height: '48px', padding: '0 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', textTransform: 'uppercase', outline: 'none' }}
              />
              {validation.warning && (
                <div style={{ color: '#f43f5e', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={14} /> {validation.warning}
                </div>
              )}
            </div>

            {/* Semester Selection */}
            {validation.isBatchEligible && validation.isValidRoll && (
              <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Current Semester</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selection.semester}
                    onChange={(e) => setSelection({ ...selection, semester: parseInt(e.target.value) })}
                    style={{ width: '100%', height: '48px', padding: '0 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s} disabled={!validation.allowedSems.includes(s)}>
                        Semester {s} {!validation.allowedSems.includes(s) ? '(Ineligible)' : ''}
                      </option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                    <Clock size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* Current Specialization Dropdown */}
            {validation.isSemesterEligible && (
              <div className="fade-in" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Current Specialization <span style={{ opacity: 0.5 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={selection.current_specialization}
                    onChange={(e) => setSelection({...selection, current_specialization: e.target.value})}
                    style={{ width: '100%', height: '48px', padding: '0 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">None / Pending</option>
                    <option value="AI_ML">AI & Machine Learning</option>
                    <option value="DATA_SCIENCE">Data Science</option>
                    <option value="CYBER_SECURITY">Cyber Security</option>
                    <option value="FULL_STACK">Full Stack Development</option>
                    <option value="GAME_TECH">Game Technology</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                    <Target size={16} />
                  </div>
                </div>
              </div>
            )}

            {validation.isSemesterEligible && (
              <button
                onClick={handleNext}
                className="fade-in"
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: '#6366f1', color: '#fff', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
              >
                Continue to Skills <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>What are your core skills?</h2>
            <p style={{ color: '#475569', fontWeight: 500 }}>Select at least 2 keywords that represent your current knowledge or deep interests.</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {config?.keywords && config.keywords.length > 0 ? (
              config.keywords.map(kw => {
                const isActive = selection.selected_keywords.includes(kw);
                return (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '99px',
                      background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      border: '1px solid',
                      borderColor: isActive ? '#6366f1' : '#e2e8f0',
                      color: isActive ? '#fff' : '#475569',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    {kw}
                  </button>
                );
              })
            ) : (
              <div style={{ color: '#f43f5e', textAlign: 'center', padding: '2rem' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 1rem' }} />
                <p>No keywords found. Please check if the data files are correctly loaded on the server.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            <button onClick={handleBack} style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#475569', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}>Back</button>
            <button
              onClick={handleNext}
              disabled={selection.selected_keywords.length < 2}
              style={{
                flex: 2, padding: '1rem', borderRadius: '16px',
                background: selection.selected_keywords.length < 2 ? '#94a3b8' : '#6366f1',
                color: '#fff', fontWeight: 800, border: 'none',
                cursor: selection.selected_keywords.length < 2 ? 'not-allowed' : 'pointer',
                boxShadow: selection.selected_keywords.length < 2 ? 'none' : '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
              }}
            >
              Next: Preference Quiz
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Personalized Preference Quiz</h2>
            <p style={{ color: '#475569', fontWeight: 500 }}>This helps us understand your problem-solving style and working preferences.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
            {config?.questionnaire.map((q, idx) => (
              <div key={q.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: '#6366f1' }}>{idx + 1}.</span> {q.question}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.options.map(opt => (
                    <button
                      key={opt.text}
                      onClick={() => setSelection({
                        ...selection,
                        questionnaire_answers: { ...selection.questionnaire_answers, [q.id]: opt.text }
                      })}
                      style={{
                        padding: '1.1rem 1.5rem',
                        borderRadius: '14px',
                        textAlign: 'left',
                        background: selection.questionnaire_answers[q.id] === opt.text ? 'rgba(99, 102, 241, 0.1)' : '#fff',
                        border: '1px solid',
                        borderColor: selection.questionnaire_answers[q.id] === opt.text ? '#6366f1' : '#e2e8f0',
                        color: selection.questionnaire_answers[q.id] === opt.text ? '#6366f1' : '#475569',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selection.questionnaire_answers[q.id] === opt.text ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleBack} style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, border: '1px solid var(--color-border)', cursor: 'pointer' }}>Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading || Object.keys(selection.questionnaire_answers).length < config?.questionnaire.length}
              style={{
                flex: 2, padding: '1rem', borderRadius: '16px',
                background: loading ? '#475569' : '#6366f1',
                color: '#fff', fontWeight: 800, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "Analyzing..." : "Get Recommendation"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="fade-in">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
              <Sparkles size={14} style={{ marginRight: '0.5rem' }} /> Best Fit Recommendation
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>{result.top_recommendation.name}</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#6366f1' }}>{result.top_recommendation.score}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Match Score</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'var(--color-border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: result.top_recommendation.confidence === 'High' ? '#10b981' : '#f59e0b' }}>{result.top_recommendation.confidence}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Confidence</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Growth Areas */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '2rem', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Target size={22} color="#f43f5e" /> Growth Areas & Skills
              </h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                To excel in <strong>{result.top_recommendation.name}</strong>, you should consider focusing on these keywords/topics that aren't currently in your top list:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {result.top_recommendation.growth_areas.map(ga => (
                  <div key={ga} style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {ga}
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '2rem', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BrainCircuit size={22} color="#6366f1" /> Scoring Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { label: 'Keyword Match', value: result.top_recommendation.breakdown.keywords, icon: BookOpen, color: '#6366f1' },
                  { label: 'Career Alignment', value: result.top_recommendation.breakdown.objective, icon: Target, color: '#f59e0b' },
                  { label: 'Quiz Preference', value: result.top_recommendation.breakdown.quiz, icon: MessageSquare, color: '#10b981' },
                  { label: 'Stickiness/History', value: result.top_recommendation.breakdown.stickiness, icon: Clock, color: '#8b5cf6' }
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${item.color}10`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{item.label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{item.value} pts</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (item.value / 40) * 100)}%`, background: item.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            style={{ width: '100%', marginTop: '3rem', padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#0f172a', fontWeight: 800, border: '1px solid var(--color-border)', cursor: 'pointer' }}
          >
            Retake Assessment
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default Specialization;
