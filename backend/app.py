from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import joblib
import os

# Initialize Flask App and Enable CORS for frontend communication
app = Flask(__name__)
CORS(app)

# Setup Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'trend_predictor_rf.pkl')
DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')

# Load the trained Machine Learning model globally so it only loads once
try:
    model = joblib.load(MODEL_PATH)
    print("[v] ML Model loaded successfully.")
except Exception as e:
    print(f"[x] Failed to load model. Ensure the .pkl file is in the 'models' directory. Error: {e}")
    model = None

@app.route('/', methods=['GET'])
def health_check():
    """Simple endpoint to verify the API is running."""
    return jsonify({"status": "active", "message": "Smart Market Screener API is running."})

@app.route('/api/predict', methods=['GET'])
def predict_trend():
    """
    Endpoint to predict the next day's trend for a specific ticker.
    Example: /api/predict?ticker=BBCA.JK
    """
    if model is None:
        return jsonify({"error": "Model is not loaded on the server."}), 500

    ticker = request.args.get('ticker', 'BBCA.JK')
    file_path = os.path.join(DATA_DIR, f"{ticker}_features.csv")
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"Processed data for {ticker} not found."}), 404
        
    try:
        # Load the processed data
        df = pd.read_csv(file_path)
        
        # We only need the very last row (the most recent trading day) to predict tomorrow
        latest_data = df.iloc[-1:] 
        
        # Isolate the exact features the model was trained on
        # Exclude 'Date' and 'Target_Next_Day' (if it exists)
        features = latest_data.drop(columns=['Date', 'Target_Next_Day'], errors='ignore')
        
        # Generate Prediction (1 = UP, 0 = DOWN) and Probability
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0] # Returns array like [prob_down, prob_up]
        
        # Format the response
        result = {
            "ticker": ticker,
            "latest_date": str(latest_data['Date'].values[0]),
            "prediction": "UP" if prediction == 1 else "DOWN",
            "confidence_score": round(float(probability[1] if prediction == 1 else probability[0]) * 100, 2)
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the server on port 5000
    print("=== Starting Flask Backend API ===")
    app.run(debug=True, port=5000)