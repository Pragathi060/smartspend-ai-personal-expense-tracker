from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from pathlib import Path
from ml.category_model import predict_category
from ml.anomaly_model import is_anomaly

BASE = Path(__file__).resolve().parent
UPLOADS = BASE / "uploads"
UPLOADS.mkdir(exist_ok=True)

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{BASE/'smartspend.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
CORS(app)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), default="")
    merchant = db.Column(db.String(120), default="")
    payment_method = db.Column(db.String(50), default="UPI")
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.get("/api/expenses")
def get_expenses():
    rows = Expense.query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return jsonify([{
        "id": x.id, "amount": x.amount, "category": x.category,
        "description": x.description, "merchant": x.merchant,
        "payment_method": x.payment_method, "date": x.date.isoformat(),
        "anomaly": is_anomaly(x.amount, x.category)
    } for x in rows])

@app.post("/api/expenses")
def add_expense():
    data = request.get_json(force=True)
    description = data.get("description", "")
    category = data.get("category") or predict_category(description)
    expense = Expense(
        amount=float(data["amount"]),
        category=category,
        description=description,
        merchant=data.get("merchant", ""),
        payment_method=data.get("payment_method", "UPI"),
        date=datetime.strptime(data.get("date"), "%Y-%m-%d").date()
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({"message":"Expense added", "id": expense.id, "category": category}), 201

@app.delete("/api/expenses/<int:expense_id>")
def delete_expense(expense_id):
    expense = db.get_or_404(Expense, expense_id)
    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message":"Deleted"})

@app.get("/api/analytics")
def analytics():
    rows = Expense.query.all()
    total = sum(x.amount for x in rows)
    categories = {}
    monthly = {}
    for x in rows:
        categories[x.category] = categories.get(x.category, 0) + x.amount
        key = x.date.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + x.amount
    top = max(categories, key=categories.get) if categories else "None"
    budget = 20000
    return jsonify({
        "total": round(total,2),
        "budget": budget,
        "remaining": round(budget-total,2),
        "categories": categories,
        "monthly": monthly,
        "top_category": top,
        "savings": round(max(0, budget-total),2)
    })

@app.get("/")
def frontend():
    dist = BASE.parent / "frontend" / "dist"
    if (dist/"index.html").exists():
        return send_from_directory(dist, "index.html")
    return jsonify({"message":"Backend running. Start the React frontend with npm run dev."})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
