import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Film, Edit3, Play, Shield, Mic, Image,
  RotateCcw, Wand2, AlertCircle, Clock, Hash
} from 'lucide-react';
import { videoService, sceneService, editService } from '../services/index.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import { ProgressBar, Spinner } from '../components/ui/index.jsx';
import FactCheckModal from '../components/editor/FactCheckModal.jsx';
import { formatDate, formatRelative } from '../utils/formatters.js';
import { pageTransition, staggerContainer, fadeInUp } from '../utils/animations.js';

const STATUS_COLORS = {
  pending: '#9ca3af',
  processing: '#fbbf24',
  completed: '#4ade80',
  failed: '#f87171',
  uploaded: '#60a5fa',
};

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editHistory, setEditHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [factChecking, setFactChecking] = useState(false);
  const [factResult, setFactResult] = useState(null);
  const [showFactModal, setShowFactModal] = useState(false);
  const [savingScene, setSavingScene] = useState(false);
  const [script, setScript] = useState('');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [aiEditing, setAiEditing] = useState(false);

  const fetchVideo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await videoService.getById(id);
      setVideo(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load video');
      navigate('/dashboard');
    } finally { setLoading(false); }
  }, [id, navigate]);

  const fetchScenes = useCallback(async () => {
    try {
      const res = await sceneService.getByVideoId(id);
      const sc = res.data.data?.scenes || res.data.data || [];
      setScenes(sc);
      if (sc.length > 0) {
        setSelectedScene(sc[0]);
        setScript(sc[0].scriptText || '');
        setVisualPrompt(sc[0].visualPrompt || '');
      }
    } catch {
      setScenes([]);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
    fetchScenes();
  }, [fetchVideo, fetchScenes]);

  const fetchEditHistory = useCallback(async (sceneId) => {
    if (!sceneId) return;
    setHistoryLoading(true);
    try {
      const res = await editService.getByScene(sceneId);
      setEditHistory(res.data.data?.edits || res.data.data || []);
    } catch {
      setEditHistory([]);
    } finally { setHistoryLoading(false); }
  }, []);

  const handleSelectScene = (scene) => {
    setSelectedScene(scene);
    setScript(scene.scriptText || '');
    setVisualPrompt(scene.visualPrompt || '');
    setEditHistory([]);
    fetchEditHistory(scene._id);
  };

  const handleSaveScene = async () => {
    if (!selectedScene) return;
    setSavingScene(true);
    const previousScript = selectedScene.scriptText;
    const previousVisual = selectedScene.visualPrompt;
    try {
      const res = await sceneService.update(selectedScene._id, { scriptText: script, visualPrompt });
      const updated = res.data.data?.scene || res.data.data;
      const updatedScene = { ...selectedScene, ...updated, scriptText: script, visualPrompt };
      setScenes((prev) => prev.map((s) => s._id === selectedScene._id ? updatedScene : s));
      setSelectedScene(updatedScene);
      toast.success('Scene saved');

      // Record edit history
      if (previousScript !== script) {
        editService.create({
          sceneId: selectedScene._id, videoId: id,
          changeType: 'script', before: previousScript, after: script,
          aiSuggested: false, version: (selectedScene.version || 0) + 1,
        }).catch(() => {});
      }
      if (previousVisual !== visualPrompt) {
        editService.create({
          sceneId: selectedScene._id, videoId: id,
          changeType: 'visual', before: previousVisual, after: visualPrompt,
          aiSuggested: false, version: (selectedScene.version || 0) + 1,
        }).catch(() => {});
      }
      fetchEditHistory(selectedScene._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSavingScene(false); }
  };

  const handleAiEdit = async () => {
    if (!editInstructions.trim()) { toast.error('Enter edit instructions'); return; }
    if (!selectedScene) return;
    setAiEditing(true);
    const prevScript = script;
    const prevVisual = visualPrompt;
    try {
      const res = await sceneService.update(selectedScene._id, { scriptText: script, visualPrompt, editInstructions });
      const updated = res.data.data?.scene || res.data.data;
      const newScript = updated?.scriptText || script;
      const newVisual = updated?.visualPrompt || visualPrompt;
      setScript(newScript);
      setVisualPrompt(newVisual);
      toast.success('AI edit applied');
      setEditInstructions('');
      editService.create({
        sceneId: selectedScene._id, videoId: id,
        changeType: prevScript !== newScript ? 'script' : 'visual',
        before: prevScript !== newScript ? prevScript : prevVisual,
        after: prevScript !== newScript ? newScript : newVisual,
        aiSuggested: true, version: (selectedScene.version || 0) + 1,
      }).catch(() => {});
      fetchEditHistory(selectedScene._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI edit failed');
    } finally { setAiEditing(false); }
  };

  const handleRegenerate = async (type) => {
    if (!selectedScene) return;
    setRegenerating(type);
    toast.loading(`Regenerating ${type}...`, { id: `regen-${type}` });
    try {
      const res = await sceneService.regenerate(selectedScene._id, type);
      const updated = res.data.data?.scene || res.data.data;
      if (updated?.scriptText) setScript(updated.scriptText);
      if (updated?.visualPrompt) setVisualPrompt(updated.visualPrompt);
      toast.success(`${type} regenerated`, { id: `regen-${type}` });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regeneration failed', { id: `regen-${type}` });
    } finally { setRegenerating(null); }
  };

  const handleFactCheck = async () => {
    if (!selectedScene) return;
    setFactChecking(true);
    try {
      const res = await sceneService.factCheck(selectedScene._id);
      setFactResult(res.data.data);
      setShowFactModal(true);
      const count = res.data.data?.issues?.length || 0;
      toast.success(count === 0 ? 'No issues found' : `Found ${count} issue(s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fact-check failed');
    } finally { setFactChecking(false); }
  };

  const handleUndo = async (editId) => {
    toast.loading('Undoing...', { id: `undo-${editId}` });
    try {
      const res = await editService.undo(editId);
      const updated = res.data.data?.scene || res.data.data;
      if (updated?.scriptText !== undefined) setScript(updated.scriptText);
      if (updated?.visualPrompt !== undefined) setVisualPrompt(updated.visualPrompt);
      toast.success('Edit undone — scene reverted', { id: `undo-${editId}` });
      fetchEditHistory(selectedScene._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Undo failed', { id: `undo-${editId}` });
    }
  };

  const statusColor = STATUS_COLORS[video?.generationStatus] || '#9ca3af';

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size={36} />
        </main>
      </div>
    );
  }

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '32px', minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)' }}>{video?.title || 'Video'}</span>
        </div>

        {/* Video header */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                  {video?.title || 'Untitled Video'}
                </h1>
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                  background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
                  color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em',
                  animation: video?.generationStatus === 'processing' ? 'pulse 1.5s infinite' : 'none',
                }}>
                  {video?.generationStatus || 'unknown'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Hash size={12} /> {scenes.length} scenes
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Created {formatDate(video?.createdAt)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/editor/${id}`} className="btn-ghost btn-sm" data-cursor="pointer">
                <Edit3 size={14} /> Full Editor
              </Link>
            </div>
          </div>
        </div>

        {/* Video player */}
        {video?.finalVideoUrl && (
          <div className="glass-card" style={{ padding: '20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Play size={16} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Preview</h2>
            </div>
            <video
              controls
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border-default)', maxHeight: 400 }}
            >
              <source src={video.finalVideoUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Failed state */}
        {video?.generationStatus === 'failed' && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: 24, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)', textAlign: 'center' }}>
            <AlertCircle size={36} color="#f87171" style={{ marginBottom: 12 }} />
            <p style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>Generation Failed</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This video could not be generated. Please try again from the project page.</p>
          </div>
        )}

        {/* Two-column: Scenes + Editor */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Scene list */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Scenes
              </h2>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {scenes.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Film size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No scenes yet</p>
                </div>
              ) : scenes.map((scene) => (
                <motion.button
                  key={scene._id}
                  variants={fadeInUp}
                  onClick={() => handleSelectScene(scene)}
                  data-cursor="pointer"
                  style={{
                    width: '100%', padding: '14px 20px', textAlign: 'left', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-default)', transition: 'background 0.15s',
                    background: selectedScene?._id === scene._id ? 'var(--gold-subtle)' : 'transparent',
                    borderLeft: selectedScene?._id === scene._id ? '3px solid var(--gold-primary)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selectedScene?._id === scene._id ? 'var(--gold-primary)' : 'var(--bg-elevated)',
                      fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
                      color: selectedScene?._id === scene._id ? '#0a0806' : 'var(--text-muted)',
                    }}>
                      {scene.sceneNumber}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Scene {scene.sceneNumber}
                    </span>
                    {scene.version != null && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>v{scene.version}</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scene.scriptText?.trim() || 'No script yet'}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Scene editor panel */}
          {selectedScene ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Scene info bar */}
              <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Scene <span className="gradient-text">{selectedScene.sceneNumber}</span>
                </h3>
                {selectedScene.confidenceScore != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                      {Math.round(selectedScene.confidenceScore * 100)}%
                    </span>
                    <div style={{ width: 80 }}>
                      <ProgressBar value={selectedScene.confidenceScore * 100} />
                    </div>
                  </div>
                )}
                <Link to={`/scenes/${selectedScene._id}`} className="btn-ghost btn-sm" data-cursor="pointer" style={{ marginLeft: 'auto' }}>
                  Open Full Editor <ChevronRight size={12} />
                </Link>
              </div>

              {/* Script editor */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label">Script</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{script.length} chars</span>
                  </div>
                  <textarea
                    className="input-neu"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                    data-cursor="text"
                    placeholder="Scene script text..."
                    style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Visual Prompt</label>
                  <textarea
                    className="input-neu"
                    value={visualPrompt}
                    onChange={(e) => setVisualPrompt(e.target.value)}
                    rows={2}
                    data-cursor="text"
                    placeholder="Visual description for this scene..."
                  />
                </div>

                {/* AI edit */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                  <label className="form-label" style={{ color: 'var(--gold-primary)' }}>✦ AI Edit Instructions</label>
                  <textarea
                    className="input-neu"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={2}
                    data-cursor="text"
                    placeholder="e.g. Make this more concise and professional..."
                  />
                  <button
                    onClick={handleAiEdit}
                    disabled={aiEditing}
                    className="btn-primary"
                    data-cursor="pointer"
                    style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                  >
                    {aiEditing ? <><Spinner size={15} /> Applying...</> : <><Wand2 size={15} /> Apply AI Edit</>}
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={handleSaveScene} disabled={savingScene} className="btn-primary btn-sm" data-cursor="pointer">
                    {savingScene ? <><Spinner size={13} /> Saving...</> : 'Save Scene'}
                  </button>
                  <button onClick={() => handleRegenerate('audio')} disabled={!!regenerating} className="btn-ghost btn-sm" data-cursor="pointer">
                    {regenerating === 'audio' ? <Spinner size={13} /> : <Mic size={13} />} Regen Audio
                  </button>
                  <button onClick={() => handleRegenerate('visuals')} disabled={!!regenerating} className="btn-ghost btn-sm" data-cursor="pointer">
                    {regenerating === 'visuals' ? <Spinner size={13} /> : <Image size={13} />} Regen Visuals
                  </button>
                  <button onClick={handleFactCheck} disabled={factChecking} className="btn-ghost btn-sm" data-cursor="pointer">
                    {factChecking ? <Spinner size={13} /> : <Shield size={13} />} Fact Check
                  </button>
                </div>
              </div>

              {/* Edit history */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Edit History</h3>
                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}><Spinner size={20} /></div>
                ) : editHistory.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No edits recorded yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editHistory.slice(0, 10).map((edit) => (
                      <motion.div
                        key={edit._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)' }}
                      >
                        <span className={`badge ${edit.aiSuggested ? 'badge-gold' : 'badge-draft'}`} style={{ fontSize: '0.6rem', flexShrink: 0 }}>
                          {edit.editType || edit.changeType}
                        </span>
                        {edit.aiSuggested && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--gold-primary)', flexShrink: 0 }}>AI</span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>
                          v{edit.version} · {formatRelative(edit.createdAt)}
                        </span>
                        <button
                          onClick={() => handleUndo(edit._id)}
                          className="btn-icon"
                          style={{ width: 26, height: 26, flexShrink: 0 }}
                          title="Undo this edit"
                          data-cursor="pointer"
                        >
                          <RotateCcw size={11} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Film size={40} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a scene to edit</p>
            </div>
          )}
        </div>
      </main>

      {/* Fact Check Modal */}
      {showFactModal && factResult && (
        <FactCheckModal result={factResult} onClose={() => setShowFactModal(false)} />
      )}

      <style>{`
        @media (max-width: 1023px) { main[style] { margin-left: 0 !important; } }
        @media (max-width: 767px) {
          main > div:last-child > div:first-child { display: none; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </motion.div>
  );
}
