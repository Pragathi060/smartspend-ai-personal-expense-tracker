from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from pathlib import Path

from ml.category_model import predict_category
from ml.anomaly_model import is_anomaly


# --------------------------------------------------
# APP CONFIGURATION
# --------------------------------------------------

BASE = Path(__file__).resolve().parent
UPLOADS = BASE / "uploads"

UPLOADS.mkdir(exist_ok=True)

app = Flask(
    __name__,
    static_folder="../frontend/dist",
    static_url_path="/"
)

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{BASE / 'smartspend.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

CORS(app)


# --------------------------------------------------
# EXPENSE MODEL
# --------------------------------------------------

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    amount = db.Column(db.Float, nullable=False)

    category = db.Column(db.String(50), nullable=False)

    description = db.Column(db.String(255), default="")

    merchant = db.Column(db.String(120), default="")

    payment_method = db.Column(
        db.String(50),
        default="UPI"
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# --------------------------------------------------
# BUDGET MODEL
# --------------------------------------------------

class Budget(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    amount = db.Column(
        db.Float,
        nullable=False,
        default=20000
    )


# --------------------------------------------------
# CREATE DATABASE TABLES
# --------------------------------------------------

with app.app_context():
    db.create_all()


# --------------------------------------------------
# GET ALL EXPENSES
# --------------------------------------------------

@app.get("/api/expenses")
def get_expenses():

    rows = Expense.query.order_by(
        Expense.date.desc(),
        Expense.id.desc()
    ).all()

    return jsonify([
        {
            "id": x.id,
            "amount": x.amount,
            "category": x.category,
            "description": x.description,
            "merchant": x.merchant,
            "payment_method": x.payment_method,
            "date": x.date.isoformat(),
            "anomaly": is_anomaly(
                x.amount,
                x.category
            )
        }
        for x in rows
    ])


# --------------------------------------------------
# ADD EXPENSE
# --------------------------------------------------

@app.post("/api/expenses")
def add_expense():

    data = request.get_json(force=True)

    description = data.get(
        "description",
        ""
    )

    # If category is not provided,
    # AI predicts the category.
    category = (
        data.get("category")
        or predict_category(description)
    )

    expense = Expense(

        amount=float(
            data["amount"]
        ),

        category=category,

        description=description,

        merchant=data.get(
            "merchant",
            ""
        ),

        payment_method=data.get(
            "payment_method",
            "UPI"
        ),

        date=datetime.strptime(
            data.get("date"),
            "%Y-%m-%d"
        ).date()
    )

    db.session.add(expense)

    db.session.commit()

    return jsonify({
        "message": "Expense added",
        "id": expense.id,
        "category": category
    }), 201


# --------------------------------------------------
# DELETE EXPENSE
# --------------------------------------------------

@app.delete("/api/expenses/<int:expense_id>")
def delete_expense(expense_id):

    expense = db.get_or_404(
        Expense,
        expense_id
    )

    db.session.delete(expense)

    db.session.commit()

    return jsonify({
        "message": "Deleted"
    })


# --------------------------------------------------
# GET BUDGET
# --------------------------------------------------

@app.get("/api/budget")
def get_budget():

    budget = Budget.query.first()

    # Create default budget if none exists
    if not budget:

        budget = Budget(
            amount=20000
        )

        db.session.add(budget)

        db.session.commit()

    return jsonify({
        "amount": budget.amount
    })


# --------------------------------------------------
# UPDATE BUDGET
# --------------------------------------------------

@app.put("/api/budget")
def update_budget():

    data = request.get_json(force=True)

    amount = float(
        data["amount"]
    )

    # Budget cannot be zero or negative
    if amount <= 0:

        return jsonify({
            "message": "Budget must be greater than 0"
        }), 400

    budget = Budget.query.first()

    # Create budget if it doesn't exist
    if not budget:

        budget = Budget(
            amount=amount
        )

        db.session.add(budget)

    else:

        budget.amount = amount

    db.session.commit()

    return jsonify({
        "message": "Budget updated",
        "amount": budget.amount
    })


# --------------------------------------------------
# ANALYTICS
# --------------------------------------------------

@app.get("/api/analytics")
def analytics():

    rows = Expense.query.all()

    # Calculate total spending
    total = sum(
        x.amount
        for x in rows
    )

    # Category-wise spending
    categories = {}

    # Month-wise spending
    monthly = {}

    for x in rows:

        # Category totals
        categories[x.category] = (
            categories.get(
                x.category,
                0
            )
            + x.amount
        )

        # Monthly totals
        key = x.date.strftime(
            "%Y-%m"
        )

        monthly[key] = (
            monthly.get(
                key,
                0
            )
            + x.amount
        )

    # Find highest spending category
    top = (
        max(
            categories,
            key=categories.get
        )
        if categories
        else "None"
    )

    # --------------------------------------------------
    # GET SAVED BUDGET
    # --------------------------------------------------

    budget_record = Budget.query.first()

    # Create default budget if needed
    if not budget_record:

        budget_record = Budget(
            amount=20000
        )

        db.session.add(
            budget_record
        )

        db.session.commit()

    budget = budget_record.amount

    # Calculate remaining budget
    remaining = budget - total

    # Calculate savings
    savings = max(
        0,
        remaining
    )

    return jsonify({

        "total": round(
            total,
            2
        ),

        "budget": round(
            budget,
            2
        ),

        "remaining": round(
            remaining,
            2
        ),

        "categories": categories,

        "monthly": monthly,

        "top_category": top,

        "savings": round(
            savings,
            2
        )
    })


# --------------------------------------------------
# FRONTEND
# --------------------------------------------------

@app.get("/")
def frontend():

    dist = (
        BASE.parent
        / "frontend"
        / "dist"
    )

    if (
        dist / "index.html"
    ).exists():

        return send_from_directory(
            dist,
            "index.html"
        )

    return jsonify({
        "message": "Backend running. Start the React frontend with npm run dev."
    })


# --------------------------------------------------
# RUN SERVER
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )
