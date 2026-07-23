<div align="center">

# 🎬 ClipCrafters

### AI-Powered Video Generation & RAG-Based Script Creation Platform

**Transform documents and text into professional videos with AI-powered script generation, voiceover, and visual synthesis**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Frontend Docs](./client/README.md) · [Backend Docs](./server/README.md) · [FastAPI Docs](./fastapi/README.md) · [Live Demo](#)

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Quick Start](#-quick-start)
6. [Environment Setup](#-environment-setup)
7. [API Documentation](#-api-documentation)
8. [Features](#-features)
9. [Development Workflow](#-development-workflow)
10. [Deployment](#-deployment)
11. [Contributing](#-contributing)
12. [License](#-license)

---

## 🎯 Overview

ClipCrafters is a comprehensive AI-powered platform that combines three powerful services:

### 🎨 Frontend (React 18 + Vite)
Modern, responsive single-page application with stunning UI/UX featuring custom cursor, snowfall effects, 3D CSS animations, and smooth page transitions.

### 🔧 Backend (Node.js + Express)
RESTful API handling user authentication, project management, video operations, and orchestration between services.

### 🤖 AI Service (FastAPI + Python)
RAG-powered document processing and script generation using FAISS indexing, sentence transformers, and Groq LLM.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| 📄 **Document Upload** | Support for PDF, DOCX, PPTX, TXT files |
| 🧠 **RAG Pipeline** | Intelligent document chunking, embedding, and retrieval |
| ✍️ **Script Generation** | AI-powered educational video scripts from documents |
| 🎬 **Video Creation** | Text-to-video generation with AI visuals and voiceover |
| ✂️ **Scene Editing** | Granular control over video scenes and timing |
| 🎤 **Voiceover** | AI-generated narration with multiple voices |
| 🎨 **Visual Generation** | AI-powered image and video generation |
| ☁️ **Cloud Storage** | Secure media storage with Cloudinary CDN |
| 🔐 **Authentication** | JWT-based auth with refresh tokens |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  React 18 SPA · Vite · Tailwind CSS · React Router · Framer Motion │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/REST + JWT
┌────────────────────────────┴────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│    Express.js · Node.js 18 · JWT Auth · Mongoose ODM · Bcrypt     │
│    Cloudinary · Resend · Rate Limiting · Security Middleware       │
└────────────┬───────────────────────────────────┬────────────────────┘
             │                                   │
             │ MongoDB                           │ HTTP/REST
             │ Connection                        │
             ▼                                   ▼
┌────────────────────────┐    ┌──────────────────────────────────────┐
│    DATA LAYER          │    │         AI SERVICES LAYER            │
│  MongoDB Atlas         │    │  FastAPI · Python · RAG Pipeline     │
│  User, Project, Video  │    │  FAISS · SentenceTransformers        │
│  Scene, EditHistory    │    │  Groq LLM · Edge TTS · MoviePy       │
└────────────────────────┘    │  Stability.ai · Google Gemini        │
                              └──────────────────────────────────────┘
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant MongoDB
    participant FastAPI
    participant AI Services

    User->>Frontend: Upload Document
    Frontend->>Backend: POST /api/upload
    Backend->>MongoDB: Save metadata
    Backend->>FastAPI: POST /upload-document
    FastAPI->>FastAPI: Parse & Store
    FastAPI-->>Backend: Document ID
    Backend-->>Frontend: Success

    User->>Frontend: Generate Script
    Frontend->>Backend: POST /api/generate
    Backend->>FastAPI: POST /build-index
    FastAPI->>FastAPI: Chunk → Embed → FAISS
    FastAPI-->>Backend: Index Ready
    Backend->>FastAPI: POST /generate-script
    FastAPI->>AI Services: Groq LLM Query
    AI Services-->>FastAPI: Generated Script
    FastAPI-->>Backend: Structured JSON
    Backend->>MongoDB: Save Script
    Backend-->>Frontend: Script Data

    User->>Frontend: Generate Video
    Frontend->>Backend: POST /api/videos/generate
    Backend->>FastAPI: POST /generate-voiceover
    FastAPI->>AI Services: Edge TTS
    AI Services-->>FastAPI: Audio Files
    Backend->>FastAPI: POST /generate-visuals
    FastAPI->>AI Services: Stability.ai
    AI Services-->>FastAPI: Image/Video
    Backend->>FastAPI: POST /render-video
    FastAPI->>FastAPI: MoviePy Assembly
    FastAPI-->>Backend: Video URL
    Backend->>MongoDB: Update Status
    Backend-->>Frontend: Video Ready
```

---

## 🛠️ Tech Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI library with concurrent rendering |
| Vite | 4.x | Lightning-fast dev server & build tool |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client with interceptors |
| Framer Motion | 10.x | Animation library |
| React Snowfall | Latest | Customizable snowfall effects |
| Lucide React | Latest | Icon library |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18 LTS | JavaScript runtime |
| Express.js | 4.x | Web framework |
| MongoDB | Atlas | NoSQL database |
| Mongoose | 7.x | MongoDB ODM |
| JWT | 9.x | Authentication tokens |
| Bcrypt | 5.x | Password hashing |
| Cloudinary | Latest | Media storage & CDN |
| Resend | Latest | Transactional emails |
| Helmet | Latest | Security headers |

### AI Service Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Programming language |
| FastAPI | Latest | Modern async web framework |
| FAISS | 1.13+ | Vector similarity search |
| SentenceTransformers | 3.3.1 | Text embeddings |
| Groq | Latest | LLM API client |
| LangChain | Latest | LLM orchestration |
| Murf AI | Latest | High-quality text-to-speech |
| PyMuPDF | 1.25.3 | PDF parsing |
| python-docx | 1.1.2 | DOCX parsing |
| python-pptx | 1.0.2 | PPTX parsing |
| MoviePy | 2.2+ | Video editing |

---

## 📁 Project Structure

```
ClipCrafters/
│
├── 📁 client/                      # React 18 Frontend
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Root component
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # React Context (Auth, Theme)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/                  # Route-level pages
│   │   ├── services/               # API client services
│   │   └── utils/                  # Helper functions
│   ├── .env                        # Frontend environment vars
│   ├── .env.example                # Frontend env template
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── 📁 server/                      # Node.js Backend
│   ├── src/
│   │   ├── app.js                  # Express app factory
│   │   ├── server.js               # HTTP server entry
│   │   ├── config/                 # Configuration
│   │   ├── controllers/            # Request handlers
│   │   ├── middlewares/            # Express middlewares
│   │   ├── models/                 # Mongoose schemas
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business logic
│   │   ├── utils/                  # Utilities
│   │   └── validators/             # Input validation
│   ├── .env                        # Backend environment vars
│   ├── .env.example                # Backend env template
│   ├── package.json
│   └── README.md
│
├── 📁 fastapi/                     # Python AI Service
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── api/                    # API routes
│   │   │   ├── routes.py           # Document endpoints
│   │   │   └── video_routes.py     # Video endpoints
│   │   ├── core/                   # Core configuration
│   │   │   ├── config.py           # Settings
│   │   │   └── logger.py           # Logging
│   │   ├── models/                 # Pydantic schemas
│   │   ├── prompts/                # LLM prompts
│   │   ├── rag/                    # RAG pipeline
│   │   │   ├── embedder.py         # Text embeddings
│   │   │   ├── faiss_index.py      # Vector index
│   │   │   ├── retriever.py        # Document retrieval
│   │   │   └── script_generator.py # Script generation
│   │   ├── services/               # Document processing
│   │   │   ├── parsers.py          # File parsers
│   │   │   └── chunker.py          # Text chunking
│   │   ├── storage/                # File storage
│   │   │   ├── uploads/            # Uploaded files
│   │   │   ├── indices/            # FAISS indices
│   │   │   ├── parsed/             # Parsed text
│   │   │   ├── scripts/            # Generated scripts
│   │   │   └── projects/           # Video assets
│   │   ├── video/                  # Video generation
│   │   └── utils/                  # Utilities
│   ├── frontend/                   # Static frontend files
│   ├── venv/                       # Python virtual env
│   ├── .env                        # AI service environment vars
│   ├── .env.sample                 # AI service env template
│   ├── requirements.txt            # Python dependencies
│   └── README.md
│
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Multi-service orchestration
└── README.md                       # ← This file
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| Python | 3.9+ | [python.org](https://python.org) |
| MongoDB | Atlas account | [mongodb.com/atlas](https://mongodb.com/atlas) |
| Git | 2.x | [git-scm.com](https://git-scm.com) |

### Clone Repository

```bash
git clone https://github.com/your-org/ClipCrafters.git
cd ClipCrafters
```

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- FastAPI Service: http://localhost:8000
- API Docs: http://localhost:5001/api/docs
- FastAPI Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### 1. Setup Backend (Node.js)

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

Backend runs on http://localhost:5001

#### 2. Setup AI Service (Python)

```bash
cd fastapi
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

cp .env.sample .env
# Edit .env with your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

AI Service runs on http://localhost:8000

#### 3. Setup Frontend (React)

```bash
cd client
cp .env.example .env
# Edit .env if needed
npm install
npm run dev
```

Frontend runs on http://localhost:5173

---

## ⚙️ Environment Setup

### Backend Environment (.env)

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clipcrafters

# JWT & Security
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
ACCESS_TOKEN_SECRET=generate_random_32_char_string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=generate_random_32_char_string
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_SALT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# FastAPI AI Service
FASTAPI_URL=http://localhost:8000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=ClipCrafters <no-reply@clipcrafters.app>

# OTP
OTP_EXPIRY_MINUTES=5
```

### AI Service Environment (.env)

```env
# Groq LLM API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_NAME=llama-3.3-70b-versatile

# Murf AI Text-to-Speech API
MURF_API_KEY=your_murf_api_key_here

# Stability.ai API
STABILITY_API_KEY=your_stability_api_key_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Embedding Model
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2

# Chunking Configuration
CHUNK_SIZE=512
CHUNK_OVERLAP=64

# Retrieval Configuration
TOP_K=10
MMR_DIVERSITY_LAMBDA=0.5

# Upload Limits
MAX_UPLOAD_SIZE_MB=50

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

### Frontend Environment (.env)

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api

# Application Settings
VITE_DEBUG=true
VITE_APP_NAME=ClipCrafters

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DARK_MODE=true
```

### Generate Secure Secrets

```bash
# Generate JWT secrets (run multiple times for different secrets)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📚 API Documentation

### Backend API Endpoints

**Base URL:** `http://localhost:5001/api`

#### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create user account | ❌ |
| POST | `/auth/login` | Login, returns JWT | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| POST | `/auth/send-otp` | Send OTP to email | ✅ |
| POST | `/auth/verify-otp` | Verify OTP code | ✅ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/reset-password` | Reset password | ❌ |

#### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/projects/create` | Create new project | ✅ |
| GET | `/projects` | List user's projects | ✅ |
| GET | `/projects/:id` | Get project details | ✅ |
| PUT | `/projects/:id` | Update project | ✅ |
| DELETE | `/projects/:id` | Delete project | ✅ |

#### Videos

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/videos/generate` | Generate video from text | ✅ |
| POST | `/videos/upload` | Upload video file | ✅ |
| GET | `/videos/:id` | Get video details | ✅ |
| DELETE | `/videos/:id` | Delete video | ✅ |
| GET | `/videos/:id/download` | Download video | ✅ |

### FastAPI Endpoints

**Base URL:** `http://localhost:8000`

#### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-document` | Upload PDF/DOCX/PPTX/TXT |
| POST | `/build-index/{doc_id}` | Build FAISS index |
| POST | `/generate-script/{doc_id}` | Generate video script |
| GET | `/document/{doc_id}/script` | Fetch generated script |
| GET | `/document/{doc_id}/status` | Check document status |
| POST | `/search/{doc_id}` | Similarity search |
| DELETE | `/document/{doc_id}` | Delete document |

#### Video Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-voiceover` | Generate TTS audio |
| POST | `/generate-visuals` | Generate AI images/videos |
| POST | `/render-video` | Assemble final video |

### Interactive Documentation

- Backend Swagger UI: http://localhost:5001/api/docs
- FastAPI Swagger UI: http://localhost:8000/docs
- FastAPI ReDoc: http://localhost:8000/redoc

---

## ✨ Features

### 🎨 UI/UX Features

- **Custom Cursor** - Animated cursor with particle trails and glow effects
- **Snowfall Effects** - Customizable snowfall with toggle button
- **3D CSS Effects** - Depth layers, floating animations, and perspective transforms
- **Page Transitions** - Smooth slow-motion transitions between pages
- **Hover Effects** - Zoom, glow, border animations, and 3D lift effects
- **Modern Theme** - Indigo/purple gradient color scheme with light/dark modes
- **Glass Morphism** - Frosted glass cards with backdrop blur
- **Responsive Design** - Mobile-first approach with full responsive support
- **Performance Optimized** - React.memo, useCallback, useMemo, and RAF optimization

### 📄 Document Processing (RAG Pipeline)

1. **Upload** - Support for PDF, DOCX, PPTX, TXT files
2. **Parse** - Extract text with metadata (pages, headings)
3. **Chunk** - Intelligent section-aware chunking with overlap
4. **Embed** - Generate 384-dim vectors using SentenceTransformers
5. **Index** - Store in FAISS IndexFlatIP for fast retrieval
6. **Retrieve** - Top-k + MMR for diverse, relevant chunks

### ✍️ Script Generation

- **RAG-powered context** - Retrieve relevant document chunks
- **Groq LLM** - Generate structured educational scripts
- **Customizable parameters** - Tone, audience, duration, style
- **JSON output** - Structured sections with visual cues
- **Token safety** - Automatic context truncation

### 🎬 Video Creation

- **Scene-based composition** - Granular control over video structure
- **AI voiceover** - Murf AI TTS with natural-sounding voices
- **Visual generation** - Stability.ai for images/videos
- **Automated assembly** - MoviePy for video stitching
- **Cloud delivery** - Cloudinary CDN hosting

### 🔐 Security

- **JWT authentication** - Stateless token-based auth
- **Password hashing** - Bcrypt with 10 salt rounds
- **Rate limiting** - Prevent abuse and DDoS
- **Security headers** - Helmet middleware
- **Input validation** - Joi schemas for all requests
- **CORS protection** - Configurable allowed origins

---

## 🔄 Development Workflow

### Hot Reload

All services support hot reload during development:
- **Frontend**: Vite HMR (instant updates)
- **Backend**: Nodemon (auto-restart on changes)
- **AI Service**: Uvicorn --reload (auto-restart)

### Code Quality

```bash
# Frontend linting
cd client && npm run lint

# Backend linting
cd server && npm run lint

# Python linting
cd fastapi && flake8 app/
```

### Testing

```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test

# AI Service tests
cd fastapi && pytest
```

---

## 🚢 Deployment

### Production Build

#### Frontend
```bash
cd client
npm run build
# Deploy ./dist to Netlify, Vercel, or any static host
```

#### Backend
```bash
cd server
npm run build
npm start
# Deploy to Heroku, Railway, or any Node.js host
```

#### AI Service
```bash
cd fastapi
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Deploy to Railway, Render, or any Python host
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Set these in your hosting platform:
- All variables from `.env.example` files
- Use secrets management for sensitive keys
- Enable HTTPS in production
- Configure proper CORS origins

---

## 🤝 Contributing

We welcome contributions! Please see individual service READMEs for detailed guidelines:

- [Frontend Contributing](./client/README.md#contributing)
- [Backend Contributing](./server/README.md#contributing)
- [AI Service Contributing](./fastapi/README.md)

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow existing code style
- Write tests for new features
- Update documentation
- Use conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** - Fast LLM inference
- **Murf AI** - High-quality text-to-speech
- **Stability.ai** - Image generation
- **Google Gemini** - AI capabilities
- **Cloudinary** - Media management
- **MongoDB Atlas** - Database hosting
- **Resend** - Email delivery

---

## 📞 Support

For support, email support@clipcrafters.com or join our Discord community.

---

<div align="center">

**Built with ❤️ by the ClipCrafters Team**

[Website](https://clipcrafters.com) · [Documentation](https://docs.clipcrafters.com) · [Blog](https://blog.clipcrafters.com)

</div>
