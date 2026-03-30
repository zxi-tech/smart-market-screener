import pandas as pd
import os
import glob
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '../../data/processed'))
MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, '../../models'))
os.makedirs(MODEL_DIR, exist_ok=True)

print("=== Phase 3: Advanced Machine Learning Training ===")

# 1. Load ALL processed stock data (Not just a single ticker)
# This allows the AI to learn from various stock characteristics, making it smarter.
all_files = glob.glob(os.path.join(DATA_DIR, "*_features.csv"))
df_list = []

for file in all_files:
    df = pd.read_csv(file)
    df_list.append(df)

master_df = pd.concat(df_list, ignore_index=True)
master_df.dropna(inplace=True)

print(f"[*] Total combined data for training: {len(master_df)} trading days.")

# 2. Define Features (Input) and Target (Output)
# Drop columns that are not predictive AI features (like Date and Raw Prices).
# The AI will purely use Volume, MA, RSI, MACD, and Bollinger Bands.
drop_columns = ['Date', 'Target_Next_Day', 'Open', 'High', 'Low', 'Close']
features = [col for col in master_df.columns if col not in drop_columns]

print(f"[*] Technical indicators used: {', '.join(features)}")

X = master_df[features]
y = master_df['Target_Next_Day']

# 3. Time-Series Split (80% Train, 20% Test)
split_idx = int(len(master_df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

# 4. Initialize and Train the New Model (Stronger & Deeper)
print("\n[*] Training Random Forest Model...")
model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
model.fit(X_train, y_train)

# 5. Performance Evaluation
y_pred = model.predict(X_test)
print("\n=== AI Evaluation Results ===")
print(f"Global Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# 6. Save Model for Flask API consumption
model_path = os.path.join(MODEL_DIR, 'trend_predictor_rf.pkl')
joblib.dump(model, model_path)
print(f"\n[v] Advanced model successfully saved and overwrote the old model at: {model_path}")