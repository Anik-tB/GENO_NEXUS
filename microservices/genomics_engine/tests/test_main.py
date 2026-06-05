import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app, _detect_organism, _gc_context

client = TestClient(app)

def test_detect_organism_hiv():
    assert _detect_organism(">HIV-1 isolate 123") == "HIV-1"
    assert _detect_organism(">human immunodeficiency virus 1 sequence") == "HIV-1"

def test_detect_organism_covid():
    assert _detect_organism(">SARS-CoV-2 genome") == "SARS-CoV-2"
    assert _detect_organism(">COVID-19 sample") == "SARS-CoV-2"

def test_detect_organism_unknown():
    assert _detect_organism(">Random Sequence 123") == "Unknown"

def test_gc_context():
    seq = "ATGCATGCATGC" # GC content is exactly 50%
    # Position 5 (0-indexed) with window 2 -> seq[3:7] -> "CATG" -> 2/4 = 0.5
    assert _gc_context(seq, 5, window=2) == 0.5
    
    # Position 1 with window 1 -> seq[0:2] -> "AT" -> 0.0
    assert _gc_context(seq, 1, window=1) == 0.0

def test_compare_endpoint_validation():
    # Test missing payload
    response = client.post("/compare", json={})
    assert response.status_code == 422 # Unprocessable Entity (FastAPI validation)
