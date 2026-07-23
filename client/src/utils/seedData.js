import { unsplash } from './imageLoader.js';

// ─── Features ─────────────────────────────────────────────────────────────────
export const FEATURES = [
  { icon: 'Edit3', title: 'Scene-Level Editing', desc: 'Edit individual scenes independently — change scripts, visuals, or voice without touching the rest of your video.', color: 'var(--gold-primary)' },
  { icon: 'Shield', title: 'Zero Hallucination', desc: 'Every claim is grounded in your source document. AI flags uncertain content before it reaches your audience.', color: 'var(--gold-primary)' },
  { icon: 'Brain', title: 'Agentic AI Pipeline', desc: 'Multi-agent system handles research, writing, fact-checking, and visual generation automatically.', color: 'var(--gold-primary)' },
  { icon: 'Activity', title: 'Confidence Scoring', desc: 'See a confidence percentage per scene. Know exactly how reliable each part of your video is.', color: 'var(--gold-primary)' },
  { icon: 'History', title: 'Full Edit History', desc: 'Every change is versioned. Roll back any scene to any previous state with one click.', color: 'var(--gold-primary)' },
  { icon: 'Zap', title: 'Instant Generation', desc: 'From research paper to publishable video in under 60 seconds. 10× faster than traditional editing.', color: 'var(--gold-primary)' },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
export const STATS = [
  { icon: 'Film', value: 50000, suffix: '+', label: 'Videos Generated' },
  { icon: 'CheckCircle2', value: 98, suffix: '%', label: 'Accuracy Rate' },
  { icon: 'Layers', value: 10000, suffix: '+', label: 'Expert Creators' },
  { icon: 'Zap', value: 45, suffix: 's', label: 'Avg Gen Time' },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
export const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Research Scientist, MIT',
    avatar: unsplash.avatar1,
    quote: "ClipCrafters is the only tool I trust with citation-sensitive research content. The grounding accuracy is genuinely remarkable — I've never had a single hallucinated claim.",
    rating: 5,
    tag: 'Research',
  },
  {
    name: 'Marcus Thompson',
    role: 'Educational Content Creator',
    avatar: unsplash.avatar2,
    quote: "I went from spending 8 hours per lecture video to 30 minutes. The scene editor gives me exactly the control I need without sacrificing accuracy.",
    rating: 5,
    tag: 'Education',
  },
  {
    name: 'Priya Patel',
    role: 'Policy Analyst, World Bank',
    avatar: unsplash.avatar3,
    quote: "For briefing documents, accuracy is non-negotiable. ClipCrafters' confidence scoring tells me exactly which parts of my video need review.",
    rating: 5,
    tag: 'Policy',
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const PRICING = [
  {
    name: 'Free',
    desc: 'For individuals just starting',
    price: { monthly: 0, annual: 0 },
    features: ['3 projects/month', 'HD output (720p)', '8 scenes max', 'Basic fact-check', 'Email support'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    desc: 'For researchers and educators',
    price: { monthly: 999, annual: 799 },
    features: ['Unlimited projects', '4K output', 'Unlimited scenes', 'Advanced AI grounding', 'Edit history & undo', 'Priority support', 'Custom voice'],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    desc: 'For institutions and enterprises',
    price: { monthly: 1999, annual: 1999 },
    features: ['Everything in Pro', 'Team collaboration', 'Custom AI training', 'API access', 'SSO & SAML', 'Dedicated support', 'Unlimited history'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// ─── Activity Feed ────────────────────────────────────────────────────────────
export const ACTIVITY_FEED = [
  { type: 'generate', icon: 'Edit3', message: 'Video generated', project: 'Climate Change Paper', time: '2m ago' },
  { type: 'edit', icon: 'Edit3', message: 'Scene 3 edited', project: 'Policy Brief Q4', time: '15m ago' },
  { type: 'factcheck', icon: 'Shield', message: 'Fact check passed', project: 'Lecture — Ethics 101', time: '1h ago' },
  { type: 'edit', icon: 'Edit3', message: 'Script updated', project: 'Annual Report Video', time: '3h ago' },
  { type: 'undo', icon: 'RotateCcw', message: 'Change reverted', project: 'Product Demo', time: '5h ago' },
];

// ─── Navigation Commands ──────────────────────────────────────────────────────
export const NAV_COMMANDS = [
  { label: 'Go to Dashboard', route: '/dashboard', icon: 'BarChart3', shortcut: '⌘D' },
  { label: 'Create New Project', route: '/projects/create', icon: 'Plus', shortcut: '⌘N' },
  { label: 'View Profile', route: '/profile', icon: 'User', shortcut: '⌘P' },
];
