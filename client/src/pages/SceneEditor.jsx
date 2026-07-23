import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save, Wand2, Mic, Image, Shield, RotateCcw } from 'lucide-react';
import { sceneService, editService } from '../services/index.js';
import { ProgressBar, Spinner } from '../components/ui/index.jsx';
import { formatRelative } from '../utils/formatters.js';
import { pageTransition } from '../utils/animations.js';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import FactCheckModal from '../components/editor/FactCheckModal.jsx';

export default function SceneEditor() {
  const { id } = useParams(); // scene ID
  const navigate = useNavigate();
  const [scene, setScene] = useState(null);
  const [script, setScript] = useState('');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving' | 'saved' | 'error'
  const [aiEditing, setAiEditing] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState(null);
  const [showFactCheckModal, setShowFactCheckModal] = useState(false);
  const autoSaveTimer = useRef(null);

  const fetchScene = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch actual scene from backend
      try {
        const scRes = await sceneService.getById(id);
        const sc = scRes.data.data;
        setScene(sc);
        setScript(sc.scriptText || '');
        setVisualPrompt(sc.visualPrompt || '');
      } catch {
        // Fallback if scene not found independently
        setScene({ _id: id, sceneNumber: 1, scriptText: '', visualPrompt: '', confidenceScore: null, sourceReference: null });
        setScript('');
        setVisualPrompt('');
      }

      // Try to get edit history
      try {
        const hRes = await editService.getByScene(id);
        setEditHistory(hRes.data.data || []);
      } catch {
        // history not critical — silently ignore
      }
    } catch {
      toast.error('Failed to load scene');
      navigate(-1);
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    fetchScene();
  }, [fetchScene]);

  // Autosave
  const triggerAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('unsaved');
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await sceneService.update(id, { scriptText: script, visualPrompt });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 2000);
  }, [id, script, visualPrompt]);

  useEffect(() => {
    if (!loading) triggerAutoSave();
    return () => clearTimeout(autoSaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, visualPrompt]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Store previous values for edit history
      const previousScript = scene?.scriptText;
      const previousVisual = scene?.visualPrompt;
      
      const res = await sceneService.update(id, { scriptText: script, visualPrompt });
      const updated = res.data.data?.scene || res.data.data;
      
      // Record edit history for script changes
      if (previousScript !== script) {
        try {
          await editService.create({
            sceneId: id,
            videoId: scene?.videoId || updated?.videoId,
            changeType: 'script',
            before: previousScript,
            after: script,
            aiSuggested: false,
            version: (scene?.version || 0) + 1
          });
        } catch (histErr) {
          console.error('Failed to record script edit history:', histErr);
        }
      }
      
      // Record edit history for visual prompt changes
      if (previousVisual !== visualPrompt) {
        try {
          await editService.create({
            sceneId: id,
            videoId: scene?.videoId || updated?.videoId,
            changeType: 'visual',
            before: previousVisual,
            after: visualPrompt,
            aiSuggested: false,
            version: (scene?.version || 0) + 1
          });
        } catch (histErr) {
          console.error('Failed to record visual edit history:', histErr);
        }
      }
      
      toast.success('Scene saved');
      setAutoSaveStatus('saved');
      
      // Refresh edit history
      fetchScene();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleAiEdit = async () => {
    if (!editInstructions.trim()) { toast.error('Enter edit instructions'); return; }
    setAiEditing(true);
    
    // Store previous values
    const previousScript = script;
    const previousVisual = visualPrompt;
    
    try {
      const res = await sceneService.update(id, { scriptText: script, visualPrompt, editInstructions });
      const updated = res.data.data?.scene || res.data.data;
      
      const newScript = updated.scriptText || script;
      const newVisual = updated.visualPrompt || visualPrompt;
      
      setScript(newScript);
      setVisualPrompt(newVisual);
      
      // Record AI edit history
      if (previousScript !== newScript || previousVisual !== newVisual) {
        try {
          await editService.create({
            sceneId: id,
            videoId: scene?.videoId || updated?.videoId,
            changeType: previousScript !== newScript ? 'script' : 'visual',
            before: previousScript !== newScript ? previousScript : previousVisual,
            after: previousScript !== newScript ? newScript : newVisual,
            aiSuggested: true,
            version: (scene?.version || 0) + 1
          });
        } catch (histErr) {
          console.error('Failed to record AI edit history:', histErr);
        }
      }
      
      toast.success('AI edit applied');
      setEditInstructions('');
      
      // Refresh edit history
      fetchScene();
    } catch (e) {
      toast.error(e.response?.data?.message || 'AI edit failed');
    } finally { setAiEditing(false); }
  };

  const handleRegenerate = async (type) => {
    toast.loading(`Regenerating ${type}...`, { id: 'regen' });
    try {
      const res = await sceneService.regenerate(id, type);
      const updated = res.data.data?.scene || res.data.data;
      setScene(updated);
      if (updated.scriptText) setScript(updated.scriptText);
      if (updated.visualPrompt) setVisualPrompt(updated.visualPrompt);
      toast.success(`${type === 'audio' ? 'Audio' : 'Visuals'} regenerated`, { id: 'regen' });
      fetchScene(); // Refresh to get latest data
    } catch (e) {
      toast.error(e.response?.data?.message || 'Regeneration failed', { id: 'regen' });
    }
  };

  const handleUndo = async (editId) => {
    toast.loading('Undoing edit...', { id: 'undo' });
    try {
      const res = await editService.undo(editId);
      const updated = res.data.data?.scene || res.data.data;
      if (updated.scriptText !== undefined) setScript(updated.scriptText);
      if (updated.visualPrompt !== undefined) setVisualPrompt(updated.visualPrompt);
      toast.success('Edit undone', { id: 'undo' });
      fetchScene(); // Refresh history
    } catch (e) {
      toast.error(e.response?.data?.message || 'Undo failed', { id: 'undo' });
    }
  };

  const handleFactCheck = async () => {
    toast.loading('Fact-checking scene...', { id: 'factcheck' });
    try {
      const res = await sceneService.factCheck(id);
      const result = res.data.data;
      setFactCheckResult(result);
      setShowFactCheckModal(true);
      
      if (result.issues && result.issues.length > 0) {
        toast.success(`Fact-check complete — found ${result.issues.length} issue(s)`, { id: 'factcheck' });
      } else {
        toast.success('Fact-check complete — no issues found', { id: 'factcheck' });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Fact-check failed', { id: 'factcheck' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: 56, borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} className="btn-icon" data-cursor="pointer"><ChevronLeft size={16} /></button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Scene Editor</span>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>Scene #{scene?.sceneNumber}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {autoSaveStatus === 'saving' && <><Spinner size={12} /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saving...</span></>}
          {autoSaveStatus === 'saved' && <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✓ Saved</span>}
          {autoSaveStatus === 'unsaved' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unsaved changes</span>}
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1, overflow: 'hidden' }}>
        {/* LEFT — Canvas */}
        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Script */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label">Script</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wordCount} words · {script.length} chars</span>
            </div>
            <textarea
              className="input-neu"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              placeholder="Write the scene script here..."
              data-cursor="text"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: 1.8 }}
            />
          </div>

          {/* Visual Prompt */}
          <div className="form-group">
            <label className="form-label">Visual Prompt</label>
            <textarea className="input-neu" value={visualPrompt} onChange={(e) => setVisualPrompt(e.target.value)} rows={3} placeholder="Describe the visual for this scene..." data-cursor="text" />
          </div>

          {/* AI Edit */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '20px', border: '1px solid var(--border-default)' }}>
            <label className="form-label" style={{ color: 'var(--gold-primary)' }}>✦ AI Edit Instructions</label>
            <textarea className="input-neu" value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} rows={3} placeholder="e.g. Make it more concise and professional..." data-cursor="text" />
            <button onClick={handleAiEdit} disabled={aiEditing} className="btn-primary" data-cursor="pointer" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              {aiEditing ? <><Spinner size={16} /> Applying...</> : <><Wand2 size={16} /> Apply AI Edit</>}
            </button>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: 'var(--bg-primary)', padding: '16px 0', borderTop: '1px solid var(--border-default)' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm" data-cursor="pointer">
              {saving ? <><Spinner size={14} /> Saving...</> : <><Save size={14} /> Save</>}
            </button>
            <button onClick={() => handleRegenerate('audio')} className="btn-ghost btn-sm" data-cursor="pointer"><Mic size={14} /> Regen Audio</button>
            <button onClick={() => handleRegenerate('visuals')} className="btn-ghost btn-sm" data-cursor="pointer"><Image size={14} /> Regen Visuals</button>
            <button onClick={handleFactCheck} className="btn-ghost btn-sm" data-cursor="pointer"><Shield size={14} /> Fact Check</button>
            <button onClick={() => navigate(-1)} className="btn-ghost btn-sm" data-cursor="pointer">Cancel</button>
          </div>
        </div>

        {/* RIGHT — Info sidebar */}
        <div style={{ borderLeft: '1px solid var(--border-default)', overflowY: 'auto', padding: '28px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Confidence gauge */}
          {scene?.confidenceScore != null ? (
            <div>
              <label className="form-label">Confidence Score</label>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 900 }} className="gradient-text">
                {Math.round(scene.confidenceScore * 100)}%
              </div>
              <ProgressBar value={scene.confidenceScore * 100} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Shield size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>No confidence data</p>
            </div>
          )}

          {scene?.sourceReference && (
            <div>
              <label className="form-label">Source Reference</label>
              <span className="badge badge-gold">{scene.sourceReference}</span>
            </div>
          )}

          {/* Edit History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className="form-label" style={{ margin: 0 }}>Edit History</label>
              {editHistory.length > 5 && (
                <button onClick={() => setHistoryExpanded(!historyExpanded)} style={{ color: 'var(--gold-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                  {historyExpanded ? 'Show less' : `View all (${editHistory.length})`}
                </button>
              )}
            </div>

            {editHistory.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No edit history yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(historyExpanded ? editHistory : editHistory.slice(0, 5)).map((edit) => (
                  <motion.div
                    key={edit._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)' }}
                  >
                    <span className={`badge ${edit.aiSuggested ? 'badge-gold' : 'badge-draft'}`} style={{ fontSize: '0.6rem', flexShrink: 0 }}>{edit.editType}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>{formatRelative(edit.createdAt)}</span>
                    <button onClick={() => handleUndo(edit._id)} className="btn-icon" style={{ width: 24, height: 24, flexShrink: 0 }} title="Undo" data-cursor="pointer">
                      <RotateCcw size={11} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fact Check Modal */}
      {showFactCheckModal && factCheckResult && (
        <FactCheckModal
          result={factCheckResult}
          onClose={() => setShowFactCheckModal(false)}
        />
      )}
    </motion.div>
  );
}
