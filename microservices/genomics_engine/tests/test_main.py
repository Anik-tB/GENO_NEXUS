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

def test_builtin_known_mutations_lookup():
    from main import get_known_mutations_map
    # Test that get_known_mutations_map returns correct overrides
    mut_map = get_known_mutations_map("HIV-1")
    assert (65, 'A', 'G') in mut_map
    assert mut_map[(65, 'A', 'G')]["severity"] == "high"
    assert mut_map[(65, 'A', 'G')]["drug_resistance"] is True

def test_compare_alignment_caching():
    from main import _ALIGNMENT_CACHE
    # Clean cache
    _ALIGNMENT_CACHE.clear()
    
    # Run compare mock sequence
    payload = {
        "query_sequence": ">HIV-1 sample\nATGCATGCATGCATGCATGCATGCATGCATGC",
        "reference_sequence": ">HIV-1 ref\nATGCATGCATGCATGCATGCATGCATGCATGC"
    }
    
    response = client.post("/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "match_percentage" in data
    assert data["match_percentage"] == 100.0
    
    # Verify cache has been populated
    assert len(_ALIGNMENT_CACHE) == 1
    
    # Run compare again (should hit cache)
    response_cached = client.post("/compare", json=payload)
    assert response_cached.status_code == 200
    data_cached = response_cached.json()
    assert data_cached["match_percentage"] == 100.0
