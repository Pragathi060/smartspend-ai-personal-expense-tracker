# SmartSpend — AI Personal Expense Tracker

SmartSpend is a modern personal finance dashboard that combines expense tracking, machine-learning based category prediction, anomaly alerts and analytics.

## Features
- Add, delete and search expenses
- AI category prediction using TF-IDF + Logistic Regression
- Spending dashboard and charts
- Budget and remaining-balance cards
- Unusual expense alerts
- Responsive desktop/mobile UI
- SQLite database for local development

## Tech Stack
React + Vite, CSS, Recharts, Flask, SQLAlchemy, SQLite, Scikit-learn.

## Run Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Run Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL shown by Vite, normally http://localhost:5173.

## GitHub
```bash
git init
git add .
git commit -m "Initial SmartSpend project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smartspend.git
git push -u origin main
```

## Future upgrades
- JWT authentication
- PostgreSQL
- Receipt OCR with Tesseract
- Isolation Forest anomaly detection
- Spending forecasting
- AI-generated saving recommendations
- Cloud deployment
