# 🚀 ClipCrafters - Installation Requirements & Setup Guide

## 📋 System Requirements

### Minimum Hardware
- **CPU**: 4 cores or higher
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Required Software

#### 1. Node.js & npm
- **Version**: Node.js 18 LTS or higher
- **Download**: https://nodejs.org
- **Verify Installation**:
  ```cmd
  node --version
  npm --version
  ```

#### 2. Python
- **Version**: Python 3.9 or higher (3.10+ recommended)
- **Download**: https://python.org
- **Important**: Add Python to PATH during installation
- **Verify Installation**:
  ```cmd
  python --version
  pip --version
  ```

#### 3. Git
- **Version**: 2.x or higher
- **Download**: https://git-scm.com
- **Verify Installation**:
  ```cmd
  git --version
  ```

#### 4. MongoDB (Cloud - Recommended)
- **Option A**: MongoDB Atlas (Free tier available)
  - Create account at: https://mongodb.com/atlas
  - Create a cluster and get connection string
- **Option B**: Local MongoDB installation
  - Download from: https://mongodb.com/try/download/community
  - Windows: Run installer and add to PATH
  - Verify: `mongod --version`

#### 5. FFmpeg (Required for Video Processing)
- **Download**: https://ffmpeg.org/download.html
- **Windows**: 
  - Download from https://www.gyan.dev/ffmpeg/builds/
  - Extract and add bin folder to PATH
- **Linux**: `sudo apt install ffmpeg`
- **macOS**: `brew install ffmpeg`
- **Verify Installation**:
  ```cmd
  ffmpeg -version
  ```

---

## 🔑 Required API Keys & Services

### Essential Services (Required)

#### 1. **MongoDB Atlas** (Database)
- **Sign up**: https://mongodb.com/atlas
- **Free tier**: Available
- **What you need**: Connection URI
- **Format**: `mongodb+srv://<username>:<password>@cluster.mongodb.net/clipcrafters`

#### 2. **Groq API** (AI/LLM for Script Generation)
- **Sign up**: https://console.groq.com
- **Free tier**: Available with rate limits
- **What you need**: API Key
- **Get key**: https://console.groq.com/keys
- **Cost**: Free tier with generous limits

#### 3. **Cloudinary** (Media Storage & CDN)
- **Sign up**: https://cloudinary.com
- **Free tier**: 25GB storage, 25GB bandwidth/month
- **What you need**: Cloud Name, API Key, API Secret
- **Dashboard**: https://cloudinary.com/console

#### 4. **Resend** (Email Service)
- **Sign up**: https://resend.com
- **Free tier**: 3,000 emails/month
- **What you need**: API Key
- **Dashboard**: https://resend.com/api-keys

### Optional Services (Enhanced Features)

#### 5. **Murf AI** (Premium Text-to-Speech)
- **Sign up**: https://murf.ai
- **Alternative**: Edge TTS (free, built-in fallback)
- **Cost**: Paid service
- **Note**: If not configured, system uses Edge TTS

#### 6. **Stability.ai** (AI Image Generation)
- **Sign up**: https://platform.stability.ai
- **Alternative**: Pollinations.ai (free, no key required)
- **What you need**: API Key
- **Get key**: https://platform.stability.ai/account/keys
- **Cost**: Pay-per-use

#### 7. **Google Gemini** (Additional AI Features)
- **Sign up**: https://makersuite.google.com
- **What you need**: API Key
- **Get key**: https://makersuite.google.com/app/apikey
- **Cost**: Free tier available

#### 8. **Twilio** (SMS for OTP - Optional)
- **Sign up**: https://twilio.com
- **Free trial**: Available
- **What you need**: Account SID, Auth Token, Phone Number

---

## 📦 Project Dependencies

### Frontend (React + Vite)
```json
{
  "axios": "^1.13.6",
  "chart.js": "^4.5.1",
  "framer-motion": "^12.35.0",
  "lucide-react": "^0.577.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1",
  "react-snowfall": "^2.4.0",
  "tailwindcss": "^3.4.1"
}
```

### Backend (Node.js + Express)
```json
{
  "axios": "^1.6.8",
  "bcrypt": "^6.0.0",
  "cloudinary": "^2.9.0",
  "cors": "^2.8.5",
  "express": "^4.18.3",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.2.2",
  "resend": "^6.9.3",
  "multer": "^1.4.5-lts.1"
}
```

### AI Service (Python + FastAPI)
```text
fastapi==0.115.6
uvicorn==0.34.0
PyMuPDF==1.25.3
python-docx==1.1.2
faiss-cpu>=1.12.0
sentence-transformers==3.3.1
groq>=0.30.0
edge-tts>=6.1.12
moviepy>=1.0.3
Pillow>=10.0.0
```

---

## ⚙️ Step-by-Step Installation

### Step 1: Clone the Repository
```cmd
git clone https://github.com/your-org/ClipCrafters.git
cd ClipCrafters
```

### Step 2: Setup Backend (Node.js Server)

1. Navigate to server directory:
   ```cmd
   cd server
   ```

2. Install dependencies:
   ```cmd
   npm install
   ```

3. Create environment file:
   ```cmd
   copy .env.example .env
   ```

4. Edit `.env` file with your credentials:
   ```env
   PORT=5001
   NODE_ENV=development
   
   # MongoDB Atlas connection string
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/clipcrafters
   
   # JWT secrets (generate random strings)
   JWT_SECRET=your_random_secret_key_min_32_chars
   ACCESS_TOKEN_SECRET=generate_random_32_char_string
   REFRESH_TOKEN_SECRET=generate_random_32_char_string
   
   # Cloudinary credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Resend email API
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=ClipCrafters <no-reply@yourdomain.com>
   
   # FastAPI URL
   FASTAPI_URL=http://localhost:8000
   
   # CORS
   CORS_ORIGIN=http://localhost:5173
   ```

5. Generate secure JWT secrets:
   ```cmd
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Run this 3 times for JWT_SECRET, ACCESS_TOKEN_SECRET, and REFRESH_TOKEN_SECRET

6. Start the backend:
   ```cmd
   npm run dev
   ```
   Server should run on: http://localhost:5001

### Step 3: Setup AI Service (Python FastAPI)

1. Navigate to fastapi directory:
   ```cmd
   cd ..\fastapi
   ```

2. Create Python virtual environment:
   ```cmd
   python -m venv venv
   ```

3. Activate virtual environment:
   - **Windows CMD**:
     ```cmd
     venv\Scripts\activate
     ```
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux/Mac**:
     ```bash
     source venv/bin/activate
     ```

4. Install Python dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

5. Create environment file:
   ```cmd
   copy .env.sample .env
   ```

6. Edit `.env` file:
   ```env
   # Required
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL_NAME=llama-3.3-70b-versatile
   
   # Optional (can leave as-is for testing)
   STABILITY_API_KEY=your_stability_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   MURF_API_KEY=your_murf_api_key_here
   
   # Embedding model (no API key needed)
   EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
   
   # Server config
   HOST=0.0.0.0
   PORT=8000
   LOG_LEVEL=INFO
   
   # FFmpeg (leave empty for auto-detect)
   FFMPEG_PATH=
   USE_MOCK_PROCESSOR=false
   ```

7. Start the AI service:
   ```cmd
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   AI Service should run on: http://localhost:8000

### Step 4: Setup Frontend (React)

1. Open a new terminal and navigate to client directory:
   ```cmd
   cd client
   ```

2. Install dependencies:
   ```cmd
   npm install
   ```

3. Create environment file:
   ```cmd
   copy .env.example .env
   ```

4. Edit `.env` file:
   ```env
   VITE_API_URL=http://localhost:5001/api
   VITE_FASTAPI_URL=http://localhost:8000
   VITE_DEBUG=true
   VITE_APP_NAME=ClipCrafters
   VITE_ENABLE_DARK_MODE=true
   ```

5. Start the frontend:
   ```cmd
   npm run dev
   ```
   Frontend should run on: http://localhost:5173

---

## ✅ Verification Checklist

After completing setup, verify everything is working:

- [ ] Backend running at http://localhost:5001
- [ ] AI Service running at http://localhost:8000
- [ ] Frontend running at http://localhost:5173
- [ ] MongoDB connection successful (check backend logs)
- [ ] FFmpeg installed and in PATH
- [ ] All API keys configured
- [ ] Can access FastAPI docs at http://localhost:8000/docs
- [ ] Can access backend API docs at http://localhost:5001/api/docs

### Test API Endpoints

1. **Test Backend Health**:
   ```cmd
   curl http://localhost:5001/api/health
   ```

2. **Test AI Service Health**:
   ```cmd
   curl http://localhost:8000/health
   ```

3. **Open Frontend**:
   Navigate to http://localhost:5173 in your browser

---

## 🐛 Common Issues & Solutions

### Issue 1: Python Module Not Found
**Solution**: Make sure virtual environment is activated
```cmd
cd fastapi
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue 2: MongoDB Connection Failed
**Solution**: Check your MongoDB URI in server/.env
- Ensure username/password are correct
- Ensure IP is whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for development)

### Issue 3: FFmpeg Not Found
**Solution**: 
- Download FFmpeg from https://ffmpeg.org
- Add to system PATH
- Or set FFMPEG_PATH in fastapi/.env

### Issue 4: Port Already in Use
**Solution**: Change ports in .env files or kill existing processes
```cmd
# Windows - kill process on port 5001
netstat -ano | findstr :5001
taskkill /PID <process_id> /F
```

### Issue 5: npm Install Fails
**Solution**: Clear npm cache and retry
```cmd
npm cache clean --force
npm install
```

### Issue 6: CORS Errors
**Solution**: Check CORS_ORIGIN in server/.env matches frontend URL
```env
CORS_ORIGIN=http://localhost:5173
```

---

## 🎯 Quick Start Commands

Once everything is set up, you can start all services:

**Terminal 1 - Backend**:
```cmd
cd server
npm run dev
```

**Terminal 2 - AI Service**:
```cmd
cd fastapi
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend**:
```cmd
cd client
npm run dev
```

---

## 📚 Additional Resources

- **Frontend Documentation**: See `client/README.md`
- **Backend Documentation**: See `server/README.md`
- **API Documentation**: 
  - Backend: http://localhost:5001/api/docs
  - FastAPI: http://localhost:8000/docs
- **Main README**: See root `README.md`

---

## 🔐 Security Notes

### For Development:
- Use `.env` files (already in .gitignore)
- Never commit API keys to Git
- Use test accounts for third-party services

### For Production:
- Use environment variables or secrets management
- Enable HTTPS
- Set NODE_ENV=production
- Use strong JWT secrets (32+ characters)
- Configure proper CORS origins
- Enable rate limiting
- Use MongoDB Atlas IP whitelist

---

## 💡 Tips

1. **Start Backend First**: Backend must be running before frontend
2. **Check Logs**: Monitor terminal outputs for errors
3. **API Documentation**: Use FastAPI docs (http://localhost:8000/docs) to test endpoints
4. **Free Alternatives**: System works with free tiers of all required services
5. **Optional APIs**: Murf AI, Stability.ai, and Gemini are optional - system has fallbacks

---

## 📞 Need Help?

If you encounter issues:
1. Check logs in terminal windows
2. Verify all environment variables are set
3. Ensure all services are running
4. Check firewall/antivirus isn't blocking ports
5. Refer to individual service READMEs for detailed troubleshooting

---

**You're all set! 🎉 Start building amazing AI-powered videos with ClipCrafters!**
