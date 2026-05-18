# 🏥 Medico AI - AI-Powered Medical Image Analysis

Medico AI is a **fully functional** medical imaging assistant that combines YOLO-based disease detection, AI-generated medical reports, and an intelligent chatbot. Deploy it locally, on your server, or on Vercel with zero hassle.

## ✨ Features

- **🔍 Disease Detection**: Upload medical images and detect conditions using YOLO models (Tuberculosis, Eye Disease, Bone Fracture)
- **📋 AI-Powered Reports**: Automatic medical report generation using Google Gemini
- **💬 Intelligent Chatbot**: Ask medical questions and get answers from Gemini
- **👤 Patient Tracking**: Record patient name and ID through the entire workflow
- **🎨 Beautiful UI**: Responsive design with Tailwind CSS
- **⚡ Multiple Entry Points**: Streamlit web app, Django REST API, and React frontend

## 📁 Project Structure

```
medico-ai/
├── main.py                  # Streamlit web app (fully functional)
├── backend/                 # Django REST API
│   ├── manage.py           # Django entry point
│   ├── medicoai/           # Settings & WSGI/ASGI
│   └── core/               # API views & utilities
├── frontend/               # React + Vite (production-ready for Vercel)
│   ├── src/               # React components
│   ├── package.json       # Npm dependencies
│   └── vite.config.js     # Vite configuration
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment config
└── .env.example           # Environment template
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### Setup

1. **Clone and enter the repository:**
   ```bash
   git clone https://github.com/MitulNayakwadi/Medico-AI.git
   cd Medico-AI
   ```

2. **Create a Python virtual environment:**
   ```bash
   python -m venv .venv311
   .\.venv311\Scripts\activate  # On Windows
   # source .venv311/bin/activate  # On macOS/Linux
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file for Gemini API:**
   ```bash
   echo GEMINI_API_KEY=your_api_key_here > .env
   ```

## 🎯 Run Locally

### Option 1: Streamlit App (Recommended for Quick Demo)

The Streamlit app is the **fastest way to see everything working**:

```bash
streamlit run main.py
```

Then open your browser to **http://localhost:8501**

**What you can do:**
- 📤 Upload medical images
- 🔍 Select from 3 disease detection models
- 📊 View AI-detected conditions and confidence scores
- 📋 Generate detailed medical reports
- 💬 Chat with the AI assistant

---

### Option 2: Django Backend API

Run the backend API for programmatic access or to power the React frontend:

```bash
python backend/manage.py migrate
python backend/manage.py runserver
```

API endpoints:
- `POST http://localhost:8000/api/analyze/` - Upload image and detect disease
- `POST http://localhost:8000/api/chatbot/` - Chat with AI assistant
- `GET http://localhost:8000/admin/` - Django admin panel

---

### Option 3: React Frontend (Local Development)

Run the modern React UI with Vite:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000**

This connects to the backend at `http://localhost:8000` (you need to run the backend in another terminal).

## 📦 Available Models

The app includes three pre-trained YOLO models:

1. **Tuberculosis (Lung Cancer)** - Detects lung diseases
2. **Eye Disease** - Identifies eye conditions
3. **Bone Fracture** - Detects skeletal injuries

Model files are included:
- `tuberculosis(lung_cancer).pt`
- `eye_disease.pt`
- `bone_fracture.pt`

## 🌐 Deployment

### Architecture

- **Frontend:** Lightweight React + Vite app → **Vercel** (sends image uploads to backend API)
- **Backend:** Django REST API + YOLO models → **Heroku/Railway/DigitalOcean** 
- **Models:** Stored on backend server (not deployed with frontend)

This separation keeps the frontend bundle small (<5 MB) for fast Vercel deployment.

### Deploy Frontend to Vercel

The React frontend is production-ready and can be deployed to Vercel in minutes:

1. **Ensure your code is pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Go to [Vercel.com](https://vercel.com) and sign in with GitHub**

3. **Click "New Project" and select `Medico-AI` repository**

4. **Configure the build:**
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Root Directory: `.` (default)

5. **Add Environment Variables in Vercel Dashboard:**
   ```
   VITE_BACKEND_URL=https://your-backend-url.com
   ```

6. **Click "Deploy"** and Vercel will handle the rest!

Your site will be live at a URL like `https://medico-ai.vercel.app`

### Deploy Backend to Heroku/Railway/DigitalOcean

The Django backend can be deployed to any Python-hosting service:

**For Heroku:**
```bash
heroku login
heroku create medico-ai-backend
git push heroku main
heroku config:set GEMINI_API_KEY=your_key_here
```

**For Railway:**
```bash
railway login
railway init
railway up
```

After deployment, update the `VITE_BACKEND_URL` in Vercel with your backend URL.

### Full Stack Deployment

1. Deploy backend first (Heroku/Railway/DigitalOcean)
2. Get backend URL
3. Deploy frontend to Vercel with `VITE_BACKEND_URL` env var
4. Frontend will automatically connect to your backend

## ⚙️ Environment Variables

## ⚙️ Environment Variables

### Required (for Gemini reports & chatbot)

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Get your key at: [Google AI Studio](https://aistudio.google.com/app/apikey)

### Frontend Variables (Optional)

Create `frontend/.env.local` for local development:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_API_ENDPOINT=/api
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase configs
```

## 🛠️ Development

### Project Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Django 5.2 + Django REST Framework
- **ML Models:** YOLO (Ultralytics) + PyTorch
- **Reports:** Google Gemini API
- **Hosting:** Vercel (Frontend) + Heroku/Railway (Backend)

### Useful Commands

```bash
# Streamlit
streamlit run main.py

# Backend
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Frontend development
cd frontend
npm run dev
npm run build
npm run preview

# Run linting
cd frontend
npm run lint
```

## 📝 API Documentation

### Analyze Endpoint

**POST** `/api/analyze/`

```json
{
  "image": <file>,
  "model": "Tuberculosis (Lung Cancer)",
  "patient_name": "John Doe",
  "patient_id": "P123"
}
```

**Response:**
```json
{
  "detected_disease": "Tuberculosis (92.5%)",
  "medical_report": "Detailed medical report generated by Gemini..."
}
```

### Chatbot Endpoint

**POST** `/api/chatbot/`

```json
{
  "query": "What are symptoms of tuberculosis?"
}
```

**Response:**
```json
{
  "response": "Tuberculosis symptoms include..."
}
```

## 🐛 Troubleshooting

**Issue:** "Module not found: django"
- **Solution:** Activate venv: `.\.venv311\Scripts\activate` (Windows) or `source .venv311/bin/activate` (macOS/Linux)

**Issue:** "GEMINI_API_KEY is missing"
- **Solution:** Create `.env` file with `GEMINI_API_KEY=your_key_here`

**Issue:** Frontend can't connect to backend
- **Solution:** Check `VITE_BACKEND_URL` in Vercel env vars or `.env.local`

**Issue:** Model file not found
- **Solution:** Ensure `.pt` files are in repository root and matches the model name

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you encounter any issues, please open a GitHub issue or reach out to the maintainers.