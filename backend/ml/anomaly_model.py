# Simple explainable anomaly detector for the starter project.
# Replace with IsolationForest after collecting more personal history.
LIMITS = {
    "Food": 3000, "Groceries": 5000, "Transport": 3000,
    "Shopping": 6000, "Entertainment": 3000, "Bills": 10000,
    "Housing": 15000, "Health": 5000, "Education": 10000, "Other": 5000
}
def is_anomaly(amount, category):
    return float(amount) > LIMITS.get(category, 5000)
