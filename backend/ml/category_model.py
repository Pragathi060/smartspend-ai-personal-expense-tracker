from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

TRAINING = [
    ("pizza restaurant lunch food", "Food"),
    ("burger biryani cafe coffee dinner", "Food"),
    ("grocery vegetables fruits supermarket", "Groceries"),
    ("milk rice flour dmarts grocery", "Groceries"),
    ("uber ola auto bus metro fuel petrol", "Transport"),
    ("shoes shirt dress shopping mall", "Shopping"),
    ("amazon clothes electronics purchase", "Shopping"),
    ("netflix movie cinema game entertainment", "Entertainment"),
    ("electricity water internet phone bill", "Bills"),
    ("rent apartment house maintenance", "Housing"),
    ("medicine pharmacy doctor", "Health"),
    ("course book tuition education", "Education"),
]
texts, labels = zip(*TRAINING)
vectorizer = TfidfVectorizer(ngram_range=(1,2))
X = vectorizer.fit_transform(texts)
model = LogisticRegression(max_iter=1000).fit(X, labels)

def predict_category(text: str) -> str:
    if not text.strip():
        return "Other"
    return model.predict(vectorizer.transform([text]))[0]
