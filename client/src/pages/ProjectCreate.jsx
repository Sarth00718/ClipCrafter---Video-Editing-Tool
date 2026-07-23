import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Briefcase, MessageCircle, BookOpen, ChevronLeft, ChevronRight, Check, FileText, Upload, X } from 'lucide-react';
import { projectService, videoService } from '../services/index.js';
import { Spinner } from '../components/ui/index.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import { pageTransition } from '../utils/animations.js';
import { formatDurationLong } from '../utils/formatters.js';
import { Link } from 'react-router-dom';

const STYLES = [
  { key: 'professional', icon: Briefcase, label: 'Professional', desc: 'Formal, technical, precise' },
  { key: 'conversational', icon: MessageCircle, label: 'Conversational', desc: 'Engaging, accessible, clear' },
  { key: 'academic', icon: BookOpen, label: 'Academic', desc: 'Scholarly, detailed, citation-rich' },
];

const STEPS = ['About', 'Configure', 'Review'];

export default function ProjectCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('professional');
  const [duration, setDuration] = useState(120);
  const [sourceText, setSourceText] = useState('');
  const [file, setFile] = useState(null);

  const validateStep = () => {
    if (step === 0) {
      if (!title.trim() || title.length < 3) { toast.error('Please enter a project title (min 3 characters)'); return false; }
      if (!description.trim()) { toast.error('Please describe your project topic'); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 2)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!sourceText.trim() && !file) { toast.error('Please provide source text or upload a document'); return; }
    setLoading(true);
    try {
      // Create project
      const projRes = await projectService.create({ title, description, sourceType: style === 'academic' ? 'research-paper' : 'text' });
      const project = projRes.data.data;

      // Generate video
      await videoService.generate({ text: sourceText || title, projectId: project._id, title: title });
      toast.success('Project created! Generating video...');
      navigate(`/projects/${project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f) setFile(f);
  };

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Header */}
        <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)' }}>
          <Link to="/dashboard" className="btn-ghost btn-sm" data-cursor="pointer">
            <ChevronLeft size={16} /> Back
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < step ? 'var(--gradient-primary)' : i === step ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                  border: i === step ? '2px solid var(--primary)' : '2px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: i < step ? 'white' : i === step ? 'var(--primary)' : 'var(--text-muted)',
                  flexShrink: 0, transition: 'all 0.3s',
                }}>
                  {i < step ? <Check size={14} color="white" /> : i + 1}
                </div>
                <span style={{ fontSize: '0.8rem', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div style={{ width: 32, height: 1, background: i < step ? 'var(--primary)' : 'var(--border-default)' }} />}
              </div>
            ))}
          </div>
          <ThemeToggle size="sm" />
        </div>

        {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 0 ? 0 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 0 — About */}
              {step === 0 && (
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>What's your project about?</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Tell us about the content you want to turn into a video.</p>

                  <div className="form-group">
                    <label className="form-label">Project Title</label>
                    <input className="input-neu" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Climate Change Research Summary" data-cursor="text" maxLength={200} />
                    <div className="form-hint" style={{ textAlign: 'right' }}>{title.length}/200</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic / Description</label>
                    <textarea className="input-neu" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Briefly describe what this video is about..." data-cursor="text" maxLength={500} />
                    <div className="form-hint" style={{ textAlign: 'right' }}>{description.length}/500</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Video Style</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {STYLES.map(({ key, icon: Icon, label, desc }) => (
                        <button
                          key={key}
                          onClick={() => setStyle(key)}
                          data-cursor="pointer"
                          style={{
                            padding: '16px 12px', borderRadius: 12, border: `2px solid ${style === key ? 'var(--gold-primary)' : 'var(--border-default)'}`,
                            background: style === key ? 'var(--gold-subtle)' : 'var(--bg-elevated)',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                            position: 'relative',
                          }}
                        >
                          {style === key && <div style={{ position: 'absolute', top: 8, right: 8 }}><Check size={12} color="var(--gold-primary)" /></div>}
                          <Icon size={24} color={style === key ? 'var(--gold-primary)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: style === key ? 'var(--gold-light)' : 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 — Configure */}
              {step === 1 && (
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Configure your video</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Set duration and provide source content.</p>

                  <div className="form-group">
                    <label className="form-label">Target Duration — {formatDurationLong(duration)}</label>
                    <input
                      type="range" min={30} max={600} step={30}
                      value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>30s</span><span>1 min</span><span>2 min</span><span>5 min</span><span>10 min</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Source Content (Required)</label>
                    <textarea
                      className="input-neu"
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      rows={6}
                      placeholder="Paste your research paper, lecture notes, or article here..."
                      data-cursor="text"
                    />
                    <p className="form-hint">Document grounding improves accuracy by 94%</p>
                  </div>

                  {/* File upload */}
                  <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      border: `2px dashed ${file ? 'var(--gold-primary)' : 'var(--border-default)'}`,
                      borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer',
                      background: file ? 'var(--gold-subtle)' : 'var(--bg-elevated)',
                      transition: 'all 0.2s', position: 'relative',
                    }}
                    onClick={() => !file && document.getElementById('file-input').click()}
                  >
                    <input id="file-input" type="file" accept=".pdf,.txt,.docx,.pptx,.csv,.xlsx,.md" style={{ display: 'none' }} onChange={onDrop} />
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <FileText size={20} color="var(--gold-primary)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{file.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Drag & drop a document or <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>browse</span></p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>PDF, TXT, DOCX up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2 — Review */}
              {step === 2 && (
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Review & Generate</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Check your settings and kick off AI generation.</p>

                  <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { label: 'Title', value: title },
                        { label: 'Style', value: style },
                        { label: 'Duration', value: formatDurationLong(duration) },
                        { label: 'Source', value: file ? file.name : sourceText ? `${sourceText.slice(0, 60)}...` : 'None' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 12 }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--gold-subtle)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                      ⏱ Estimated generation time: <strong style={{ color: 'var(--text-primary)' }}>30–60 seconds</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                    data-cursor="pointer"
                    style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}
                  >
                    {loading ? <><Spinner size={20} /> Generating...</> : '✦ Create & Generate Video'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
                    Generation takes ~30–60 seconds
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button onClick={back} disabled={step === 0} className="btn-ghost" data-cursor="pointer" style={{ opacity: step === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={16} /> Back
            </button>
            {step < 2 && (
              <button onClick={next} className="btn-primary" data-cursor="pointer">
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
      <style>{`@media (max-width: 1023px) { div[style*="marginLeft: 240px"] { margin-left: 0 !important; } }`}</style>
    </motion.div>
  );
}
