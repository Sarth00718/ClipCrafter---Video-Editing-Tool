import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Upload, Film, FileText, Scissors, Download, Play, 
  RefreshCw, Image as ImageIcon, Grid3x3, Loader2,
  CheckCircle, AlertCircle, Clock, Wand2
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar.jsx';
import { pageTransition } from '../utils/animations.js';
import { formatErrorForToast, isFFmpegError } from '../utils/errorMessages.js';

const API_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

export default function VideoFrameEditor() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Project state
  const [projectId, setProjectId] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Processing state
  const [processing, setProcessing] = useState({
    frames: false,
    script: false,
    scenes: false,
    rebuild: false
  });
  
  // Data state
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [frames, setFrames] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // View state
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [editingFrame, setEditingFrame] = useState(null);

  const MARGIN = sidebarCollapsed ? 68 : 240;
  const PER_PAGE = 20;

  // Fetch project status
  const fetchProjectStatus = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/video-upload/projects/${id}/status`);
      setProjectStatus(res.data);
      
      // Update step based on status
      if (res.data.has_rebuilt_video) {
        setCurrentStep(5);
      } else if (res.data.has_frames) {
        setCurrentStep(3);
      } else if (res.data.has_video) {
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP4, AVI, MOV, MKV, or WEBM');
      return;
    }
    
    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      toast.error('File too large. Maximum size is 500MB');
      return;
    }
    
    setSelectedFile(file);
  };

  // Handle video upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const res = await axios.post(
        `${API_URL}/video-upload/upload?extract_frames=false&extract_script=false&detect_scenes=false`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );
      
      setProjectId(res.data.project_id);
      setVideoMetadata(res.data.metadata);
      setCurrentStep(2);
      setActiveTab('process');
      
      toast.success('Video uploaded successfully! 🎉');
      
      // Fetch initial status
      await fetchProjectStatus(res.data.project_id);
      
    } catch (err) {
      const errorMsg = formatErrorForToast(err);
      toast.error(errorMsg);
      
      if (isFFmpegError(err)) {
        toast.error('Please install FFmpeg on the server to use video processing features.', {
          duration: 10000
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Extract frames
  const handleExtractFrames = async () => {
    if (!projectId) return;
    
    setProcessing({ ...processing, frames: true });
    
    try {
      const res = await axios.post(`${API_URL}/video-upload/projects/${projectId}/extract-frames`);
      
      toast.success(`Extracted ${res.data.frame_count} frames! 🎬`);
      setCurrentStep(3);
      setActiveTab('frames');
      
      await fetchProjectStatus(projectId);
      await fetchFrames(1);
      
    } catch (err) {
      const errorMsg = formatErrorForToast(err);
      toast.error(errorMsg);
      
      if (isFFmpegError(err)) {
        toast.error('FFmpeg is required for frame extraction. Please install it on the server.', {
          duration: 10000
        });
      }
    } finally {
      setProcessing({ ...processing, frames: false });
    }
  };

  // Extract script
  const handleExtractScript = async () => {
    if (!projectId) return;
    
    setProcessing({ ...processing, script: true });
    
    try {
      const res = await axios.post(`${API_URL}/video-upload/projects/${projectId}/extract-script`);
      
      setTranscript(res.data);
      toast.success('Script extracted successfully! 📝');
      
      await fetchProjectStatus(projectId);
      
    } catch (err) {
      toast.error(`Script extraction failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setProcessing({ ...processing, script: false });
    }
  };

  // Detect scenes
  const handleDetectScenes = async () => {
    if (!projectId) return;
    
    setProcessing({ ...processing, scenes: true });
    
    try {
      const res = await axios.post(`${API_URL}/video-upload/projects/${projectId}/detect-scenes`);
      
      setScenes(res.data.scenes);
      toast.success(`Detected ${res.data.scene_count} scenes! 🎞`);
      
      await fetchProjectStatus(projectId);
      
    } catch (err) {
      toast.error(`Scene detection failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setProcessing({ ...processing, scenes: false });
    }
  };

  // Fetch frames
  const fetchFrames = async (page) => {
    if (!projectId) return;
    
    try {
      const res = await axios.get(
        `${API_URL}/video-upload/projects/${projectId}/frames?page=${page}&per_page=${PER_PAGE}`
      );
      
      setFrames(res.data.frames);
      setCurrentPage(res.data.page);
      setTotalPages(res.data.total_pages);
      
    } catch (err) {
      console.error('Failed to fetch frames:', err);
    }
  };

  // Update frame
  const handleUpdateFrame = async (frameNumber, file) => {
    if (!projectId || !file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.put(
        `${API_URL}/video-upload/projects/${projectId}/frames/${frameNumber}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      toast.success(`Frame ${frameNumber} updated! 🎨`);
      setEditingFrame(null);
      
      await fetchFrames(currentPage);
      await fetchProjectStatus(projectId);
      
    } catch (err) {
      toast.error(`Frame update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Rebuild video
  const handleRebuildVideo = async () => {
    if (!projectId) return;
    
    setProcessing({ ...processing, rebuild: true });
    
    try {
      const res = await axios.post(
        `${API_URL}/video-upload/projects/${projectId}/rebuild-from-frames?fps=30&include_audio=true`
      );
      
      toast.success('Video rebuilt successfully! 🎉');
      setCurrentStep(5);
      setActiveTab('download');
      
      await fetchProjectStatus(projectId);
      
    } catch (err) {
      toast.error(`Video rebuild failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setProcessing({ ...processing, rebuild: false });
    }
  };

  // Download video
  const handleDownload = async () => {
    if (!projectId) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/video-upload/projects/${projectId}/download`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video_${projectId}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video downloaded! 📥');
      
    } catch (err) {
      toast.error(`Download failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Load project status on mount if projectId exists
  useEffect(() => {
    if (projectId) {
      fetchProjectStatus(projectId);
    }
  }, [projectId]);

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main style={{ flex: 1, marginLeft: MARGIN, padding: '32px', minWidth: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            🎬 Video Frame Editor
          </h1>
          <p className="text-[var(--text-secondary)]">
            Upload video → Extract frames → Edit frames → Rebuild video
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Process' },
            { num: 3, label: 'Edit Frames' },
            { num: 4, label: 'Rebuild' },
            { num: 5, label: 'Download' }
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                currentStep === step.num ? 'text-[var(--gold-primary)]' : 
                currentStep > step.num ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'
              }`}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  currentStep === step.num ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)]' :
                  currentStep > step.num ? 'bg-[var(--success)] text-black border-[var(--success)]' :
                  'border-current'
                }`}>
                  {currentStep > step.num ? '✓' : step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < 4 && (
                <div className={`w-8 h-0.5 ${currentStep > step.num ? 'bg-[var(--success)]' : 'bg-[var(--border-default)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'process', label: 'Process', icon: Wand2 },
            { id: 'frames', label: 'Frames', icon: Grid3x3 },
            { id: 'script', label: 'Script', icon: FileText },
            { id: 'scenes', label: 'Scenes', icon: Scissors },
            { id: 'download', label: 'Download', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--gold-primary)] text-black'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="glass-card p-6">
            <h2 className="text-2xl font-display font-bold mb-4">Upload Video</h2>
            
            <div
              className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-12 text-center cursor-pointer transition-all hover:border-[var(--gold-primary)] hover:bg-[var(--gold-subtle)]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => document.getElementById('video-input').click()}
            >
              <input
                id="video-input"
                type="file"
                className="hidden"
                accept="video/mp4,video/avi,video/mov,video/mkv,video/webm"
                onChange={(e) => e.target.files.length && handleFileSelect(e.target.files[0])}
              />
              <Film className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-lg font-semibold mb-2">Drop your video here or click to browse</p>
              <p className="text-sm text-[var(--text-muted)]">
                Supported: MP4, AVI, MOV, MKV, WEBM — up to 500 MB
              </p>
            </div>

            {selectedFile && (
              <div className="mt-6">
                <div className="flex items-center gap-3 p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <Film className="w-6 h-6 text-[var(--gold-primary)]" />
                  <div className="flex-1">
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary mt-4 w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Process Video
                    </>
                  )}
                </button>

                {uploading && (
                  <div className="mt-4">
                    <div className="w-full bg-[var(--bg-elevated)] rounded-full h-2">
                      <div
                        className="bg-[var(--gold-primary)] h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {videoMetadata && (
              <div className="mt-6 p-4 bg-[var(--bg-elevated)] rounded-lg">
                <h3 className="font-semibold mb-3">Video Metadata</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)]">Duration</p>
                    <p className="font-semibold">{videoMetadata.duration?.toFixed(1)}s</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">FPS</p>
                    <p className="font-semibold">{videoMetadata.fps?.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Resolution</p>
                    <p className="font-semibold">{videoMetadata.resolution}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Codec</p>
                    <p className="font-semibold">{videoMetadata.codec}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Process Tab */}
        {activeTab === 'process' && projectId && (
          <div className="glass-card p-6">
            <h2 className="text-2xl font-display font-bold mb-6">Process Video</h2>

            {projectStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {projectStatus.has_frames ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                    <span className="font-semibold">Frames</span>
                  </div>
                  <p className="text-2xl font-bold">{projectStatus.frame_count || 0}</p>
                  <p className="text-sm text-[var(--text-muted)]">Extracted frames</p>
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {projectStatus.has_transcript ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                    <span className="font-semibold">Script</span>
                  </div>
                  <p className="text-2xl font-bold">{projectStatus.has_transcript ? '✓' : '—'}</p>
                  <p className="text-sm text-[var(--text-muted)]">Transcript extracted</p>
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {projectStatus.scene_count > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                    <span className="font-semibold">Scenes</span>
                  </div>
                  <p className="text-2xl font-bold">{projectStatus.scene_count || 0}</p>
                  <p className="text-sm text-[var(--text-muted)]">Detected scenes</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Extract Frames</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Extract all frames from video for editing
                    </p>
                  </div>
                  <button
                    onClick={handleExtractFrames}
                    disabled={processing.frames || projectStatus?.has_frames}
                    className="btn-primary"
                  >
                    {processing.frames ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting...
                      </>
                    ) : projectStatus?.has_frames ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Extracted
                      </>
                    ) : (
                      <>
                        <Grid3x3 className="w-4 h-4" />
                        Extract Frames
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Extract Script</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Transcribe audio to text using AI
                    </p>
                  </div>
                  <button
                    onClick={handleExtractScript}
                    disabled={processing.script || projectStatus?.has_transcript}
                    className="btn-primary"
                  >
                    {processing.script ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting...
                      </>
                    ) : projectStatus?.has_transcript ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Extracted
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Extract Script
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Detect Scenes</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Automatically detect scene changes
                    </p>
                  </div>
                  <button
                    onClick={handleDetectScenes}
                    disabled={processing.scenes || (projectStatus?.scene_count > 0)}
                    className="btn-primary"
                  >
                    {processing.scenes ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (projectStatus?.scene_count > 0) ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Detected
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4" />
                        Detect Scenes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {projectStatus?.has_frames && (
              <button
                onClick={() => {
                  setActiveTab('frames');
                  fetchFrames(1);
                }}
                className="btn-primary w-full mt-6"
              >
                <Grid3x3 className="w-4 h-4" />
                View & Edit Frames
              </button>
            )}
          </div>
        )}

        {/* Frames Tab */}
        {activeTab === 'frames' && projectId && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">Edit Frames</h2>
              <div className="flex items-center gap-3">
                {projectStatus?.needs_rebuild && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                    Needs Rebuild
                  </span>
                )}
                <button
                  onClick={handleRebuildVideo}
                  disabled={processing.rebuild || !projectStatus?.needs_rebuild}
                  className="btn-primary"
                >
                  {processing.rebuild ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rebuilding...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Rebuild Video
                    </>
                  )}
                </button>
              </div>
            </div>

            {frames.length === 0 ? (
              <div className="text-center py-12">
                <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                <p className="text-lg font-semibold mb-2">No frames extracted yet</p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Go to Process tab to extract frames
                </p>
                <button
                  onClick={() => setActiveTab('process')}
                  className="btn-primary"
                >
                  Go to Process
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {frames.map((frame) => (
                    <div
                      key={frame.filename}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedFrame(frame)}
                    >
                      <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-[var(--border-default)] hover:border-[var(--gold-primary)] transition-all">
                        <img
                          src={`${API_URL}${frame.url}`}
                          alt={`Frame ${frame.frame_number}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFrame(frame);
                          }}
                          className="px-3 py-2 bg-[var(--gold-primary)] text-black rounded-lg font-semibold text-sm"
                        >
                          <ImageIcon className="w-4 h-4 inline mr-1" />
                          Edit
                        </button>
                      </div>
                      <p className="text-xs text-center mt-1 text-[var(--text-muted)]">
                        Frame {frame.frame_number}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => fetchFrames(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchFrames(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Script Tab */}
        {activeTab === 'script' && projectId && (
          <div className="glass-card p-6">
            <h2 className="text-2xl font-display font-bold mb-6">Extracted Script</h2>

            {!transcript ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                <p className="text-lg font-semibold mb-2">No script extracted yet</p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Go to Process tab to extract script
                </p>
                <button
                  onClick={() => setActiveTab('process')}
                  className="btn-primary"
                >
                  Go to Process
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--text-muted)]">Language</p>
                      <p className="font-semibold">{transcript.language}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Method</p>
                      <p className="font-semibold">{transcript.method}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Segments</p>
                      <p className="font-semibold">{transcript.segments?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-6 bg-[var(--bg-elevated)] rounded-lg">
                  <h3 className="font-semibold mb-3">Full Transcript</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {transcript.transcript}
                  </p>
                </div>

                {transcript.segments && transcript.segments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Segments</h3>
                    <div className="space-y-2">
                      {transcript.segments.map((seg) => (
                        <div
                          key={seg.id}
                          className="p-3 bg-[var(--bg-elevated)] rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[var(--text-muted)]">
                              {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-[var(--gold-subtle)] text-[var(--gold-primary)] rounded">
                              {seg.duration.toFixed(1)}s
                            </span>
                          </div>
                          <p className="text-sm">{seg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scenes Tab */}
        {activeTab === 'scenes' && projectId && (
          <div className="glass-card p-6">
            <h2 className="text-2xl font-display font-bold mb-6">Detected Scenes</h2>

            {scenes.length === 0 ? (
              <div className="text-center py-12">
                <Scissors className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                <p className="text-lg font-semibold mb-2">No scenes detected yet</p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Go to Process tab to detect scenes
                </p>
                <button
                  onClick={() => setActiveTab('process')}
                  className="btn-primary"
                >
                  Go to Process
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[var(--bg-elevated)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Scene {idx + 1}</h3>
                      <span className="text-sm text-[var(--text-muted)]">
                        {scene.timestamp.toFixed(2)}s
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      Frame: {scene.frame}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Download Tab */}
        {activeTab === 'download' && projectId && (
          <div className="glass-card p-6">
            <h2 className="text-2xl font-display font-bold mb-6">Download Video</h2>

            {projectStatus?.has_rebuilt_video ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Video Ready!</h3>
                <p className="text-[var(--text-muted)] mb-6">
                  Your edited video has been successfully rebuilt
                </p>
                <button
                  onClick={handleDownload}
                  className="btn-primary text-lg px-8 py-4"
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                <h3 className="text-xl font-bold mb-2">Video Not Ready</h3>
                <p className="text-[var(--text-muted)] mb-6">
                  {projectStatus?.needs_rebuild
                    ? 'Please rebuild the video after editing frames'
                    : 'Please process and edit frames first'}
                </p>
                <button
                  onClick={() => setActiveTab(projectStatus?.needs_rebuild ? 'frames' : 'process')}
                  className="btn-primary"
                >
                  {projectStatus?.needs_rebuild ? 'Go to Frames' : 'Go to Process'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Frame Edit Modal */}
        {editingFrame && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">
                Edit Frame {editingFrame.frame_number}
              </h3>

              <div className="mb-4">
                <img
                  src={`${API_URL}${editingFrame.url}`}
                  alt={`Frame ${editingFrame.frame_number}`}
                  className="w-full rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Upload New Frame
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleUpdateFrame(editingFrame.frame_number, e.target.files[0]);
                    }
                  }}
                  className="input-neu"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingFrame(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Frame Preview Modal */}
        {selectedFrame && !editingFrame && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedFrame(null)}
          >
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Frame {selectedFrame.frame_number}
                </h3>
                <button
                  onClick={() => setSelectedFrame(null)}
                  className="text-white hover:text-[var(--gold-primary)]"
                >
                  ✕
                </button>
              </div>
              <img
                src={`${API_URL}${selectedFrame.url}`}
                alt={`Frame ${selectedFrame.frame_number}`}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}
      </main>

      <style>{`@media (max-width: 1023px) { main[style] { margin-left: 0 !important; } }`}</style>
    </motion.div>
  );
}
