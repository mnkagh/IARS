import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

from scoring import DIM_NAMES, WEIGHTS

RNG = np.random.default_rng(42)
N = 4000
X = RNG.uniform(0, 100, size=(N, len(DIM_NAMES)))
X[:, 0] = np.clip(X[:, 0] + 0.3 * X[:, 6], 0, 100)
X[:, 1] = np.clip(X[:, 1] + 0.2 * X[:, 7], 0, 100)
scores = X @ WEIGHTS
y = np.where(scores < 25, "NOT_READY",
      np.where(scores < 50, "EMERGING",
        np.where(scores < 75, "MODERATE", "MATURE")))

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, class_weight="balanced")
clf.fit(Xtr, ytr)
print(classification_report(yte, clf.predict(Xte)))
os.makedirs("models", exist_ok=True)
joblib.dump({"model": clf, "features": DIM_NAMES}, "models/iars_rf.joblib")
print("SAVED models/iars_rf.joblib")