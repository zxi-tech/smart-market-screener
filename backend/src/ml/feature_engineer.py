import pandas as pd
import pandas_ta as ta
import os
import glob
import warnings

# Suppress pandas fragmentation warnings for clean logs
warnings.filterwarnings('ignore', category=pd.errors.PerformanceWarning)

class MarketFeatureEngineer:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = input_dir
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df['Date'] = pd.to_datetime(df['Date'])
        df.sort_values('Date', inplace=True)

        # 1. Trend Indicators
        df['SMA_20'] = ta.sma(df['Close'], length=20)
        df['SMA_50'] = ta.sma(df['Close'], length=50)
        df['SMA_200'] = ta.sma(df['Close'], length=200)
        df['EMA_9'] = ta.ema(df['Close'], length=9)

        # 2. Momentum Indicators
        df['RSI_14'] = ta.rsi(df['Close'], length=14)
        df.ta.macd(close='Close', fast=12, slow=26, signal=9, append=True)

        # 3. Volatility Indicators (Bollinger Bands & ATR)
        df.ta.bbands(close='Close', length=20, std=2, append=True)
        df['ATR_14'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)

        # 4. Machine Learning Target (1 = Price Goes Up, 0 = Price Goes Down)
        df['Target_Next_Day'] = (df['Close'].shift(-1) > df['Close']).astype(float)

        df.dropna(subset=['SMA_200'], inplace=True)
        
        df['Target_Next_Day'] = df['Target_Next_Day'].fillna(0)

        return df

    def run(self):
        # Only process raw stock data files, explicitly skipping the fundamentals DB
        file_pattern = os.path.join(self.input_dir, "*_raw.csv")
        file_list = glob.glob(file_pattern)
        
        print(f"=== Starting Feature Engineering: {len(file_list)} files ===")
        
        for file_path in file_list:
            file_name = os.path.basename(file_path)
            ticker = file_name.replace("_raw.csv", "")
            
            print(f"[*] Engineering advanced technical features for: {ticker}...")
            df_raw = pd.read_csv(file_path)
            df_processed = self.generate_indicators(df_raw)
            
            save_path = os.path.join(self.output_dir, f"{ticker}_features.csv")
            df_processed.to_csv(save_path, index=False)
            print(f"[v] Processed {len(df_processed)} valid trading days.")
            
        # Sync fundamentals database to processed folder for API access
        fund_raw = os.path.join(self.input_dir, "fundamentals.csv")
        fund_proc = os.path.join(self.output_dir, "fundamentals.csv")
        if os.path.exists(fund_raw):
            pd.read_csv(fund_raw).to_csv(fund_proc, index=False)
            print("\n[v] Master Fundamental Database synced to processed directory.")
            
        print("=== Feature Engineering Completed ===")

if __name__ == "__main__":
    input_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/raw"))
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed"))
    
    engineer = MarketFeatureEngineer(input_dir=input_path, output_dir=output_path)
    engineer.run()