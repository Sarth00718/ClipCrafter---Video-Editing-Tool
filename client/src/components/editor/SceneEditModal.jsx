import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Wand2, Mic, Image, Shield, RotateCcw, Save } from 'lucide-react';
import { sceneService, editService } from '../../services/index.js';
import { ProgressBar, Spinner } from '../ui/index.jsx';
import { formatRelative } from '../../utils/formatters.js';

export default function SceneEditModal({ scene: initialScene, onClose, onSaved }) {
  const [scene, setScene] = useState(initialScene);
  const [script, setScript] = useState(initialScene?.scriptText || '');
  const [visualPrompt, setVisualPrompt] = useState(initialScene?.visualPrompt || '');
  const [editInstructions, setEditInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(null); // 'audio' | 'visuals' | 'both'
  const [factChecking, setFactChecking] = useState(false);
  const [factResults, setFactResults] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!scene?._id) return;
    setHistoryLoading(true);
    try {
      const res = await editService.getByScene(scene._id);
      setEditHistory(res.data.data?.edits || res.data.data || []);
    // eslint-disable-next-line no-empty
    } catch {} finally { setHistoryLoading(false); }
  }, [scene?._id]);

  useEffect(() => {
    if (scene?._id) fetchHistory();
  }, [scene?._id, fetchHistory]);

  const handleSave = async () => {
    setSaving(true);
    const previousScript = scene?.scriptText;
    const previousVisual = scene?.visualPrompt;
    try {
      const res = await sceneService.update(scene._id, { scriptText: script, visualPrompt });
      const updated = res.data.data?.scene || res.data.data;
      toast.success('Scene saved successfully');
      setScene((prev) => ({ ...prev, ...updated, version: (prev?.version || 0) + 1 }));

      // Record edit history
      if (previousScript !== script) {
        editService.create({
          sceneId: scene._id,
          videoId: scene?.videoId,
          changeType: 'script',
          before: previousScript,
          after: script,
          aiSuggested: false,
          version: (scene?.version || 0) + 1,
        }).catch(() => {});
      }
      if (previousVisual !== visualPrompt) {
        editService.create({
          sceneId: scene._id,
          videoId: scene?.videoId,
          changeType: 'visual',
          before: previousVisual,
          after: visualPrompt,
          aiSuggested: false,
          version: (scene?.version || 0) + 1,
        }).catch(() => {});
      }

      onSaved?.(updated || { ...scene, scriptText: script, visualPrompt });
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save scene');
    } finally { setSaving(false); }
  };

  const handleAiEdit = async () => {
    if (!editInstructions.trim()) { toast.error('Please enter edit instructions'); return; }
    setAiEditing(true);
    const previousScript = script;
    const previousVisual = visualPrompt;
    try {
      const res = await sceneService.update(scene._id, { scriptText: script, visualPrompt, editInstructions });
      const updated = res.data.data?.scene || res.data.data;
      const newScript = updated?.scriptText || script;
      const newVisual = updated?.visualPrompt || visualPrompt;
      setScript(newScript);
      setVisualPrompt(newVisual);
      toast.success('AI edit applied');
      setEditInstructions('');

      // Record AI edit history
      if (previousScript !== newScript || previousVisual !== newVisual) {
        editService.create({
          sceneId: scene._id,
          videoId: scene?.videoId,
          changeType: previousScript !== newScript ? 'script' : 'visual',
          before: previousScript !== newScript ? previousScript : previousVisual,
          after: previousScript !== newScript ? newScript : newVisual,
          aiSuggested: true,
          version: (scene?.version || 0) + 1,
        }).catch(() => {});
      }
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI edit failed');
    } finally { setAiEditing(false); }
  };

  const handleRegenerate = async (type) => {
    setRegenerating(type);
    toast.loading(`Regenerating ${type}...`, { id: `regen-modal-${type}` });
    try {
      const res = await sceneService.regenerate(scene._id, type);
      const updated = res.data.data?.scene || res.data.data;
      if (updated?.scriptText) setScript(updated.scriptText);
      if (updated?.visualPrompt) setVisualPrompt(updated.visualPrompt);
      toast.success(`${type === 'audio' ? 'Audio' : type === 'visuals' ? 'Visuals' : 'Scene'} regenerated`, { id: `regen-modal-${type}` });
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regeneration failed', { id: `regen-modal-${type}` });
    } finally { setRegenerating(null); }
  };

  const handleFactCheck = async () => {
    setFactChecking(true);
    try {
      const res = await sceneService.factCheck(scene._id);
      const result = res.data.data;
      setFactResults(result);
      const issueCount = result?.issues?.length || 0;
      if (issueCount === 0) {
        toast.success('Fact-check complete — no issues found');
      } else {
        toast.warning(`Found ${issueCount} potential issue(s)`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fact-check failed');
    } finally { setFactChecking(false); }
  };

  const handleUndo = async (editId) => {
    toast.loading('Undoing edit...', { id: `undo-modal-${editId}` });
    try {
      const res = await editService.undo(editId);
      const updated = res.data.data?.scene || res.data.data;
      if (updated?.scriptText !== undefined) setScript(updated.scriptText);
      if (updated?.visualPrompt !== undefined) setVisualPrompt(updated.visualPrompt);
      toast.success('Edit undone — scene reverted', { id: `undo-modal-${editId}` });
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Undo failed', { id: `undo-modal-${editId}` });
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 20,
            width: '100%', maxWidth: 900,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-glow), 0 40px 100px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: 0 }}>
              Edit Scene <span className="gradient-text">{scene?.sceneNumber}</span>
              {scene?.version != null && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>v{scene.version}</span>
              )}
            </h2>
            <button onClick={onClose} className="btn-icon" data-cursor="pointer"><X size={16} /></button>
          </div>

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>
            {/* LEFT — Edit form */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Script */}
              <div className="form-group">
                <label className="form-label">Script</label>
                <textarea
                  className="input-neu"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={6}
                  data-cursor="text"
                  placeholder="Scene script text..."
                />
                <div className="form-hint" style={{ textAlign: 'right' }}>{script.length} chars</div>
              </div>

              {/* Visual Prompt */}
              <div className="form-group">
                <label className="form-label">Visual Prompt</label>
                <textarea
                  className="input-neu"
                  value={visualPrompt}
                  onChange={(e) => setVisualPrompt(e.target.value)}
                  rows={3}
                  data-cursor="text"
                  placeholder="Describe the visual for this scene..."
                />
              </div>

              {/* AI Edit Instructions */}
              <div className="form-group" style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '16px' }}>
                <label className="form-label" style={{ color: 'var(--gold-primary)' }}>✦ AI Edit Instructions</label>
                <textarea
                  className="input-neu"
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={3}
                  data-cursor="text"
                  placeholder="Describe what you want to change... e.g. 'Make it more formal and concise'"
                />
                <button
                  onClick={handleAiEdit}
                  disabled={aiEditing}
                  className="btn-primary"
                  data-cursor="pointer"
                  style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                >
                  {aiEditing ? <><Spinner size={16} /> Applying...</> : <><Wand2 size={16} /> Apply AI Edit</>}
                </button>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm" data-cursor="pointer">
                  {saving ? <><Spinner size={14} /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
                <button
                  onClick={() => handleRegenerate('audio')}
                  disabled={!!regenerating}
                  className="btn-ghost btn-sm"
                  data-cursor="pointer"
                >
                  {regenerating === 'audio' ? <Spinner size={14} /> : <Mic size={14} />} Regen Audio
                </button>
                <button
                  onClick={() => handleRegenerate('visuals')}
                  disabled={!!regenerating}
                  className="btn-ghost btn-sm"
                  data-cursor="pointer"
                >
                  {regenerating === 'visuals' ? <Spinner size={14} /> : <Image size={14} />} Regen Visuals
                </button>
              </div>
            </div>

            {/* RIGHT — Info panel */}
            <div style={{ padding: '24px 20px', borderLeft: '1px solid var(--border-default)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg-secondary)' }}>
              {/* Confidence */}
              {scene?.confidenceScore != null && (
                <div>
                  <label className="form-label">Confidence Score</label>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: 8 }} className="gradient-text">
                    {Math.round(scene.confidenceScore * 100)}%
                  </div>
                  <ProgressBar value={scene.confidenceScore * 100} />
                </div>
              )}

              {/* Fact Check */}
              <div>
                <label className="form-label">Fact Check</label>
                <button
                  onClick={handleFactCheck}
                  disabled={factChecking}
                  className="btn-ghost btn-sm"
                  data-cursor="pointer"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                >
                  {factChecking ? <><Spinner size={12} /> Checking...</> : <><Shield size={12} /> Run Fact Check</>}
                </button>

                {factResults && (
                  <div>
                    <div style={{
                      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                      background: `rgba(${factResults.confidence >= 0.9 ? '74,222,128' : factResults.confidence >= 0.7 ? '251,191,36' : '248,113,113'},0.1)`,
                      border: `1px solid rgba(${factResults.confidence >= 0.9 ? '74,222,128' : factResults.confidence >= 0.7 ? '251,191,36' : '248,113,113'},0.3)`,
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                        color: factResults.confidence >= 0.9 ? '#4ade80' : factResults.confidence >= 0.7 ? '#fbbf24' : '#f87171'
                      }}>
                        {Math.round((factResults.confidence || 0) * 100)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {factResults.confidence >= 0.9 ? 'High Confidence' : factResults.confidence >= 0.7 ? 'Medium Confidence' : 'Low Confidence'}
                      </div>
                    </div>
                    {factResults.issues?.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#4ade80' }}>✓ No issues found</p>
                    ) : factResults.issues?.map((issue, idx) => (
                      <div key={idx} style={{
                        padding: '8px 10px', borderRadius: 8, marginTop: 6,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        fontSize: '0.8rem', color: '#f87171',
                      }}>
                        {typeof issue === 'string' ? issue : issue.description || issue.message || 'Unknown issue'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Source ref */}
              {scene?.sourceReference && (
                <div>
                  <label className="form-label">Source Reference</label>
                  <span className="badge badge-gold">{scene.sourceReference}</span>
                </div>
              )}

              {/* Edit History */}
              <div>
                <label className="form-label">Edit History</label>
                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}><Spinner size={20} /></div>
                ) : editHistory.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No edits yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editHistory.slice(0, 8).map((edit) => (
                      <div key={edit._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                        <span className={`badge ${edit.aiSuggested ? 'badge-gold' : 'badge-draft'}`} style={{ fontSize: '0.6rem', flexShrink: 0 }}>
                          {edit.editType || edit.changeType}
                        </span>
                        {edit.aiSuggested && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--gold-primary)', flexShrink: 0 }}>AI</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flex: 1 }}>{formatRelative(edit.createdAt)}</span>
                        <button
                          onClick={() => handleUndo(edit._id)}
                          className="btn-icon"
                          style={{ width: 24, height: 24 }}
                          title="Undo this edit"
                          data-cursor="pointer"
                        >
                          <RotateCcw size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
