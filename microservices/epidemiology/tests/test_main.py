import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app, generate_forecast_ml

client = TestClient(app)

def test_generate_forecast_ml_short():
    # If len < 4, it repeats the last element (or returns 0 if empty)
    assert generate_forecast_ml([10.0, 20.0, 30.0], 2) == [30, 30]
    assert generate_forecast_ml([10.0], 3) == [10, 10, 10]
    assert generate_forecast_ml([], 2) == [0, 0]

def test_generate_forecast_ml_long():
    # A linear-ish series with at least 4 elements
    series = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]
    result = generate_forecast_ml(series, n_preds=3)
    assert len(result) == 3
    # Check that predictions are sensible (should be integers and non-negative)
    for val in result:
        assert isinstance(val, int)
        assert val >= 0

def test_forecast_endpoint():
    response = client.post("/forecast", json={
        "historical_points": [10.0, 20.0, 30.0],
        "horizon_periods": 3
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "future_points" in data
    assert len(data["future_points"]) == 3
    assert data["future_points"] == [30, 30, 30]
