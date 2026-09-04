# MeteroLens - Legal Metrology Compliance Checker

AI-powered system to check compliance of packaged commodities under Legal Metrology (Packaged Commodities) Rules, 2011.

## Problem Statement
**SIH 2026 - PS26034**

Software System to check compliance of Packaged Commodities by scanning products, images and labels.

## Team Members
1. M1 - Backend Lead
2. M2 - Frontend Lead
3. M3 - researcher
4. M4 - Ai &ML
5. M5 - UI/UX Designer
6. M6 - Testing & Integration

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React.js, Tailwind CSS, Recharts
- **OCR:** EasyOCR
- **Image Processing:** OpenCV, Pillow
- **Database:** PostgreSQL
- **PDF Reports:** ReportLab
- **Auth:** JWT-ready FastAPI auth patterns, bcrypt
- **Deployment:** Docker, Docker Compose

## Features
- [x] User registration & login with role-based access (Admin / Officer / Viewer)
- [x] Image upload and scanning (drag & drop)
- [x] OCR text extraction from product labels
- [x] Legal Metrology Rules validation (MRP, quantity, manufacturer, dates, consumer care, country of origin, bilingual labels, tax inclusion)
- [x] Compliance report generation (PDF download)
- [x] Dashboard for enforcement officers (stats, charts, filters)
- [x] Product scan history with pagination
- [x] Role-based access control (RBAC)

## Project Structure
```
MeteroLens/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── models.py            # User, Scan models
│   │   ├── routes/
│   │   │   ├── auth.py          # Register, login, profile
│   │   │   ├── scan.py          # Upload, OCR, validate
│   │   │   ├── dashboard.py     # Stats, charts, filters
│   │   │   └── history.py       # User scan history
│   │   └── services/
│   │       ├── ocr_service.py   # EasyOCR text extraction
│   │       ├── validation_service.py  # Compliance rules
│   │       └── report_service.py      # PDF generation
│   ├── uploads/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # Login, Register, Scan, Dashboard, History
│   │   └── utils/               # Axios API instance
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)
```bash
# Clone and configure
git clone https://github.com/Abhinav5656U/MeteroLens.git
cd MeteroLens
cp .env.example .env

# Edit .env with your settings, then:
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create PostgreSQL database
createdb meterolens

# Configure
cp ../.env.example ../.env
# Edit .env with your DATABASE_URL

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend runs at http://localhost:8000

**Frontend:**
```bash
cd frontend
npm install
npm start
```
Frontend runs at http://localhost:3000

### Create Admin User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@meterolens.in","password":"admin123","role":"admin","full_name":"System Admin"}'
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/auth/me | Yes | Current user info |
| POST | /api/scan/upload | Yes | Upload image, OCR + validate |
| GET | /api/scan/:id | Yes | Get scan details |
| GET | /api/scan/:id/report | Yes | Download PDF report |
| GET | /api/dashboard/stats | Officer/Admin | Dashboard statistics |
| GET | /api/dashboard/scans | Officer/Admin | All scans with filters |
| GET | /api/history | Yes | User scan history |
| DELETE | /api/history/:id | Yes | Delete scan |

## Compliance Rules (Legal Metrology Rules, 2011)
1. **MRP** - Maximum Retail Price must be clearly printed
2. **Net Quantity** - Must specify quantity with unit (g, kg, ml, L)
3. **Manufacturer** - Name and address required
4. **Date** - Manufacturing/packaging date must be present
5. **Consumer Care** - Contact details for consumer queries
6. **Country of Origin** - Must be declared
7. **Tax Inclusion** - MRP inclusive of all taxes statement
8. **Bilingual Labels** - Product name in Hindi/English (or local language)

## Timeline
- Week 1: Core features (OCR, validation, basic UI)
- Week 2: Dashboard, reports, testing, demo prep

## Internal Demo Date
14 sept
