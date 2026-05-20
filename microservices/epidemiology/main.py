import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Epidemiology Engine", description="Outbreak prediction service")

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ForecastRequest(BaseModel):
    historical_points: List[float]
    horizon_periods: int = 4

class ForecastResponse(BaseModel):
    historical_points: List[float]
    future_points: List[int]

def double_exponential_smoothing(series: List[float], alpha: float, beta: float, n_preds: int) -> List[int]:
    """
    Holt's Linear Trend Method (Double Exponential Smoothing) in pure Python.
    Good for time series forecasting with a trend but no seasonality.
    """
    if len(series) < 2:
        return [int(series[-1])] * n_preds if series else [0] * n_preds
        
    result = []
    level = series[0]
    trend = series[1] - series[0]
    
    for i in range(1, len(series)):
        val = series[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    for i in range(1, n_preds + 1):
        forecast_val = level + i * trend
        result.append(max(0, int(round(forecast_val))))
        
    return result

@app.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
    try:
        # Load configurable alpha and beta or use defaults
        alpha = float(os.getenv("FORECAST_ALPHA", "0.6"))
        beta = float(os.getenv("FORECAST_BETA", "0.4"))
        
        future = double_exponential_smoothing(
            request.historical_points, 
            alpha, 
            beta, 
            request.horizon_periods
        )
        return ForecastResponse(
            historical_points=request.historical_points,
            future_points=future
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    # For local testing only. In production, run via gunicorn.
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    is_dev = os.getenv("APP_ENV", "development").lower() == "development"
    
    print(f"Starting Epidemiology Engine on {host}:{port}...")
    uvicorn.run("main:app", host=host, port=port, reload=is_dev)
