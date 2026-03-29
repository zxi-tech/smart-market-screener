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
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Array to hold fundamental data for the screener table
        self.fundamentals_data = []

    def fetch_ticker_data(self, ticker: str):
        print(f"[*] Fetching data for: {ticker}...")
        try:
            # 1. Fetch Historical OHLCV Data
            df = yf.download(ticker, start=self.start_date, end=self.end_date, progress=False)
            
            if df.empty:
                print(f"[!] No historical data found for: {ticker}")
                return

            # Flatten multi-index columns
            df.reset_index(inplace=True)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.droplevel(1)
            else:
                df.columns = [col[0].strip() if isinstance(col, tuple) else col for col in df.columns.values]
            
            df.rename(columns={'date': 'Date', 'index': 'Date'}, inplace=True)
            
            # Save Historical Data
            file_path = os.path.join(self.output_dir, f"{ticker}_raw.csv")
            df.to_csv(file_path, index=False)
            print(f"[v] Saved historical data: {ticker}_raw.csv")

            # 2. Fetch Fundamental Data
            stock_info = yf.Ticker(ticker).info
            
            # Extract specific metrics, use 0 or "N/A" if data is missing
            fundamental_row = {
                "Ticker": ticker,
                "Sector": stock_info.get("sector", "N/A"),
                "MarketCap": stock_info.get("marketCap", 0),
                "PE_Ratio": stock_info.get("trailingPE", 0),
                "EPS": stock_info.get("trailingEps", 0),
                "ROE": stock_info.get("returnOnEquity", 0),
                "Debt_to_Equity": stock_info.get("debtToEquity", 0),
                "Revenue_Growth": stock_info.get("revenueGrowth", 0)
            }
            self.fundamentals_data.append(fundamental_row)
            print(f"[v] Saved fundamental data: {ticker}")

        except Exception as e:
            print(f"[x] Failed to process {ticker}. Error: {e}")

    def run(self):
        print(f"=== Starting Advanced Data Pipeline: {len(self.tickers)} Tickers ===")
        for ticker in self.tickers:
            self.fetch_ticker_data(ticker)
            
        # 3. Save Master Fundamental Database
        if self.fundamentals_data:
            fund_df = pd.DataFrame(self.fundamentals_data)
            fund_path = os.path.join(self.output_dir, "fundamentals.csv")
            fund_df.to_csv(fund_path, index=False)
            print(f"\n[v] Master Fundamental Database saved at: {fund_path}")
            
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