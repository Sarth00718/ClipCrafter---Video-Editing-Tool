import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, Copy, Download, Image as ImageIcon, RefreshCw, FileText,
  Layout, Mic, Clock, Compass, Shield, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Pencil, Save, Play, Pause,
  Layers, Sparkles,
} from 'lucide-react';
import { sceneService } from '../../services/index.js';
import { Spinner, ProgressBar } from '../ui/index.jsx';
import { formatDuration } from '../../utils/formatters.js';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const PIPELINE_STEPS = [
  { id: 'plan', label: 'Plan', icon: Layers },
  { id: 'draft', label: 'Draft', icon: FileText },
  { id: 'review', label: 'Review', icon: Shield },
  { id: 'refine', label: 'Refine', icon: Sparkles },
  { id: 'export', label: 'Export', icon: Download },
];

const DETAIL_TABS = [
  { id: 'script', label: 'Script', icon: FileText },
  { id: 'visuals', label: 'Visuals', icon: ImageIcon },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'timing', label: 'Timing', icon: Clock },
  { id: 'directions', label: 'Directions', icon: Compass },
];

const confidenceColor = (score) => {
  if (score == null) return 'var(--text-muted)';
  if (score >= 0.9) return '#4ade80';
  if (score >= 0.7) return '#fbbf24';
  return '#f87171';
};

const severityStyle = (severity) => {
  if (severity === 'high') return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171' };
  if (severity === 'medium') return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' };
  return { bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.3)', color: 'var(--gold-primary)' };
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Storyboard({ videoId, isOpen, onClose, videoStatus = 'completed' }) {
  /* ── State ── */
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState('script');
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('review');

  /* per-scene editing state */
  const [editingScript, setEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState('');
  const [savingScript, setSavingScript] = useState(false);

  const [visualDraft, setVisualDraft] = useState('');
  const [savingVisual, setSavingVisual] = useState(false);

  const [regenLoading, setRegenLoading] = useState(null); // 'visuals'|'audio'
  const [factChecking, setFactChecking] = useState(false);
  const [factResults, setFactResults] = useState(null);
  const [approvals, setApprovals] = useState({}); // sceneId -> 'approved'|'rejected'|null

  /* agentic controls */
  const [depth, setDepth] = useState('Expert');
  const [tone, setTone] = useState('Conversational');
  const [pendingEdits, setPendingEdits] = useState({});
  const [applyingAll, setApplyingAll] = useState(false);

  /* audio player */
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  /* image blur-up */
  const [imgLoaded, setImgLoaded] = useState(false);

  /* scene tab refs */
  const tabStripRef = useRef(null);
  const tabRefs = useRef({});

  /* ── Fetch ── */
  useEffect(() => {
    if (isOpen && videoId) {
      setLoading(true);
      sceneService.getByVideoId(videoId)
        .then(res => {
          const sc = res.data?.data?.scenes || res.data?.data || [];
          setScenes(sc);
          if (sc.length > 0) {
            setSelectedScene(sc[0]);
            setScriptDraft(sc[0].scriptText || '');
            setVisualDraft(sc[0].visualPrompt || '');
          }
        })
        .catch(() => toast.error('Failed to load storyboard'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, videoId]);

  /* sync draft when scene changes */
  useEffect(() => {
    if (selectedScene) {
      setScriptDraft(selectedScene.scriptText || '');
      setVisualDraft(selectedScene.visualPrompt || '');
      setEditingScript(false);
      setFactResults(null);
      setImgLoaded(false);
      setAudioPlaying(false);
    }
  // We intentionally use selectedScene?._id (primitive) as the dep — not the whole object
  }, [selectedScene?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* scroll selected tab into view */
  useEffect(() => {
    if (selectedScene && tabRefs.current[selectedScene._id] && tabStripRef.current) {
      tabRefs.current[selectedScene._id].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedScene?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived ── */
  const totalDuration = scenes.reduce((s, sc) => s + (sc.duration || 0), 0);

  const sceneCumulativeStart = useCallback((sceneId) => {
    let acc = 0;
    for (const sc of scenes) {
      if (sc._id === sceneId) break;
      acc += sc.duration || 0;
    }
    return acc;
  }, [scenes]);

  const fullScript = scenes.map(sc => sc.scriptText || '').filter(Boolean).join('\n\n');

  /* ── Handlers ── */
  const handleCopyScript = () => {
    navigator.clipboard.writeText(fullScript).then(() => toast.success('Script copied!'));
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ scenes, totalDuration }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-${videoId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded storyboard JSON');
  };

  const handleSaveScript = async () => {
    if (!selectedScene) return;
    setSavingScript(true);
    try {
      const res = await sceneService.update(selectedScene._id, { script: scriptDraft });
      const updated = res.data?.data?.scene || res.data?.data;
      if (updated) updateSceneLocally(updated);
      toast.success('Script saved');
      setEditingScript(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save script');
    } finally { setSavingScript(false); }
  };

  const handleSaveVisual = async () => {
    if (!selectedScene) return;
    setSavingVisual(true);
    try {
      const res = await sceneService.update(selectedScene._id, { visualPrompt: visualDraft });
      const updated = res.data?.data?.scene || res.data?.data;
      if (updated) updateSceneLocally(updated);
      toast.success('Visual prompt saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save visual prompt');
    } finally { setSavingVisual(false); }
  };

  const handleRegen = async (type) => {
    if (!selectedScene) return;
    setRegenLoading(type);
    try {
      const res = await sceneService.regenerate(selectedScene._id, type);
      const updated = res.data?.data?.scene || res.data?.data;
      if (updated) updateSceneLocally(updated);
      toast.success(`${type === 'visuals' ? 'Visual' : 'Audio'} regenerated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to regenerate ${type}`);
    } finally { setRegenLoading(null); }
  };

  const handleFactCheck = async () => {
    if (!selectedScene) return;
    setFactChecking(true);
    try {
      const res = await sceneService.factCheck(selectedScene._id);
      const result = res.data?.data;
      setFactResults(result);
      if (result?.confidenceScore != null) {
        updateSceneLocally({ ...selectedScene, confidenceScore: result.confidenceScore });
      }
      toast.success('Fact-check complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fact-check failed');
    } finally { setFactChecking(false); }
  };

  const handleApproval = (sceneId, state) => {
    setApprovals(prev => ({ ...prev, [sceneId]: prev[sceneId] === state ? null : state }));
  };

  const updateSceneLocally = (updated) => {
    setScenes(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
    setSelectedScene(prev => prev?._id === updated._id ? { ...prev, ...updated } : prev);
  };

  const handleDepthChange = async (newDepth) => {
    setDepth(newDepth);
    if (!selectedScene) return;
    setPendingEdits(prev => ({ ...prev, depth: newDepth }));
  };

  const handleToneChange = async (newTone) => {
    setTone(newTone);
    if (!selectedScene) return;
    setPendingEdits(prev => ({ ...prev, tone: newTone }));
  };

  const handleApplyAll = async () => {
    if (!selectedScene || Object.keys(pendingEdits).length === 0) return;
    setApplyingAll(true);
    const instructions = Object.entries(pendingEdits)
      .map(([k, v]) => `Adjust ${k} to ${v}`)
      .join('. ');
    try {
      const res = await sceneService.update(selectedScene._id, { editInstructions: instructions });
      const updated = res.data?.data?.scene || res.data?.data;
      if (updated) updateSceneLocally(updated);
      setPendingEdits({});
      toast.success('All changes applied');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply changes');
    } finally { setApplyingAll(false); }
  };

  const handleExportPipeline = () => {
    handleDownload();
    setPipelineStep('export');
  };

  /* ── Guard ── */
  if (!isOpen) return null;

  /* ── Status pill ── */
  const StatusPill = () => {
    const map = {
      processing: { color: '#60a5fa', dot: '#3b82f6', label: 'Processing', pulse: true },
      completed: { color: '#4ade80', dot: '#22c55e', label: 'Ready', pulse: false },
      failed: { color: '#f87171', dot: '#ef4444', label: 'Failed', pulse: false },
    };
    const s = map[videoStatus] || map.processing;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 100, background: `${s.dot}18`, border: `1px solid ${s.dot}44`, fontSize: '0.75rem', fontWeight: 600, color: s.color }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, boxShadow: `0 0 0 2px ${s.dot}33`, animation: s.pulse ? 'sbPulse 1.4s ease infinite' : 'none' }} />
        {s.label}
      </span>
    );
  };

  /* ── Tab content renderers ── */
  const renderScript = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Script Line */}
      <div>
        <div style={sectionLabel}><FileText size={13} /> Script Line</div>
        {editingScript ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              className="input-neu"
              value={scriptDraft}
              onChange={e => setScriptDraft(e.target.value)}
              rows={6}
              style={{ resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.7 }}
              data-cursor="text"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary btn-sm" onClick={handleSaveScript} disabled={savingScript} data-cursor="pointer">
                {savingScript ? <><Spinner size={12} /> Saving…</> : <><Save size={12} /> Save</>}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => { setEditingScript(false); setScriptDraft(selectedScene.scriptText || ''); }} data-cursor="pointer">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ ...scriptBox, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--text-primary)' }}>
              {selectedScene?.scriptText || <em style={{ color: 'var(--text-muted)' }}>No script text available</em>}
            </div>
            <button className="btn-icon" onClick={() => setEditingScript(true)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28 }} title="Edit script" data-cursor="pointer">
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Text Overlays */}
      <div>
        <div style={sectionLabel}><Layout size={13} /> Text Overlays</div>
        <div style={scriptBox}>
          {selectedScene?.subtitle || selectedScene?.textOverlay
            ? (selectedScene.subtitle || selectedScene.textOverlay)
            : <em style={{ color: 'var(--text-muted)' }}>No text overlays defined</em>}
        </div>
      </div>
    </div>
  );

  const renderVisuals = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={sectionLabel}><ImageIcon size={13} /> Visual Prompt</div>
      <textarea
        className="input-neu"
        value={visualDraft}
        onChange={e => setVisualDraft(e.target.value)}
        rows={5}
        style={{ resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.7 }}
        data-cursor="text"
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-primary btn-sm" onClick={handleSaveVisual} disabled={savingVisual} data-cursor="pointer">
          {savingVisual ? <><Spinner size={12} /> Saving…</> : 'Apply'}
        </button>
        <button className="btn-ghost btn-sm" onClick={() => handleRegen('visuals')} disabled={regenLoading === 'visuals'} data-cursor="pointer">
          {regenLoading === 'visuals' ? <><Spinner size={12} /> Regenerating…</> : <><RefreshCw size={12} /> Regenerate</>}
        </button>
      </div>
    </div>
  );

  const renderAudio = () => {
    const audioUrl = selectedScene?.voiceoverUrl || selectedScene?.audioUrl;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {audioUrl ? (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, border: '1px solid var(--border-default)' }}>
            <div style={sectionLabel}><Mic size={13} /> Audio Track</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button
                className="btn-icon"
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--audio-btn-bg)', border: 'none', color: 'var(--audio-btn-text)', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--audio-btn-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--audio-btn-bg)'}
                onClick={() => {
                  if (audioRef.current) {
                    audioPlaying ? audioRef.current.pause() : audioRef.current.play();
                    setAudioPlaying(!audioPlaying);
                  }
                }}
                data-cursor="pointer"
              >
                {audioPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setAudioPlaying(false)}
                style={{ flex: 1, height: 36, borderRadius: 8, outline: 'none', width: '100%' }}
                controls
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Mic size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p>No audio generated yet</p>
            <button className="btn-ghost btn-sm" onClick={() => handleRegen('audio')} disabled={regenLoading === 'audio'} style={{ marginTop: 12 }} data-cursor="pointer">
              {regenLoading === 'audio' ? <><Spinner size={12} /> Generating…</> : <><Mic size={12} /> Generate Audio</>}
            </button>
          </div>
        )}

        {/* Voice tone pills */}
        <div>
          <div style={sectionLabel}><Mic size={13} /> Voice Tone</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {['Professional', 'Conversational', 'Academic'].map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={tone === t ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                data-cursor="pointer"
                style={tone === t ? { padding: '5px 14px' } : { padding: '5px 14px' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTiming = () => {
    const dur = selectedScene?.duration || 0;
    const startTime = sceneCumulativeStart(selectedScene?._id);
    const proportion = totalDuration > 0 ? (dur / totalDuration) * 100 : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={statBox}>
            <span style={statLabel}>Estimated Duration</span>
            <span style={statValue}>{formatDuration(dur)}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dur.toFixed(2)}s</span>
          </div>
          <div style={statBox}>
            <span style={statLabel}>Scene Start</span>
            <span style={statValue}>{formatDuration(startTime)}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>from beginning</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={sectionLabel}><Clock size={13} /> Proportion of Total</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 600 }}>{proportion.toFixed(1)}%</span>
          </div>
          <ProgressBar value={proportion} height={8} />
        </div>

        <div>
          <div style={sectionLabel}><Layout size={13} /> Scene Order</div>
          <input
            type="number"
            className="input-neu"
            defaultValue={selectedScene?.sceneNumber}
            min={1}
            max={scenes.length}
            style={{ width: 100, fontSize: '0.9rem' }}
            data-cursor="text"
            onChange={e => {
              const order = parseInt(e.target.value);
              if (order >= 1 && order <= scenes.length) {
                setPendingEdits(prev => ({ ...prev, sceneOrder: order }));
              }
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>of {scenes.length}</span>
        </div>
      </div>
    );
  };

  const renderDirections = () => {
    const score = selectedScene?.confidenceScore;
    const scoreColor = confidenceColor(score);
    const factIssues = factResults?.issues || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Source ref */}
        {selectedScene?.sourceReference && (
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-default)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            📎 Generated from <strong style={{ color: 'var(--gold-primary)' }}>{selectedScene.sourceReference}</strong>
          </div>
        )}

        {/* Confidence score */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={sectionLabel}><Shield size={13} /> Confidence Score</div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor }}>
              {score != null ? `${Math.round(score * 100)}%` : 'N/A'}
            </span>
          </div>
          <ProgressBar
            value={score != null ? score * 100 : 0}
            height={8}
          />
          <div style={{ marginTop: 4, fontSize: '0.72rem', color: scoreColor }}>
            {score == null ? 'Not yet assessed' : score >= 0.9 ? '✓ High confidence' : score >= 0.7 ? '⚠ Moderate confidence' : '✗ Low confidence — review needed'}
          </div>
        </div>

        {/* Fact check button */}
        <button className="btn-ghost btn-sm" onClick={handleFactCheck} disabled={factChecking} style={{ alignSelf: 'flex-start' }} data-cursor="pointer">
          {factChecking ? <><Spinner size={12} /> Checking…</> : <><Shield size={12} /> Fact Check</>}
        </button>

        {/* Fact results */}
        {factResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {factIssues.length === 0 ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '0.82rem' }}>
                ✓ No issues found
              </div>
            ) : factIssues.map((issue, i) => {
              const sty = severityStyle(issue.severity);
              return (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: sty.bg, border: `1px solid ${sty.border}`, fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: sty.color, marginBottom: 4, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>{issue.severity} severity</div>
                  <p style={{ color: 'var(--text-primary)', margin: 0 }}>{issue.claim || issue.description}</p>
                  {issue.description && issue.claim && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4, margin: 0 }}>{issue.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Approve / Reject */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => handleApproval(selectedScene?._id, 'approved')}
            style={{
              ...pillBtn,
              background: approvals[selectedScene?._id] === 'approved' ? 'rgba(74,222,128,0.18)' : 'transparent',
              border: `1px solid ${approvals[selectedScene?._id] === 'approved' ? 'rgba(74,222,128,0.5)' : 'var(--border-default)'}`,
              color: '#4ade80',
            }}
            data-cursor="pointer"
          >
            <CheckCircle size={14} /> Approve Scene
          </button>
          <button
            onClick={() => handleApproval(selectedScene?._id, 'rejected')}
            style={{
              ...pillBtn,
              background: approvals[selectedScene?._id] === 'rejected' ? 'rgba(239,68,68,0.18)' : 'transparent',
              border: `1px solid ${approvals[selectedScene?._id] === 'rejected' ? 'rgba(239,68,68,0.5)' : 'var(--border-default)'}`,
              color: '#f87171',
            }}
            data-cursor="pointer"
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>
    );
  };

  const TAB_RENDERERS = { script: renderScript, visuals: renderVisuals, audio: renderAudio, timing: renderTiming, directions: renderDirections };

  /* ─── Render ─── */
  return (
    <>
      <style>{`
        @keyframes sbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes sbFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sb-scene-tab::-webkit-scrollbar { height: 4px; }
        .sb-scene-tab::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 2px; }
        .sb-scrollable::-webkit-scrollbar { width: 4px; }
        .sb-scrollable::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 2px; }
        @media (max-width: 700px) {
          .sb-body-grid { flex-direction: column !important; }
          .sb-left-panel { max-height: 280px; }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 1120,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.55), var(--shadow-glow)',
              }}
            >
              {/* ──── HEADER ──── */}
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
                {/* Row 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
                    Story<span className="gradient-text">board</span>
                  </h2>
                  <button className="btn-icon" onClick={onClose} data-cursor="pointer" style={{ width: 32, height: 32 }}><X size={16} /></button>
                </div>

                {/* Row 2 — meta + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <StatusPill />

                  <span style={metaChip}>
                    <Layers size={12} /> {scenes.length} Scene{scenes.length !== 1 ? 's' : ''}
                  </span>

                  <span style={metaChip}>
                    <Clock size={12} /> {totalDuration.toFixed(2)}s
                  </span>

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn-ghost btn-sm" onClick={handleCopyScript} data-cursor="pointer">
                      <Copy size={13} /> Copy
                    </button>
                    <button className="btn-ghost btn-sm" onClick={handleDownload} data-cursor="pointer">
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>

                {/* Pipeline Stepper (collapsible) */}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => setPipelineOpen(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', padding: 0 }}
                    data-cursor="pointer"
                  >
                    {pipelineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Pipeline Status
                  </button>

                  <AnimatePresence>
                    {pipelineOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-default)' }}>
                          {PIPELINE_STEPS.map((step, i) => {
                            const isActive = step.id === pipelineStep;
                            const isPast = PIPELINE_STEPS.findIndex(s => s.id === pipelineStep) > i;
                            const Icon = step.icon;
                            return (
                              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <button
                                  onClick={() => step.id === 'export' ? handleExportPipeline() : setPipelineStep(step.id)}
                                  style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
                                    flex: 1,
                                    color: isActive ? 'var(--gold-primary)' : isPast ? '#4ade80' : 'var(--text-muted)',
                                  }}
                                  data-cursor="pointer"
                                >
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--gold-subtle)' : isPast ? 'rgba(74,222,128,0.1)' : 'var(--bg-card)', border: `2px solid ${isActive ? 'var(--gold-primary)' : isPast ? 'rgba(74,222,128,0.5)' : 'var(--border-default)'}` }}>
                                    {isPast ? <CheckCircle size={13} color="#4ade80" /> : <Icon size={13} />}
                                  </div>
                                  <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500, letterSpacing: '0.04em' }}>{step.label}</span>
                                </button>
                                {i < PIPELINE_STEPS.length - 1 && (
                                  <div style={{ flex: 1, height: 2, background: isPast ? 'rgba(74,222,128,0.4)' : 'var(--border-default)', borderRadius: 1, maxWidth: 28 }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ──── SCENE TAB STRIP ──── */}
              <div
                ref={tabStripRef}
                className="sb-scene-tab"
                style={{ display: 'flex', gap: 10, padding: '12px 24px', overflowX: 'auto', borderBottom: '1px solid var(--border-default)', flexShrink: 0, background: 'var(--bg-secondary)' }}
              >
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ width: 90, height: 58, borderRadius: 10, flexShrink: 0 }} />
                  ))
                ) : scenes.map((sc) => {
                  const isSelected = sc._id === selectedScene?._id;
                  const approval = approvals[sc._id];
                  return (
                    <button
                      key={sc._id}
                      ref={el => tabRefs.current[sc._id] = el}
                      onClick={() => setSelectedScene(sc)}
                      data-cursor="pointer"
                      style={{
                        flexShrink: 0,
                        width: 90,
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? 'var(--gold-primary)' : approval === 'approved' ? 'rgba(74,222,128,0.5)' : approval === 'rejected' ? 'rgba(239,68,68,0.4)' : 'var(--border-default)'}`,
                        background: isSelected ? 'var(--bg-card)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: isSelected ? '0 4px 20px rgba(201,168,76,0.25)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.18s ease',
                        position: 'relative',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Scene</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{sc.sceneNumber}</span>
                      {approval && (
                        <div style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: '50%', background: approval === 'approved' ? '#4ade80' : '#f87171' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ──── BODY ──── */}
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spinner size={36} />
                </div>
              ) : !selectedScene ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No scenes found for this video.
                </div>
              ) : (
                <div className="sb-body-grid" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

                  {/* ── LEFT PANEL — Visual ── */}
                  <div className="sb-left-panel sb-scrollable" style={{ width: 320, minWidth: 270, borderRight: '1px solid var(--border-default)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--bg-secondary)', flexShrink: 0, padding: '20px 18px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <ImageIcon size={12} /> Visual
                    </div>

                    {/* Image */}
                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', marginBottom: 14, minHeight: 160, maxHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedScene.visualUrl || selectedScene.clipUrl ? (
                        <>
                          {!imgLoaded && <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>}
                          <img
                            src={selectedScene.visualUrl || selectedScene.clipUrl}
                            alt={`Scene ${selectedScene.sceneNumber}`}
                            loading="lazy"
                            onLoad={() => setImgLoaded(true)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: 220, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease', borderRadius: 12 }}
                          />
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24, color: 'var(--text-muted)' }}>
                          <ImageIcon size={32} strokeWidth={1.2} />
                          <span style={{ fontSize: '0.8rem' }}>No visual generated yet</span>
                        </div>
                      )}
                    </div>

                    {/* Visual description */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                        <ImageIcon size={11} /> Visual Description
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', fontSize: '0.8rem', lineHeight: 1.65, color: 'var(--text-secondary)', border: '1px solid var(--border-default)', minHeight: 48 }}>
                        {selectedScene.visualPrompt || <em style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No visual description available</em>}
                      </div>
                    </div>

                    {/* Regenerate button */}
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => handleRegen('visuals')}
                      disabled={regenLoading === 'visuals'}
                      style={{ alignSelf: 'flex-start' }}
                      data-cursor="pointer"
                    >
                      {regenLoading === 'visuals' ? <><Spinner size={12} /> Regenerating…</> : <><RefreshCw size={12} /> Regenerate Visual</>}
                    </button>
                  </div>

                  {/* ── RIGHT PANEL — Details ── */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                    {/* Sub-tabs */}
                    <div style={{ padding: '14px 20px 0', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: 4, flexShrink: 0, overflowX: 'auto' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 8, flexShrink: 0 }}>Details</div>
                      {DETAIL_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeDetailTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveDetailTab(tab.id)}
                            data-cursor="pointer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '7px 14px', borderRadius: '8px 8px 0 0',
                              border: 'none', background: isActive ? 'var(--bg-card)' : 'transparent',
                              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                              color: isActive ? 'var(--gold-primary)' : 'var(--text-muted)',
                              borderBottom: isActive ? '2px solid var(--gold-primary)' : '2px solid transparent',
                              transition: 'all 0.18s ease',
                              whiteSpace: 'nowrap', flexShrink: 0,
                            }}
                          >
                            <Icon size={13} />{tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab content */}
                    <div className="sb-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeDetailTab}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.16 }}
                        >
                          {TAB_RENDERERS[activeDetailTab]?.()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* ──── AGENTIC CONTROLS BAR ──── */}
              <div style={{ borderTop: '1px solid var(--border-default)', padding: '12px 20px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
                {/* Depth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={controlLabel}>Depth</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Expert', 'Beginner-friendly'].map(d => (
                      <button key={d} onClick={() => handleDepthChange(d)} className={depth === d ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} style={{ padding: '4px 12px', fontSize: '0.75rem' }} data-cursor="pointer">{d}</button>
                    ))}
                  </div>
                </div>

                <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

                {/* Tone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={controlLabel}>Tone</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Technical', 'Conversational', 'Policy-focused'].map(t => (
                      <button key={t} onClick={() => handleToneChange(t)} className={tone === t ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} style={{ padding: '4px 12px', fontSize: '0.75rem' }} data-cursor="pointer">{t}</button>
                    ))}
                  </div>
                </div>

                <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

                {/* Claim controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={controlLabel}>Claims</span>
                  <button
                    onClick={() => selectedScene && handleApproval(selectedScene._id, 'approved')}
                    style={{ ...pillBtn, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', padding: '4px 12px', fontSize: '0.75rem' }}
                    data-cursor="pointer"
                  >
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button
                    onClick={() => selectedScene && handleApproval(selectedScene._id, 'rejected')}
                    style={{ ...pillBtn, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', padding: '4px 12px', fontSize: '0.75rem' }}
                    data-cursor="pointer"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>

                {/* Apply All — far right */}
                <button
                  className="btn-primary btn-sm"
                  onClick={handleApplyAll}
                  disabled={applyingAll || Object.keys(pendingEdits).length === 0}
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                  data-cursor="pointer"
                >
                  {applyingAll ? <><Spinner size={12} /> Applying…</> : <><Save size={12} /> Apply All Changes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED STYLE OBJECTS
───────────────────────────────────────────────────────────────────────────── */
const metaChip = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '3px 10px', borderRadius: 100,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
  fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
};

const sectionLabel = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  marginBottom: 8,
};

const scriptBox = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: 10, padding: '10px 12px',
  fontSize: '0.84rem', lineHeight: 1.7,
  color: 'var(--text-secondary)',
  minHeight: 56, whiteSpace: 'pre-wrap',
};

const statBox = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: 10, padding: '10px 14px',
  display: 'flex', flexDirection: 'column', gap: 2,
};
const statLabel = { fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 };
const statValue = { fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--text-primary)' };

const controlLabel = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
};

const pillBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 14px', borderRadius: 100,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
  fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.18s ease',
};
