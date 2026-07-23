import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Film, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { videoService } from '../../services/index.js';

export default function VideoUpload({ projectId, onUploadComplete, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('sourceFile', file);
    formData.append('projectId', projectId);
    if (title) formData.append('title', title);

    try {
      // Simulate progress (since we don't have real upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const res = await videoService.upload(formData);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Video uploaded successfully!');
      onUploadComplete?.(res.data.data.video);
      
      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setTitle('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ maxWidth: 500 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
            Upload Video
          </h2>
          <button onClick={onClose} className="btn-icon" disabled={uploading}>
            <X size={18} />
          </button>
        </div>

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'var(--bg-elevated)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-primary)';
              e.currentTarget.style.background = 'var(--gold-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
          >
            <Upload size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
              Click to select video file
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              MP4, MOV, AVI, WebM (Max 100MB)
            </p>
          </div>
        ) : (
          <div>
            <div
              className="glass-card"
              style={{
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: 'var(--gold-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Film size={24} color="var(--gold-primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!uploading && (
                <button onClick={handleRemoveFile} className="btn-icon">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Video Title (Optional)</label>
              <input
                type="text"
                className="input-neu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Uploading...
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-primary)' }}>
                    {progress}%
                  </span>
                </div>
                <div className="progress-bar-track" style={{ height: 6 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%`, transition: 'width 0.3s' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onClose}
                className="btn-ghost"
                disabled={uploading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="btn-primary"
                disabled={uploading}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {uploading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </motion.div>
    </div>
  );
}
