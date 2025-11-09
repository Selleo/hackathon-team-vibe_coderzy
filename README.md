# ViaMent - AI-Powered Learning Platform

Full-stack educational application for learning programming with an AI mentor.

## 🚀 Quick Start with Docker

The easiest way to run the application:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-your-key-here

# 3. Start the application
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

📖 **Full Docker documentation**: See [DOCKER.md](./DOCKER.md)

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- Python 3.10+
- pnpm (for frontend)

### Frontend (Next.js)

```bash
cd frontend
pnpm install
pnpm dev
```

Available scripts:
- `pnpm dev` - Development server with Turbopack
- `pnpm build` - Production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Backend (FastAPI)

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

The backend will be available at http://127.0.0.1:8000

## 📁 Project Structure

```
.
├── frontend/          # Next.js application
│   ├── src/app/       # App router pages and components
│   ├── public/        # Static assets
│   └── Dockerfile     # Frontend container config
├── backend/           # FastAPI application
│   ├── app/           # Application code
│   │   ├── main.py    # FastAPI entry point
│   │   └── api/       # API routes
│   └── Dockerfile     # Backend container config
├── docker-compose.yml # Docker orchestration
├── DOCKER.md          # Docker deployment guide
└── GEMINI.md          # Development conventions
```

## 🎯 Features

- **Personalized Learning Paths**: AI-generated roadmaps based on user profile
- **Interactive Lessons**: Text, quizzes, coding exercises
- **AI Mentor**: Multiple modes (guide, examiner, explainer, quiz generator)
- **Gamification**: XP points, streaks, lives system
- **Progress Tracking**: Local storage persistence

## 🔧 Technology Stack

### Frontend
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS 4
- OpenAI API integration

### Backend
- FastAPI
- Python 3.11
- Uvicorn

## 📝 Development Conventions

- **Frontend**: ESLint for linting
- **Backend**: Ruff for linting (line length: 100)

## 🐳 Deployment

See [DOCKER.md](./DOCKER.md) for comprehensive deployment instructions including:
- Docker Compose setup
- Cloud platform deployment (AWS, GCP, Heroku)
- Production best practices
- Troubleshooting guide

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 👥 Team

Built by **Team Coderzy** for the Selleo Hackathon.

## 🛠️ Alternative: Using Makefile

If you prefer Makefile commands:

```bash
make up          # Start containers
make logs        # View logs
make down        # Stop containers
make restart     # Restart containers
make status      # Show status
make help        # Show all commands
```

## ☁️ Cloudflare Tunnel Deployment

For production deployment using Cloudflare Tunnel (viament.alwood.dev):

```bash
# 1. Configure for production
cp .env.production.example .env
# Edit .env with your OPENAI_API_KEY

# 2. Start containers
docker-compose up -d

# 3. Point Cloudflare Tunnel to localhost:3000
cloudflared tunnel --url http://localhost:3000
```

📖 **Full Cloudflare Tunnel guide**: See [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md)

**Key Points:**
- Only expose port 3000 (frontend) through Cloudflare Tunnel
- Backend (port 8000) communicates internally via Docker network
- CORS automatically configured for viament.alwood.dev
- SSL/TLS handled by Cloudflare

