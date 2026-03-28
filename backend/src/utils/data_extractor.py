import yfinance as yf
import pandas as pd
import os
from typing import List, Optional

class MarketDataDownloader:
    def __init__(self, tickers: List[str], start_date: str, end_date: str, output_dir: str):
        self.tickers = tickers
        self.start_date = start_date
        self.end_date = end_date
        self.output_dir = output_dir
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)

    def fetch_ticker_data(self, ticker: str) -> Optional[pd.DataFrame]:
        print(f"[*] Fetching data for: {ticker}...")
        try:
            df = yf.download(ticker, start=self.start_date, end=self.end_date, progress=False)
            
            if df.empty:
                print(f"[!] No data found for: {ticker}")
                return None

            # Flatten multi-level columns and reset index
            df.reset_index(inplace=True)
            df.columns = [''.join(col).strip() if isinstance(col, tuple) else col for col in df.columns.values]
            
            return df
            
        except Exception as e:
            print(f"[x] Failed to process {ticker}. Error: {e}")
            return None

    def run(self):
        print(f"=== Starting Data Pipeline: {len(self.tickers)} Tickers ===")
        for ticker in self.tickers:
            data = self.fetch_ticker_data(ticker)
            
            if data is not None:
                file_path = os.path.join(self.output_dir, f"{ticker}_raw.csv")
                data.to_csv(file_path, index=False)
                print(f"[v] Saved: {file_path}")
        print("=== Process Completed ===")

if __name__ == "__main__":
    watchlist = ["BBCA.JK", "GOTO.JK", "AMMN.JK", "AAPL"]
    
    save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/raw"))
    
    pipeline = MarketDataDownloader(
        tickers=watchlist,
        start_date="2023-01-01",
        end_date="2026-03-01",
        output_dir=save_dir
    )
    
    pipeline.run()