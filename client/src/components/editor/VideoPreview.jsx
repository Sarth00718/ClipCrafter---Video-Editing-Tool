import { motion } from 'framer-motion';
import { Film, Edit3 } from 'lucide-react';
import { ProgressBar, Spinner } from '../ui/index.jsx';

export default function VideoPreview({ video, selectedScene, onEditScene }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Video area */}
      <div style={{ flex: '0 0 auto', background: '#000', position: 'relative', aspectRatio: '16/9' }}>
        {video?.finalVideoUrl ? (
          <video
            src={video.finalVideoUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : video?.generationStatus === 'processing' || video?.generationStatus === 'pending' ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-secondary)' }}
          >
            <Spinner size={36} />
            <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              Generating your video...
            </p>
          </motion.div>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
            <Film size={48} color="var(--text-muted)" />
          </div>
        )}
      </div>

      {/* Scene info */}
      {selectedScene && (
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Scene {selectedScene.sceneNumber}
            </h3>
            <button onClick={() => onEditScene(selectedScene)} className="btn-primary btn-sm" data-cursor="pointer">
              <Edit3 size={14} /> Edit Scene
            </button>
          </div>

          {selectedScene.scriptText && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {selectedScene.scriptText}
            </p>
          )}

          {selectedScene.sourceReference && (
            <span className="badge badge-gold" style={{ alignSelf: 'flex-start' }}>
              📎 {selectedScene.sourceReference}
            </span>
          )}

          {selectedScene.confidenceScore != null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                <span className="gradient-text" style={{ fontWeight: 700 }}>
                  {Math.round(selectedScene.confidenceScore * 100)}%
                </span>
              </div>
              <ProgressBar value={selectedScene.confidenceScore * 100} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
