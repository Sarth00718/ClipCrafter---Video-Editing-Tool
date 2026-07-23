import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Film, Edit3, RefreshCw, AlertCircle, Loader2, Upload } from 'lucide-react';
import { projectService, videoService } from '../services/index.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import { Badge, ProgressBar, Spinner } from '../components/ui/index.jsx';
import { statusToVariant, formatDate } from '../utils/formatters.js';
import { pageTransition } from '../utils/animations.js';
import VideoUpload from '../components/project/VideoUpload.jsx';

const STATUS_MESSAGES = [
  'Analyzing content...',
  'Writing script...',
  'Creating scenes...',
  'Generating visuals...',
  'Almost done...',
];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.getById(id);
      const proj = res.data.data;
      setProject(proj);
      setNewTitle(proj.title);

      // Try to get the latest video
      if (proj.videos?.length > 0) {
        const vidId = typeof proj.videos[0] === 'string' ? proj.videos[0] : proj.videos[0]._id;
        if (vidId) {
          const vRes = await videoService.getById(vidId);
          setVideo(vRes.data.data);
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load project');
      navigate('/dashboard');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);


  // Status poller
  useEffect(() => {
    if (!video || video.generationStatus === 'completed' || video.generationStatus === 'failed') return;
    const interval = setInterval(async () => {
      try {
        const res = await videoService.getById(video._id);
        setVideo(res.data.data);
        setFakeProgress((p) => Math.min(p + Math.random() * 10, 95));
        setMsgIdx((m) => Math.min(m + 1, STATUS_MESSAGES.length - 1));
        if (res.data.data.generationStatus === 'completed') {
          clearInterval(interval);
          setFakeProgress(100);
          fetchProject();
        }
      // eslint-disable-next-line no-empty
      } catch {} 
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?._id, video?.generationStatus, fetchProject]);


  const handleGenerate = async () => {
    setGenerating(true);
    setFakeProgress(0);
    setMsgIdx(0);
    try {
      const res = await videoService.generate({ text: project.description || project.title, projectId: project._id, title: project.title });
      setVideo(res.data.data);
      toast.success('Video generation started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const handleTitleSave = async () => {
    try {
      await projectService.update(id, { title: newTitle });
      setProject((p) => ({ ...p, title: newTitle }));
      setEditingTitle(false);
      toast.success('Title updated');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update title');
    }
  };

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

  const isProcessing = video && (video.generationStatus === 'processing' || video.generationStatus === 'pending');
  const isCompleted = video && video.generationStatus === 'completed';
  const isFailed = video && video.generationStatus === 'failed';

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '32px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)' }}>{project?.title}</span>
        </div>

        {/* Project header */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              {editingTitle ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input-neu" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', padding: '8px 12px' }} data-cursor="text" />
                  <button onClick={handleTitleSave} className="btn-primary btn-sm">Save</button>
                  <button onClick={() => setEditingTitle(false)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{project?.title}</h1>
                  <button onClick={() => setEditingTitle(true)} className="btn-icon" title="Edit title" data-cursor="pointer"><Edit3 size={14} /></button>
                </div>
              )}
              {project?.description && <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0 }}>{project.description}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Badge variant={statusToVariant(project?.status)}>{project?.status}</Badge>
                {project?.sourceType && <span className="badge badge-gold">{project.sourceType}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created {formatDate(project?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* VIDEO STATUS SECTION */}
        <div className="glass-card" style={{ padding: '36px' }}>
          {/* CASE 1: No video */}
          {!video && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Film size={56} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Generate Your Video</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Start AI generation to create scenes from your content.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleGenerate} disabled={generating} className="btn-primary" data-cursor="pointer" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                  {generating ? <><Spinner size={18} /> Starting...</> : '✦ Generate Video'}
                </button>
                <button onClick={() => setShowUploadModal(true)} className="btn-ghost" data-cursor="pointer" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                  <Upload size={18} /> Upload Video
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: Processing */}
          {isProcessing && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--border-default)', borderTopColor: 'var(--gold-primary)', margin: '0 auto 20px' }}
              />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                {STATUS_MESSAGES[msgIdx]}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>This usually takes 30–60 seconds</p>
              <div style={{ maxWidth: 400, margin: '0 auto' }}>
                <ProgressBar value={fakeProgress} showLabel />
              </div>
            </div>
          )}

          {/* CASE 3: Completed */}
          {isCompleted && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Video Ready</h3>
                <span className="badge badge-completed">Completed</span>
              </div>
              {video.finalVideoUrl ? (
                <video controls style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border-default)', marginBottom: 20, maxHeight: 360 }}>
                  <source src={video.finalVideoUrl} />
                </video>
              ) : (
                <div style={{ width: '100%', height: 200, background: 'var(--bg-elevated)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Film size={32} color="var(--text-muted)" />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to={`/editor/${video._id}`} className="btn-primary" data-cursor="pointer" style={{ textDecoration: 'none' }}>
                  Open Editor <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* CASE 4: Failed */}
          {isFailed && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <AlertCircle size={48} color="#f87171" style={{ marginBottom: 16 }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#f87171' }}>Generation Failed</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Something went wrong during video generation. Try again.</p>
              <button onClick={handleGenerate} className="btn-primary" data-cursor="pointer">
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <VideoUpload
          projectId={id}
          onUploadComplete={(uploadedVideo) => {
            setVideo(uploadedVideo);
            fetchProject();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      <style>{`@media (max-width: 1023px) { main[style] { margin-left: 0 !important; } }`}</style>
    </motion.div>
  );
}
