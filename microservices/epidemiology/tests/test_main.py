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

def test_solve_seir():
    from main import solve_seir
    # S0=990, E0=0, I0=10, R0=0, beta=0.3, sigma=0.2, gamma=0.1
    S, E, I, R = solve_seir(990.0, 0.0, 10.0, 0.0, 0.3, 0.2, 0.1, steps=5, dt=1.0)
    assert len(S) == 6
    assert S[0] == 990.0
    assert I[0] == 10.0
    for val in I:
        assert val >= 0.0

def test_forecast_endpoint_seir():
    # Long series (>4 points) to trigger full hybrid ML + SEIR pipeline
    response = client.post("/forecast", json={
        "historical_points": [100.0, 150.0, 210.0, 300.0, 420.0],
        "horizon_periods": 4,
        "region": "Bangladesh",
        "pathogen": "COVID-19"
    })
    assert response.status_code == 200
    data = response.json()
    assert "future_points" in data
    assert len(data["future_points"]) == 4
    assert "alert_stats" in data
    assert len(data["alert_stats"]) == 4
    # Ensure R0 estimate is returned
    r0_stat = [s for s in data["alert_stats"] if "R₀" in s["label"]]
    assert len(r0_stat) > 0
