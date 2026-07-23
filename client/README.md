<div align="center">

# 🎬 ClipCrafters — Frontend

### React 18 SPA for AI-Powered Video Editing

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-4+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

[Main Docs](../README.md) · [Backend Docs](../server/README.md) · [Live Demo](#)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Setup & Run](#setup--run)
5. [Environment Variables](#environment-variables)
6. [Key Features](#key-features)
7. [Component Architecture](#component-architecture)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Routing](#routing)
11. [Styling](#styling)
12. [Build & Deployment](#build--deployment)

---

## Overview

The ClipCrafters frontend is a modern React 18 single-page application built with Vite. It provides an intuitive interface for users to generate, edit, and manage AI-powered videos through a clean, responsive UI.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI library with concurrent rendering |
| **Vite** | 4.x | Lightning-fast dev server and build tool |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **React Router** | 6.x | Client-side routing |
| **Axios** | 1.x | HTTP client for API calls |
| **Framer Motion** | 10.x | Animation library |
| **React Snowfall** | Latest | Customizable snowfall effects |
| **Chart.js** | Latest | Interactive charts and graphs |
| **React-Chartjs-2** | Latest | React wrapper for Chart.js |
| **Lucide React** | Latest | Icon library |
| **Sonner** | Latest | Toast notifications |

---

## Folder Structure

```
client/
├── public/
│   └── vite.svg                # Static assets
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Root component
│   ├── index.css               # Global Tailwind CSS
│   ├── App.css                 # Component styles
│   ├── components/
│   │   ├── Layout.jsx          # Root shell (sidebar + outlet)
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── ProtectedRoute.jsx  # Auth guard wrapper
│   │   ├── ui/                 # Reusable primitive components
│   │   ├── forms/              # Domain-specific form components
│   │   ├── editor/             # Video editor components
│   │   └── dashboard/          # Dashboard widgets
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state
│   │   └── ThemeContext.jsx    # Theme management
│   ├── hooks/
│   │   ├── useAuth.js          # Auth hook
│   │   ├── useApi.js           # API call hook
│   │   └── useDebounce.js      # Debounce utility
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Dashboard.jsx       # User dashboard
│   │   ├── Projects.jsx        # Project list
│   │   ├── VideoEditor.jsx     # Video editing interface
│   │   └── NotFound.jsx        # 404 page
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   ├── auth.service.js     # Auth API calls
│   │   ├── project.service.js  # Project API calls
│   │   ├── video.service.js    # Video API calls
│   │   └── scene.service.js    # Scene API calls
│   └── utils/
│       ├── constants.js        # App constants
│       ├── helpers.js          # Helper functions
│       └── validators.js       # Form validation
├── .env                        # Environment variables
├── .gitignore
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json
├── vite.config.js              # Vite configuration
└── README.md                   # ← This file
```

---

## Setup & Run

### Prerequisites

- Node.js ≥ 18 LTS
- npm or yarn

### Install Dependencies

```bash
cd client
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env if you need to change the API URL or other settings
```

See [Environment Variables](#environment-variables) section for details.

> **Security Note:** The `.env` file is git-ignored and should never be committed. Always use `.env.example` as a template.

### Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### Production Build

```bash
npm run build
```

Build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## Environment Variables

Copy the example file and configure:

```bash
cd client
cp .env.example .env
```

Edit `.env` with your settings:

```env
# ── Backend API URL ───────────────────────────────
VITE_API_URL=http://localhost:5001/api

# ── Application Settings ──────────────────────────
VITE_DEBUG=true
VITE_APP_NAME=ClipCrafters

# ── Feature Flags ──────────────────────────────────
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DARK_MODE=true
```

Access in code via `import.meta.env.VITE_API_URL`

> **Note:** All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

---

## Key Features

### 🎨 UI/UX Features
- **Custom Cursor** — Animated cursor with particle trails and glow effects
- **Snowfall Effects** — Customizable snowfall with toggle button in sidebar
- **3D CSS Effects** — Depth layers, floating animations, and perspective transforms
- **Page Transitions** — Smooth slow-motion transitions between pages
- **Hover Effects** — Zoom, glow, border animations, and 3D lift effects
- **Modern Theme** — Indigo/purple gradient color scheme with light/dark modes
- **Glass Morphism** — Frosted glass cards with backdrop blur
- **Responsive Design** — Mobile-first approach with full responsive support
- **Performance Optimized** — React.memo, useCallback, useMemo, and RAF optimization

### 📊 Dashboard & Analytics
- **Interactive Charts** — Bar, Pie, and Line charts with Chart.js
- **Real-time Stats** — Project statistics and activity tracking
- **Activity Feed** — Recent actions and updates
- **Quick Actions** — Fast access to common tasks

### User Authentication
- JWT-based authentication
- Protected routes with auth guards
- Persistent login with localStorage
- Auto-redirect on token expiration

### Project Management
- Create, edit, and delete projects
- Project list with search and filters
- Project status tracking

### Video Generation
- Text-to-video generation interface
- Real-time generation progress
- Scene-by-scene preview

### Video Editor
- Scene management (reorder, edit, delete)
- Script editing with live preview
- Visual prompt customization
- Voiceover regeneration

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Sidebar with collapse functionality
- Mobile navigation drawer

### Additional Pages
- **About Us** — Company information with animations
- **Contact** — Contact form with NIRMA University address
- **FAQ** — Frequently asked questions with accordion
- **Profile** — User profile management with avatar upload

---

## Component Architecture

### Layout Components
- `Layout.jsx` — Root shell with sidebar and outlet
- `Navbar.jsx` — Top navigation with user menu
- `ProtectedRoute.jsx` — Auth guard for private routes

### UI Components
- Reusable primitives (Button, Input, Card, Modal)
- Consistent design system
- Accessible components

### Feature Components
- Domain-specific components (ProjectCard, SceneEditor)
- Composed from UI primitives
- Business logic integration

---

## State Management

### Context API
- `AuthContext` — User authentication state
- `ThemeContext` — Dark/light mode

### Local State
- Component-level state with `useState`
- Form state management
- UI state (modals, dropdowns)

### Server State
- API data fetching with Axios
- Loading and error states
- Optimistic updates

---

## API Integration

### Axios Configuration

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Layer

```javascript
// src/services/project.service.js
import api from './api';

export const projectService = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects/create', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};
```

---

## Routing

### Route Configuration

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/editor/:videoId" element={<VideoEditor />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Styling

### Tailwind CSS

Utility-first CSS framework for rapid UI development.

```jsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
  Generate Video
</button>
```

### Custom Styles

Global styles in `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set these in your hosting platform:
- `VITE_API_URL` — Backend API URL

---

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR for React components. Changes reflect immediately without full page reload.

### ESLint

```bash
npm run lint
```

### Code Formatting

Use Prettier for consistent code style:

```bash
npm install -D prettier
npx prettier --write "src/**/*.{js,jsx}"
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](../LICENSE) for details.
