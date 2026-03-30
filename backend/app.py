from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'trend_predictor_rf.pkl')
DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')

try:
    model = joblib.load(MODEL_PATH)
    print("[v] ML Model loaded successfully.")
except Exception as e:
    print(f"[x] Failed to load model. Error: {e}")
    model = None

@app.route('/api/fundamentals', methods=['GET'])
def get_fundamentals():
    """Endpoint to populate the Fundamental Screener table in the Dashboard."""
    fund_path = os.path.join(DATA_DIR, 'fundamentals.csv')
    if not os.path.exists(fund_path):
        return jsonify({"error": "Fundamental Database has not been generated."}), 404
    
    df = pd.read_csv(fund_path)
    # Convert NaN values to None to prevent JSON formatting errors
    df = df.where(pd.notnull(df), None)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """Centralized endpoint for Candlestick Chart, Indicators, and AI Predictions."""
    file_path = os.path.join(DATA_DIR, f"{ticker}_features.csv")
    if not os.path.exists(file_path):
        return jsonify({"error": f"Feature data for {ticker} not found."}), 404

    df = pd.read_csv(file_path)
    
    # Take only the last 150 days to prevent frontend rendering lag
    chart_data = df.tail(150).where(pd.notnull(df.tail(150)), None)
    
    # AI Prediction Logic (Safe from new feature conflicts)
    prediction_data = None
    if model is not None:
        latest_data = df.iloc[-1:]
        try:
            # Senior Engineer Trick: Only select features recognized by the model during training
            expected_features = model.feature_names_in_
            features_for_ai = latest_data[expected_features]
            
            prediction = model.predict(features_for_ai)[0]
            probability = model.predict_proba(features_for_ai)[0]
            
            prediction_data = {
                "prediction": "UP" if prediction == 1 else "DOWN",
                "confidence_score": round(float(probability[1] if prediction == 1 else probability[0]) * 100, 2)
            }
        except Exception as e:
            prediction_data = {"error": "Model features are out of sync. Retraining required."}

    return jsonify({
        "ticker": ticker,
        "latest_date": str(df.iloc[-1]['Date']),
        "ai_analysis": prediction_data,
        "chart_data": chart_data.to_dict(orient='records')
    })

if __name__ == '__main__':
    print("=== Starting Advanced Flask Backend API ===")
    app.run(debug=True, port=5000)