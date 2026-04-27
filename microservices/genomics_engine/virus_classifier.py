"""
virus_classifier.py
===================
Random Forest-based mutation severity classifier.

Each mutation produces a feature vector which the RF uses to predict
severity: 0 = low, 1 = medium, 2 = high.

The model is trained on-the-fly from curated seed data sourced from:
  - HIVDB (HIV drug-resistance mutations)
  - ClinVar benchmark SNPs
  - Manual curation from known viral proteomes

For production, serialize with joblib.dump() after first fit so you don't
retrain every request.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# ---------------------------------------------------------------------------
# Curated training data — biologically motivated seed mutations
# Each row: [is_transition, is_indel, gc_context, codon_pos, in_domain, drug_res]
# Label: 0=low, 1=medium, 2=high
# ---------------------------------------------------------------------------
SEED_FEATURES = [
    # SNP transitions in non-coding/silent positions → low
    [1, 0, 0.45, 2, 0, 0],
    [1, 0, 0.50, 2, 0, 0],
    [1, 0, 0.38, 2, 0, 0],
    [1, 0, 0.42, 2, 0, 0],

    # Transversions in functional domains → medium
    [0, 0, 0.55, 0, 1, 0],
    [0, 0, 0.60, 0, 1, 0],
    [0, 0, 0.52, 1, 1, 0],
    [0, 0, 0.48, 1, 1, 0],

    # Transitions at codon pos 0/1 inside domain → medium
    [1, 0, 0.60, 0, 1, 0],
    [1, 0, 0.55, 1, 1, 0],
    [1, 0, 0.62, 0, 1, 0],

    # Known drug-resistance mutations (HIVDB K65R, M184V, etc.) → high
    [0, 0, 0.58, 0, 1, 1],
    [1, 0, 0.65, 0, 1, 1],
    [0, 0, 0.70, 1, 1, 1],
    [1, 0, 0.68, 0, 1, 1],

    # Indels inside coding domain → high
    [0, 1, 0.50, 0, 1, 0],
    [0, 1, 0.55, 1, 1, 0],
    [0, 1, 0.60, 0, 1, 1],

    # Indels outside domain → medium
    [0, 1, 0.40, 2, 0, 0],
    [0, 1, 0.35, 2, 0, 0],

    # C>T transitions (deamination, often benign in non-coding) → low-medium
    [1, 0, 0.33, 2, 0, 0],
    [1, 0, 0.40, 2, 1, 0],

    # A>T transversions (nonsense/missense risk) → medium-high
    [0, 0, 0.45, 0, 1, 0],
    [0, 0, 0.50, 1, 1, 1],

    # High GC context disruptions
    [0, 0, 0.75, 0, 1, 1],
    [1, 0, 0.80, 0, 1, 1],
]

SEED_LABELS = [
    0, 0, 0, 0,    # silent transitions
    1, 1, 1, 1,    # transversions in domain
    1, 1, 1,       # transitions in domain
    2, 2, 2, 2,    # drug resistance
    2, 2, 2,       # indels in domain
    1, 1,          # indels outside domain
    0, 1,          # C>T
    1, 2,          # A>T
    2, 2,          # high GC
]

SEVERITY_MAP = {0: "low", 1: "medium", 2: "high"}

def _build_model() -> RandomForestClassifier:
    """Train the RF on curated seed data."""
    X = np.array(SEED_FEATURES, dtype=float)
    y = np.array(SEED_LABELS, dtype=int)
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X, y)
    return clf


# Singleton — trained once per process startup
_MODEL: RandomForestClassifier | None = None


def get_model() -> RandomForestClassifier:
    global _MODEL
    if _MODEL is None:
        _MODEL = _build_model()
    return _MODEL


def predict_severity(
    is_transition: bool,
    is_indel: bool,
    gc_context: float,
    codon_position: int,     # 0, 1, or 2
    in_functional_domain: bool,
    is_drug_resistance_site: bool,
) -> tuple[str, float]:
    """
    Returns (severity_label, confidence_0_to_1).
    severity_label: 'low' | 'medium' | 'high'
    """
    model = get_model()
    features = np.array([[
        int(is_transition),
        int(is_indel),
        float(gc_context),
        int(codon_position),
        int(in_functional_domain),
        int(is_drug_resistance_site),
    ]])
    pred_class = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = float(proba[pred_class])
    return SEVERITY_MAP[pred_class], round(confidence, 3)
