import { useState, useEffect } from 'react';
import { Upload, FileText, Database, Sparkles, Trash2, Download, Play, Film, Wand2, Eye, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar.jsx';
import { pageTransition } from '../utils/animations.js';

const API_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

const STYLE_PRESETS = [
  { value: 'cinematic_educational', label: 'Cinematic Educational' },
  { value: 'ghibli_educational', label: 'Ghibli Studio' },
  { value: 'scientific_infographic', label: 'Scientific Infographic' },
  { value: 'textbook_diagram', label: 'Textbook Diagram' },
  { value: 'minimalist_biology', label: 'Minimalist Biology' },
  { value: 'storybook_science', label: 'Storybook Science' },
];

export default function RAGVideoGenerator() {
  const [currentDocId, setCurrentDocId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadStatus, setUploadStatus] = useState({ status: '', text: '' });
  const [indexStatus, setIndexStatus] = useState({ loading: false, text: '' });
  const [genStatus, setGenStatus] = useState({ loading: false, text: '' });
  const [script, setScript] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [storyboardStatus, setStoryboardStatus] = useState({ loading: false, text: '' });
  const [finalVideo, setFinalVideo] = useState(null);
  const [showFastRebuild, setShowFastRebuild] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    goal: 'Generate a 3-minute beginner-friendly video script',
    target_audience: 'college students',
    tone: 'beginner-friendly',
    duration_minutes: 3,
    depth: 'medium',
    output_language: 'English',
    focus_areas: '',
    include_analogies: true,
    include_visual_cues: true,
  });

  const handleFileSelect = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'pptx', 'txt', 'csv', 'xlsx', 'md'].includes(ext)) {
      toast.error('Unsupported file type. Use PDF, DOCX, PPTX, TXT, CSV, XLSX, or MD.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File exceeds 50 MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus({ status: 'uploading', text: 'Uploading...' });
      const res = await axios.post(`${API_URL}/upload-document`, formData);
      setCurrentDocId(res.data.document_id);
      setUploadStatus({ status: 'uploaded', text: `Uploaded — ${res.data.filename}` });
      setCurrentStep(2);
      toast.success('Document uploaded successfully!');
    } catch (err) {
      toast.error(`Upload failed: ${err.response?.data?.detail || err.message}`);
      setUploadStatus({ status: 'failed', text: 'Upload failed' });
    }
  };

  const handleBuildIndex = async () => {
    if (!currentDocId) return;
    
    try {
      setIndexStatus({ loading: true, text: 'Parsing, chunking, embedding, and indexing...' });
      const res = await axios.post(`${API_URL}/build-index/${currentDocId}`);
      setIndexStatus({ loading: false, text: `✓ Indexed — ${res.data.chunk_count} chunks created` });
      setCurrentStep(3);
      toast.success(`Index built with ${res.data.chunk_count} chunks!`);
    } catch (err) {
      toast.error(`Index build failed: ${err.response?.data?.detail || err.message}`);
      setIndexStatus({ loading: false, text: '✗ Failed' });
    }
  };

  const handleGenerateScript = async () => {
    if (!currentDocId) return;
    
    try {
      setGenStatus({ loading: true, text: 'Retrieving context & generating script...' });
      const focusAreas = formData.focus_areas.trim() 
        ? formData.focus_areas.split(',').map(s => s.trim()) 
        : [];
      
      const res = await axios.post(`${API_URL}/generate-script/${currentDocId}`, {
        ...formData,
        focus_areas: focusAreas,
      });
      
      setScript(res.data);
      setGenStatus({ loading: false, text: 'Script generated!' });
      toast.success('Script generated successfully! ✨');
    } catch (err) {
      toast.error(`Generation failed: ${err.response?.data?.detail || err.message}`);
      setGenStatus({ loading: false, text: '✗ Failed' });
    }
  };

  const handleDelete = async () => {
    if (!currentDocId) return;
    if (!confirm('Delete this document and all generated data?')) return;
    
    try {
      await axios.delete(`${API_URL}/document/${currentDocId}`);
      toast.info('Document deleted.');
      window.location.reload();
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // ── Storyboard Functions ──────────────────────────────────────
  const handleGenerateStoryboard = async () => {
    if (!currentDocId) return;
    
    try {
      setStoryboardStatus({ loading: true, text: 'Segmenting script into scenes...' });
      const res = await axios.post(`${API_URL}/scripts/${currentDocId}/segment-scenes`);
      setScenes(res.data.scenes || []);
      setStoryboardStatus({ loading: false, text: '' });
      toast.success('Storyboard generated! 🎉');
    } catch (err) {
      toast.error(`Storyboard generation failed: ${err.response?.data?.detail || err.message}`);
      setStoryboardStatus({ loading: false, text: '✗ Failed' });
    }
  };

  const updateSceneInState = (sceneId, updates) => {
    setScenes(prev => prev.map(s => s.scene_id === sceneId ? { ...s, ...updates } : s));
  };

  const handleSaveNarration = async (sceneId, narration) => {
    try {
      await axios.patch(`${API_URL}/scenes/${sceneId}/narration?project_id=${currentDocId}&narration=${encodeURIComponent(narration)}`);
      toast.info('Narration saved!');
      updateSceneInState(sceneId, { audio_status: 'outdated', clip_status: 'outdated' });
      setShowFastRebuild(true); // Show rebuild button when scene is updated
    } catch (err) {
      toast.error(`Failed to save narration: ${err.message}`);
    }
  };

  const handleSavePrompt = async (sceneId, prompt) => {
    try {
      await axios.patch(`${API_URL}/scenes/${sceneId}/prompt?project_id=${currentDocId}&prompt=${encodeURIComponent(prompt)}`);
      toast.info('Prompt saved!');
      updateSceneInState(sceneId, { image_status: 'outdated', clip_status: 'outdated' });
      setShowFastRebuild(true); // Show rebuild button when scene is updated
    } catch (err) {
      toast.error(`Failed to save prompt: ${err.message}`);
    }
  };

  const handleAnalyzeVisual = async (sceneId, imageStyle) => {
    try {
      updateSceneInState(sceneId, { analyzing: true });
      const res = await axios.post(`${API_URL}/scenes/${sceneId}/analyze-visual?project_id=${currentDocId}`, {
        image_style: imageStyle
      });
      updateSceneInState(sceneId, {
        ...res.data,
        analyzing: false
      });
      toast.success('Visual plan updated!');
    } catch (err) {
      toast.error(`Analysis failed: ${err.message}`);
      updateSceneInState(sceneId, { analyzing: false });
    }
  };

  const handleGenerateAudio = async (sceneId) => {
    try {
      updateSceneInState(sceneId, { audio_status: 'generating' });
      await axios.post(`${API_URL}/scenes/${sceneId}/generate-audio?project_id=${currentDocId}`);
      updateSceneInState(sceneId, { audio_status: 'ready', clip_status: 'outdated' });
      if (finalVideo) {
        setShowFastRebuild(true);
        toast.info('Scene updated! Render clip and update video to see changes.');
      } else {
        toast.success('Audio generated!');
      }
    } catch (err) {
      toast.error(`Audio generation failed: ${err.message}`);
      updateSceneInState(sceneId, { audio_status: 'error' });
    }
  };

  const handleGenerateImage = async (sceneId, imageStyle, customPrompt) => {
    try {
      updateSceneInState(sceneId, { image_status: 'generating' });
      await axios.post(`${API_URL}/scenes/${sceneId}/generate-image?project_id=${currentDocId}`, {
        image_style: imageStyle,
        custom_prompt: customPrompt
      });
      updateSceneInState(sceneId, { image_status: 'ready', clip_status: 'outdated' });
      if (finalVideo) {
        setShowFastRebuild(true);
        toast.info('Scene updated! Render clip and update video to see changes.');
      } else {
        toast.success('Image generated!');
      }
    } catch (err) {
      toast.error(`Image generation failed: ${err.message}`);
      updateSceneInState(sceneId, { image_status: 'error' });
    }
  };

  const handleUploadImage = async (sceneId, file) => {
    try {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or WebP image');
        return;
      }

      updateSceneInState(sceneId, { image_status: 'generating' });
      toast.info('Uploading image...');

      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `${API_URL}/scenes/${sceneId}/upload-image?project_id=${currentDocId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateSceneInState(sceneId, { image_status: 'ready', clip_status: 'outdated' });
      if (finalVideo) {
        setShowFastRebuild(true);
        toast.success('Image uploaded! Render clip and update video to see changes.');
      } else {
        toast.success('Image uploaded successfully!');
      }
    } catch (err) {
      toast.error(`Image upload failed: ${err.response?.data?.detail || err.message}`);
      updateSceneInState(sceneId, { image_status: 'error' });
    }
  };

  const handleGenerateClip = async (sceneId) => {
    try {
      updateSceneInState(sceneId, { clip_status: 'generating' });
      await axios.post(`${API_URL}/scenes/${sceneId}/generate-clip?project_id=${currentDocId}`);
      updateSceneInState(sceneId, { clip_status: 'ready' });
      setShowFastRebuild(true);
      if (finalVideo) {
        toast.success('Clip rendered! Click "Update Video" to rebuild the final video.');
      } else {
        toast.success('Clip rendered!');
      }
    } catch (err) {
      toast.error(`Clip rendering failed: ${err.message}`);
      updateSceneInState(sceneId, { clip_status: 'error' });
    }
  };

  const handleAssembleClips = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Rendering all individual scene clips...' });
      const res = await axios.post(`${API_URL}/projects/${currentDocId}/generate-scene-clips`);
      toast.success(`Success: ${res.data.rendered_count} clips rendered!`);
      // Refresh scenes
      const scenesRes = await axios.get(`${API_URL}/projects/${currentDocId}/scenes`);
      setScenes(scenesRes.data.scenes || []);
      setStoryboardStatus({ loading: false, text: '' });
    } catch (err) {
      toast.error(`Assembly failed: ${err.response?.data?.detail || err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleGenerateAllAudio = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Generating audio for all scenes...' });
      let successCount = 0;
      for (const scene of scenes) {
        if (scene.audio_status !== 'ready') {
          try {
            updateSceneInState(scene.scene_id, { audio_status: 'generating' });
            await axios.post(`${API_URL}/scenes/${scene.scene_id}/generate-audio?project_id=${currentDocId}`);
            updateSceneInState(scene.scene_id, { audio_status: 'ready' });
            successCount++;
          } catch (err) {
            updateSceneInState(scene.scene_id, { audio_status: 'error' });
          }
        }
      }
      setStoryboardStatus({ loading: false, text: '' });
      toast.success(`Generated audio for ${successCount} scenes!`);
    } catch (err) {
      toast.error(`Bulk audio generation failed: ${err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleGenerateAllImages = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Generating images for all scenes...' });
      let successCount = 0;
      for (const scene of scenes) {
        if (scene.image_status !== 'ready') {
          try {
            updateSceneInState(scene.scene_id, { image_status: 'generating' });
            await axios.post(`${API_URL}/scenes/${scene.scene_id}/generate-image?project_id=${currentDocId}`, {
              image_style: 'cinematic_educational',
              custom_prompt: scene.visual_prompt
            });
            updateSceneInState(scene.scene_id, { image_status: 'ready' });
            successCount++;
          } catch (err) {
            updateSceneInState(scene.scene_id, { image_status: 'error' });
          }
        }
      }
      setStoryboardStatus({ loading: false, text: '' });
      toast.success(`Generated images for ${successCount} scenes!`);
    } catch (err) {
      toast.error(`Bulk image generation failed: ${err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleRenderAllClips = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Rendering clips for all scenes...' });
      let successCount = 0;
      for (const scene of scenes) {
        if (scene.audio_status === 'ready' && scene.image_status === 'ready') {
          try {
            updateSceneInState(scene.scene_id, { clip_status: 'generating' });
            await axios.post(`${API_URL}/scenes/${scene.scene_id}/generate-clip?project_id=${currentDocId}`);
            updateSceneInState(scene.scene_id, { clip_status: 'ready' });
            successCount++;
          } catch (err) {
            updateSceneInState(scene.scene_id, { clip_status: 'error' });
          }
        }
      }
      setShowFastRebuild(true);
      setStoryboardStatus({ loading: false, text: '' });
      toast.success(`Rendered ${successCount} clips!`);
    } catch (err) {
      toast.error(`Bulk clip rendering failed: ${err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleAssembleAndRender = async () => {
    try {
      // First render all clips
      await handleRenderAllClips();
      // Then render final video
      await handleRenderFinal();
    } catch (err) {
      toast.error(`Assemble and render failed: ${err.message}`);
    }
  };

  const handleRenderFinal = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Concatenating all clips into final movie...' });
      await axios.post(`${API_URL}/projects/${currentDocId}/render-final-video`);
      setFinalVideo(`${API_URL}/projects/${currentDocId}/video?t=${Date.now()}`);
      setShowFastRebuild(false); // Hide rebuild button after successful render
      toast.success('Final movie render successful! 🎞');
      setStoryboardStatus({ loading: false, text: '' });
    } catch (err) {
      toast.error(`Final render failed: ${err.response?.data?.detail || err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleFastRebuild = async () => {
    try {
      setStoryboardStatus({ loading: true, text: 'Rapidly rebuilding video from cached clips...' });
      await axios.post(`${API_URL}/projects/${currentDocId}/rebuild-video`);
      setFinalVideo(`${API_URL}/projects/${currentDocId}/video?t=${Date.now()}`);
      setShowFastRebuild(false); // Hide rebuild button after successful rebuild
      toast.success('Fast rebuild successful! ⚡');
      setStoryboardStatus({ loading: false, text: '' });
    } catch (err) {
      toast.error(`Rebuild failed: ${err.response?.data?.detail || err.message}`);
      setStoryboardStatus({ loading: false, text: '' });
    }
  };

  const handleDownloadVideo = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${currentDocId}/video`, {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video_${currentDocId}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video downloaded successfully!');
    } catch (err) {
      toast.error(`Download failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const MARGIN = sidebarCollapsed ? 68 : 240;

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main style={{ flex: 1, marginLeft: MARGIN, padding: '32px', minWidth: 0 }}>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            🎬 RAG Video Script Generator
          </h1>
          <p className="text-[var(--text-secondary)]">
            Upload a document → Build index → Generate narration-ready video scripts
          </p>
        </div>

        {/* Pipeline Progress */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[1, 2, 3].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                currentStep === step ? 'text-[var(--gold-primary)]' : 
                currentStep > step ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'
              }`}>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  currentStep === step ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)]' :
                  currentStep > step ? 'bg-[var(--success)] text-black border-[var(--success)]' :
                  'border-current'
                }`}>
                  {step}
                </span>
                <span>{['Upload', 'Index', 'Generate'][idx]}</span>
              </div>
              {idx < 2 && (
                <div className={`w-10 h-0.5 ${currentStep > step ? 'bg-[var(--success)]' : 'bg-[var(--border-default)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        <div className="glass-card p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold-primary)] to-purple-600 flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h2 className="text-xl font-display font-semibold">Upload Document</h2>
          </div>
          
          <div
            className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 text-center cursor-pointer transition-all hover:border-[var(--gold-primary)] hover:bg-[var(--gold-subtle)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt,.csv,.xlsx,.md"
              onChange={(e) => e.target.files.length && handleFileSelect(e.target.files[0])}
            />
            <Upload className="w-10 h-10 mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)]">Drop your document here or click to browse</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">PDF · DOCX · PPTX · TXT — up to 50 MB</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-lg mt-4">
              <FileText className="w-5 h-5" />
              <span className="flex-1 font-medium">{selectedFile.name}</span>
              <span className="text-sm text-[var(--text-muted)]">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus.status === 'uploading'}
            className="btn-primary mt-4"
          >
            Upload Document
          </button>

          {uploadStatus.text && (
            <div className="flex items-center gap-2 p-3 bg-[var(--bg-elevated)] rounded-lg mt-4">
              <div className={`w-2.5 h-2.5 rounded-full ${
                uploadStatus.status === 'uploaded' ? 'bg-[var(--success)]' :
                uploadStatus.status === 'uploading' ? 'bg-[var(--gold-primary)] animate-pulse' :
                'bg-[var(--danger)]'
              }`} />
              <span className="text-sm">{uploadStatus.text}</span>
              {currentDocId && <span className="ml-auto text-xs text-[var(--text-muted)]">ID: {currentDocId}</span>}
            </div>
          )}
        </div>

        {/* Step 2: Build Index */}
        {currentStep >= 2 && (
          <div className="glass-card p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold-primary)] to-purple-600 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h2 className="text-xl font-display font-semibold">Build Search Index</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Parse the document, split into chunks, generate embeddings, and create a FAISS vector index.
            </p>
            <button onClick={handleBuildIndex} className="btn-primary">
              <Database className="w-4 h-4" />
              Build Index
            </button>
            {indexStatus.text && (
              <div className="flex items-center gap-2 mt-4">
                {indexStatus.loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span className="text-sm">{indexStatus.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Generate Script */}
        {currentStep >= 3 && (
          <div className="glass-card p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold-primary)] to-purple-600 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h2 className="text-xl font-display font-semibold">Generate Video Script</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="form-label">Goal / Instruction</label>
                <textarea
                  className="input-neu"
                  rows="3"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>
              
              <div>
                <label className="form-label">Target Audience</label>
                <input
                  type="text"
                  className="input-neu"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                />
              </div>
              
              <div>
                <label className="form-label">Tone</label>
                <select
                  className="input-neu"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                  <option value="beginner-friendly">Beginner Friendly</option>
                  <option value="academic">Academic</option>
                  <option value="professional">Professional</option>
                  <option value="youtube-explainer">YouTube Explainer</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="input-neu"
                  min="1"
                  max="30"
                  value={formData.duration_minutes || ''}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div>
                <label className="form-label">Depth</label>
                <select
                  className="input-neu"
                  value={formData.depth}
                  onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Output Language</label>
                <input
                  type="text"
                  className="input-neu"
                  value={formData.output_language}
                  onChange={(e) => setFormData({ ...formData, output_language: e.target.value })}
                />
              </div>
              
              <div>
                <label className="form-label">Focus Areas (comma separated)</label>
                <input
                  type="text"
                  className="input-neu"
                  placeholder="e.g. methodology, results, conclusion"
                  value={formData.focus_areas}
                  onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_analogies}
                    onChange={(e) => setFormData({ ...formData, include_analogies: e.target.checked })}
                    className="accent-[var(--gold-primary)]"
                  />
                  <span className="text-sm">Include analogies</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_visual_cues}
                    onChange={(e) => setFormData({ ...formData, include_visual_cues: e.target.checked })}
                    className="accent-[var(--gold-primary)]"
                  />
                  <span className="text-sm">Include visual cues</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleGenerateScript} className="btn-primary">
                <Sparkles className="w-4 h-4" />
                Generate Script
              </button>
              <button onClick={handleDelete} className="btn-danger">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
            
            {genStatus.text && (
              <div className="flex items-center gap-2 mt-4">
                {genStatus.loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span className="text-sm">{genStatus.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Script Output */}
        {script && (
          <>
            <ScriptOutput script={script} />
            
            {/* Storyboard Section */}
            <StoryboardSection
              scenes={scenes}
              currentDocId={currentDocId}
              storyboardStatus={storyboardStatus}
              finalVideo={finalVideo}
              showFastRebuild={showFastRebuild}
              onGenerateStoryboard={handleGenerateStoryboard}
              onAssembleClips={handleAssembleClips}
              onRenderFinal={handleRenderFinal}
              onFastRebuild={handleFastRebuild}
              onDownloadVideo={handleDownloadVideo}
              onSaveNarration={handleSaveNarration}
              onSavePrompt={handleSavePrompt}
              onAnalyzeVisual={handleAnalyzeVisual}
              onGenerateAudio={handleGenerateAudio}
              onGenerateImage={handleGenerateImage}
              onUploadImage={handleUploadImage}
              onGenerateClip={handleGenerateClip}
              onGenerateAllAudio={handleGenerateAllAudio}
              onGenerateAllImages={handleGenerateAllImages}
              onRenderAllClips={handleRenderAllClips}
              onAssembleAndRender={handleAssembleAndRender}
              setFinalVideo={setFinalVideo}
            />
          </>
        )}
      </main>

      <style>{`@media (max-width: 1023px) { main[style] { margin-left: 0 !important; } }`}</style>
    </motion.div>
  );
}

// ── Storyboard Section Component ──────────────────────────────────────
function StoryboardSection({ scenes, currentDocId, storyboardStatus, finalVideo, showFastRebuild, onGenerateStoryboard, onAssembleClips, onRenderFinal, onFastRebuild, onDownloadVideo, onSaveNarration, onSavePrompt, onAnalyzeVisual, onGenerateAudio, onGenerateImage, onUploadImage, onGenerateClip, onGenerateAllAudio, onGenerateAllImages, onRenderAllClips, onAssembleAndRender, setFinalVideo }) {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('script');
  const [editedNarration, setEditedNarration] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [audioDuration, setAudioDuration] = useState(null);

  const selectedScene = scenes[selectedSceneIndex] || null;

  // Update edited values when scene changes - ALWAYS call hooks
  useEffect(() => {
    if (selectedScene) {
      setEditedNarration(selectedScene.narration_text || '');
      setEditedPrompt(selectedScene.visual_prompt || '');
      setAudioDuration(null); // Reset audio duration
    }
  }, [selectedScene]);

  if (scenes.length === 0) {
    return (
      <div className="glass-card p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">Storyboard</h2>
          <button 
            onClick={onGenerateStoryboard}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold text-sm shadow-lg hover:shadow-indigo-500/50"
          >
            <Wand2 className="w-4 h-4" />
            Generate Storyboard
          </button>
        </div>
        <div className="text-center py-12 px-4 bg-[var(--bg-elevated)] rounded-xl border-2 border-dashed border-[var(--border-default)]">
          <Film className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Scenes Yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Click "Generate Storyboard" to segment your script into scenes
          </p>
        </div>
      </div>
    );
  }

  if (!selectedScene) {
    return null;
  }

  // Handle audio duration
  const handleAudioLoad = (e) => {
    setAudioDuration(e.target.duration);
  };

  return (
    <div className="glass-card p-6 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-bold">Storyboard</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Ready
            </span>
            <span className="text-[var(--text-muted)]">🎬 {scenes.length} Scenes</span>
            <span className="text-[var(--text-muted)]">⏱ {scenes.reduce((acc, s) => acc + (Number(s.estimated_duration) || 0), 0).toFixed(0)}s</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onAssembleClips}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:border-[var(--gold-primary)] transition-all"
          >
            Copy
          </button>
          <button 
            onClick={onRenderFinal}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:border-[var(--gold-primary)] transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Horizontal Scene Selector */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {scenes.map((scene, idx) => (
            <button
              key={scene.scene_id}
              onClick={() => setSelectedSceneIndex(idx)}
              className={`px-4 py-3 rounded-lg border-2 transition-all min-w-[100px] relative ${
                selectedSceneIndex === idx
                  ? 'border-[var(--gold-primary)] bg-[var(--gold-subtle)]'
                  : 'border-[var(--border-default)] hover:border-[var(--gold-primary)]/50'
              } ${scene.clip_status === 'outdated' ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {scene.clip_status === 'outdated' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Scene needs update" />
              )}
              <div className="text-sm font-semibold">Scene {idx + 1}</div>
              <div className="flex gap-1 mt-1 justify-center">
                {scene.audio_status === 'ready' && <span className="text-xs">🎵</span>}
                {scene.image_status === 'ready' && <span className="text-xs">🖼</span>}
                {scene.clip_status === 'ready' && <span className="text-xs">✓</span>}
                {scene.clip_status === 'outdated' && <span className="text-xs text-orange-400">⚠</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Bulk Actions</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGenerateAllAudio}
            disabled={storyboardStatus.loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Generate All Audio
          </button>
          <button
            onClick={onGenerateAllImages}
            disabled={storyboardStatus.loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Generate All Images
          </button>
          <button
            onClick={onRenderAllClips}
            disabled={storyboardStatus.loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50"
          >
            <Film className="w-4 h-4" />
            Render All Clips
          </button>
          <button
            onClick={onAssembleAndRender}
            disabled={storyboardStatus.loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Assemble & Render Final
          </button>
        </div>
        {storyboardStatus.loading && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-400">{storyboardStatus.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner for Editing After Video Generation */}
      {finalVideo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-indigo-400 mb-1">Edit & Update Video</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                To update a scene: Select the scene → Click regenerate button (🔄) next to Audio/Image → Click "Render Clip" → Click "Update Video" to rebuild the final video with your changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scene Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Visual */}
        <div>
          <div className="bg-[var(--bg-elevated)] p-3 rounded-t-xl border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold">Visual</h3>
          </div>
          <div className="bg-[var(--bg-elevated)] p-4 rounded-b-xl">
            {/* Image Preview */}
            <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center overflow-hidden relative group">
              {selectedScene.clip_status === 'ready' ? (
                <video
                  src={`${API_URL}/assets/${currentDocId}/clips/${selectedScene.scene_id}.mp4?t=${Date.now()}`}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : selectedScene.image_status === 'ready' ? (
                <>
                  <img
                    src={`${API_URL}/assets/${currentDocId}/images/${selectedScene.scene_id}.jpg?t=${Date.now()}`}
                    alt={`Scene ${selectedSceneIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {/* Quick Regenerate Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => onGenerateImage(selectedScene.scene_id, 'cinematic_educational', selectedScene.visual_prompt)}
                      disabled={selectedScene.image_status === 'generating'}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-semibold text-sm disabled:opacity-50"
                      title="Regenerate this image"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <Film className="w-12 h-12 mx-auto mb-2 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">No visual generated</p>
                </div>
              )}
            </div>

            {/* Hear Audio Button with Duration */}
            {selectedScene.audio_status === 'ready' && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    const audio = document.getElementById(`audio-${selectedScene.scene_id}`);
                    if (audio) audio.play();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--audio-btn-bg)] hover:bg-[var(--audio-btn-hover)] text-[var(--audio-btn-text)] rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  Hear Audio
                  {audioDuration && (
                    <span className="text-xs opacity-80">({audioDuration.toFixed(1)}s)</span>
                  )}
                </button>
              </div>
            )}
            {selectedScene.audio_status === 'ready' && (
              <audio
                id={`audio-${selectedScene.scene_id}`}
                src={`${API_URL}/assets/${currentDocId}/audio/${selectedScene.scene_id}.mp3?t=${Date.now()}`}
                className="hidden"
                onLoadedMetadata={handleAudioLoad}
              />
            )}

            {/* Visual Description */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Visual Description</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {selectedScene.concept_summary || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div>
          <div className="bg-[var(--bg-elevated)] rounded-xl">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-default)]">
              <button 
                onClick={() => setActiveTab('script')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'script' 
                    ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Script
              </button>
              <button 
                onClick={() => setActiveTab('visuals')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'visuals' 
                    ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Visuals
              </button>
              <button 
                onClick={() => setActiveTab('audio')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'audio' 
                    ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Audio
              </button>
              <button 
                onClick={() => setActiveTab('timing')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'timing' 
                    ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Timing
              </button>
              <button 
                onClick={() => setActiveTab('directions')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'directions' 
                    ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Directions
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {/* Script Tab */}
              {activeTab === 'script' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Script Line</span>
                      </div>
                      <button
                        onClick={() => onSaveNarration(selectedScene.scene_id, editedNarration)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--gold-primary)] text-black rounded-lg hover:opacity-90 transition-all font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                    <textarea
                      value={editedNarration}
                      onChange={(e) => setEditedNarration(e.target.value)}
                      className="input-neu text-sm w-full"
                      rows="8"
                      placeholder="Enter scene narration..."
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Text Overlays</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm font-medium">Subtitle: {selectedScene.heading}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Visuals Tab */}
              {activeTab === 'visuals' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Image Prompt</span>
                      </div>
                      <button
                        onClick={() => onSavePrompt(selectedScene.scene_id, editedPrompt)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--gold-primary)] text-black rounded-lg hover:opacity-90 transition-all font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="input-neu text-sm w-full"
                      rows="6"
                      placeholder="Enter image generation prompt..."
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Style Preset</span>
                    </div>
                    <select className="input-neu text-sm w-full">
                      {STYLE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Concept Summary</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm">{selectedScene.concept_summary || 'No concept summary available'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onAnalyzeVisual(selectedScene.scene_id, 'cinematic_educational')}
                    disabled={selectedScene.analyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm w-full justify-center disabled:opacity-50 mb-4"
                  >
                    <Wand2 className="w-4 h-4" />
                    {selectedScene.analyzing ? 'Analyzing...' : 'Analyze Visual'}
                  </button>

                  {/* Upload Custom Image */}
                  <div className="border-t border-[var(--border-default)] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Or Upload Custom Image</span>
                    </div>
                    <input
                      type="file"
                      id={`image-upload-${selectedScene.scene_id}`}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onUploadImage(selectedScene.scene_id, file);
                          e.target.value = ''; // Reset input
                        }
                      }}
                    />
                    <button
                      onClick={() => document.getElementById(`image-upload-${selectedScene.scene_id}`).click()}
                      disabled={selectedScene.image_status === 'generating'}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm w-full justify-center disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Browse & Upload Image
                    </button>
                    <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                      Supported: JPG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                </>
              )}

              {/* Audio Tab */}
              {activeTab === 'audio' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Audio Status</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Status: <span className={`${
                            selectedScene.audio_status === 'ready' ? 'text-green-400' :
                            selectedScene.audio_status === 'generating' ? 'text-yellow-400' :
                            selectedScene.audio_status === 'error' ? 'text-red-400' :
                            'text-[var(--text-muted)]'
                          }`}>
                            {selectedScene.audio_status || 'Not generated'}
                          </span>
                        </span>
                        {audioDuration && (
                          <span className="text-sm text-[var(--text-muted)]">
                            Duration: {audioDuration.toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedScene.audio_status === 'ready' && (
                    <div className="mb-4">
                      <audio
                        controls
                        src={`${API_URL}/assets/${currentDocId}/audio/${selectedScene.scene_id}.mp3?t=${Date.now()}`}
                        className="w-full"
                        onLoadedMetadata={handleAudioLoad}
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Narration Text</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)] max-h-40 overflow-y-auto">
                      <p className="text-sm">{selectedScene.narration_text || 'No narration text'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Timing Tab */}
              {activeTab === 'timing' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Duration</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm">
                        Estimated: {Number(selectedScene.estimated_duration) || 0}s
                        {audioDuration && ` | Actual: ${audioDuration.toFixed(1)}s`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Scene Order</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm">Scene {selectedSceneIndex + 1} of {scenes.length}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Transitions</span>
                    </div>
                    <select className="input-neu text-sm w-full">
                      <option>Fade</option>
                      <option>Cut</option>
                      <option>Dissolve</option>
                      <option>Wipe</option>
                    </select>
                  </div>
                </>
              )}

              {/* Directions Tab */}
              {activeTab === 'directions' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Scene Heading</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm font-medium">{selectedScene.heading}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Visual Cues</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                      <p className="text-sm">{selectedScene.concept_summary || 'No visual cues'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Camera Notes</span>
                    </div>
                    <textarea
                      className="input-neu text-sm w-full"
                      rows="4"
                      placeholder="Add camera directions, framing notes, or special instructions..."
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-default)]">
                {/* Audio Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerateAudio(selectedScene.scene_id)}
                    disabled={selectedScene.audio_status === 'generating'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      selectedScene.audio_status === 'ready' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90'
                    } disabled:opacity-50`}
                  >
                    {selectedScene.audio_status === 'generating' ? 'Generating...' : selectedScene.audio_status === 'ready' ? '✓ Audio' : '🎵 Generate Audio'}
                  </button>
                  {selectedScene.audio_status === 'ready' && (
                    <button
                      onClick={() => onGenerateAudio(selectedScene.scene_id)}
                      disabled={selectedScene.audio_status === 'generating'}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all font-semibold text-sm disabled:opacity-50"
                      title="Regenerate Audio"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Image Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerateImage(selectedScene.scene_id, 'cinematic_educational', selectedScene.visual_prompt)}
                    disabled={selectedScene.image_status === 'generating'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      selectedScene.image_status === 'ready' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90'
                    } disabled:opacity-50`}
                  >
                    {selectedScene.image_status === 'generating' ? 'Generating...' : selectedScene.image_status === 'ready' ? '✓ Image' : '🖼 Generate Image'}
                  </button>
                  {selectedScene.image_status === 'ready' && (
                    <button
                      onClick={() => onGenerateImage(selectedScene.scene_id, 'cinematic_educational', selectedScene.visual_prompt)}
                      disabled={selectedScene.image_status === 'generating'}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all font-semibold text-sm disabled:opacity-50"
                      title="Regenerate Image"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Clip Button */}
                {(selectedScene.image_status === 'ready' && selectedScene.audio_status === 'ready') && (
                  <button
                    onClick={() => onGenerateClip(selectedScene.scene_id)}
                    disabled={selectedScene.clip_status === 'generating'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      selectedScene.clip_status === 'ready' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg'
                    } disabled:opacity-50`}
                  >
                    {selectedScene.clip_status === 'generating' ? 'Rendering...' : selectedScene.clip_status === 'ready' ? '✓ Clip' : '🎬 Render Clip'}
                  </button>
                )}

                {/* Update Video Button - Shows when clip is ready and final video exists */}
                {selectedScene.clip_status === 'ready' && finalVideo && (
                  <button
                    onClick={async () => {
                      try {
                        await onFastRebuild();
                        toast.success('Video updated with new scene!');
                      } catch (err) {
                        toast.error('Failed to update video');
                      }
                    }}
                    disabled={storyboardStatus.loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50 shadow-lg"
                    title="Update final video with this scene's changes"
                  >
                    <Sparkles className="w-4 h-4" />
                    Update Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Video Section */}
      {finalVideo && (
        <div className="mt-6 p-6 bg-[var(--bg-elevated)] rounded-xl border-2 border-[var(--gold-primary)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)] flex items-center justify-center text-lg font-bold text-black">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold">Final Video Export Ready</h3>
              <p className="text-sm text-[var(--text-secondary)]">Your video has been successfully rendered</p>
            </div>
            {showFastRebuild && (
              <button 
                onClick={onFastRebuild}
                disabled={storyboardStatus.loading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-lg hover:opacity-90 transition-all font-semibold text-sm disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Rebuild Video
              </button>
            )}
          </div>
          
          {storyboardStatus.loading && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-400">{storyboardStatus.text}</span>
              </div>
            </div>
          )}
          
          <video src={finalVideo} controls className="w-full rounded-lg bg-black mb-4" />
          
          <div className="flex gap-3">
            <button 
              onClick={onDownloadVideo}
              className="btn-primary"
            >
              <Download className="w-4 h-4" />
              Download MP4
            </button>
            <button 
              onClick={() => setFinalVideo(`${finalVideo.split('?')[0]}?t=${Date.now()}`)} 
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Preview
            </button>
            <button 
              onClick={() => {
                // Scroll to scene selector
                const sceneSelector = document.querySelector('.overflow-x-auto');
                if (sceneSelector) {
                  sceneSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg hover:opacity-90 transition-all font-semibold"
            >
              <Wand2 className="w-4 h-4" />
              Edit Scenes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Script Output Component ──────────────────────────────────────
function ScriptOutput({ script }) {
  return (
    <div className="glass-card overflow-hidden mb-5">
      <div className="p-6 bg-gradient-to-r from-[var(--gold-subtle)] to-transparent border-b border-[var(--border-default)]">
        <h2 className="text-2xl font-display font-bold mb-1">{script.title}</h2>
        <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
          <span>🎯 {script.target_audience}</span>
          <span>⏱ {script.estimated_duration}</span>
          <span>📅 {new Date(script.generated_at).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            🎣 Hook
          </div>
          <div className="p-4 bg-[var(--gold-subtle)] border-l-4 border-[var(--gold-primary)] rounded-r-lg italic text-lg">
            {script.hook}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            📖 Introduction
          </div>
          <p>{script.introduction}</p>
        </div>
        
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            📑 Main Sections
          </div>
          <div className="space-y-4">
            {script.main_sections.map((sec, i) => (
              <div key={i} className="glass-card p-4">
                <h3 className="font-semibold mb-1">{i + 1}. {sec.heading}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">{sec.summary}</p>
                <p className="text-sm">{sec.narration}</p>
                {sec.suggested_visuals?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sec.suggested_visuals.map((v, idx) => (
                      <span key={idx} className="badge-gold text-xs">🖼 {v}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            🎬 Conclusion
          </div>
          <p>{script.conclusion}</p>
        </div>
        
        {script.key_takeaways?.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
              💡 Key Takeaways
            </div>
            <ul className="space-y-1">
              {script.key_takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--gold-primary)]">✦</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            🎙 Full Narration Script
          </div>
          <div className="p-4 bg-[var(--bg-elevated)] rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
            {script.narration_script}
          </div>
        </div>
      </div>
    </div>
  );
}
