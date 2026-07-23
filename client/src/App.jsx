import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Loader from './components/ui/Loader.jsx';
import CommandPalette from './components/ui/CommandPalette.jsx';
import CustomCursor from './components/ui/CustomCursor.jsx';
import SnowfallEffect from './components/ui/SnowfallEffect.jsx';

// Lazy page imports
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ProjectCreate = lazy(() => import('./pages/ProjectCreate.jsx'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails.jsx'));
const VideoDetail = lazy(() => import('./pages/VideoDetail.jsx'));
const VideoEditor = lazy(() => import('./pages/VideoEditor.jsx'));
const VideoFrameEditor = lazy(() => import('./pages/VideoFrameEditor.jsx'));
const SceneEditor = lazy(() => import('./pages/SceneEditor.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const RAGVideoGenerator = lazy(() => import('./pages/RAGVideoGenerator.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const FAQ = lazy(() => import('./pages/FAQ.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));



export default function App() {
  const location = useLocation();
  const [snowfallEnabled, setSnowfallEnabled] = useState(
    localStorage.getItem('snowfall') !== 'false'
  );

  // Scroll-to-top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <>
      {snowfallEnabled && <SnowfallEffect />}
      <CustomCursor />
      <CommandPalette />

      <AnimatePresence mode="wait">
        <Suspense fallback={<Loader />}>
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<Home snowfallEnabled={snowfallEnabled} setSnowfallEnabled={setSnowfallEnabled} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects/create" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            <Route path="/videos/:id" element={<ProtectedRoute><VideoDetail /></ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute><VideoEditor /></ProtectedRoute>} />
            <Route path="/video-editor" element={<ProtectedRoute><VideoFrameEditor /></ProtectedRoute>} />
            <Route path="/scenes/:id" element={<ProtectedRoute><SceneEditor /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/rag-generator" element={<ProtectedRoute><RAGVideoGenerator /></ProtectedRoute>} />
            <Route path="/about" element={<About snowfallEnabled={snowfallEnabled} setSnowfallEnabled={setSnowfallEnabled} />} />
            <Route path="/contact" element={<Contact snowfallEnabled={snowfallEnabled} setSnowfallEnabled={setSnowfallEnabled} />} />
            <Route path="/faq" element={<FAQ snowfallEnabled={snowfallEnabled} setSnowfallEnabled={setSnowfallEnabled} />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
}
