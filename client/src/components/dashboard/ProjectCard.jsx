import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, ExternalLink, Info } from 'lucide-react';
import { useCardTilt } from '../../hooks/index.js';
import { Badge } from '../ui/index.jsx';
import { formatRelative, statusToVariant } from '../../utils/formatters.js';
import { scaleIn } from '../../utils/animations.js';

const ProjectCard = memo(function ProjectCard({ project, onDelete }) {
  const tiltRef = useCardTilt();

  const statusLabel = { draft: 'Draft', processing: 'Processing', completed: 'Completed', failed: 'Failed' };

  return (
    <motion.div
      ref={tiltRef}
      variants={scaleIn}
      className="glass-card card-3d"
      data-cursor="pointer"
      style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', margin: 0 }}>
          {project.title}
        </h3>
        <Badge variant={statusToVariant(project.status)}>{statusLabel[project.status] || project.status}</Badge>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
      )}

      {/* Chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {project.sourceType && (
          <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{project.sourceType}</span>
        )}
        {project.videos?.length > 0 && (
          <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)', fontSize: '0.65rem' }}>
            {project.videos.length} video{project.videos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatRelative(project.createdAt)}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/projects/${project._id}`} className="btn-icon" title="View Details" data-cursor="pointer">
            <Info size={14} />
          </Link>
          {project.status === 'completed' && project.videos?.[0] && (
            <Link to={`/editor/${project.videos[0]}`} className="btn-icon" title="Open Editor" data-cursor="pointer" style={{ borderColor: 'var(--border-active)', color: 'var(--gold-primary)' }}>
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            onClick={() => onDelete(project._id)}
            className="btn-icon"
            title="Delete"
            data-cursor="pointer"
            style={{ borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default ProjectCard;
