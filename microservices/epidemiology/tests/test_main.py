import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app, double_exponential_smoothing

client = TestClient(app)

def test_double_exponential_smoothing():
    # Linear series: 10, 20, 30... Next should be 40, 50
    series = [10.0, 20.0, 30.0]
    result = double_exponential_smoothing(series, alpha=0.9, beta=0.9, n_preds=2)
    
    # Due to smoothing it might not be exactly 40, 50, but it should be close
    # and definitively > 30 and increasing
    assert len(result) == 2
    assert result[0] >= 30
    assert result[1] > result[0]

def test_double_exponential_smoothing_short():
    # If len < 2, it just returns the last element repeated
    assert double_exponential_smoothing([10.0], 0.5, 0.5, 3) == [10, 10, 10]
    assert double_exponential_smoothing([], 0.5, 0.5, 2) == [0, 0]

def test_forecast_endpoint():
    response = client.post("/forecast", json={
        "historical_points": [10.0, 20.0, 30.0],
        "horizon_periods": 3
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "future_points" in data
    assert len(data["future_points"]) == 3
    assert data["future_points"][0] > 0
