import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List, Tuple, Union

# ---------------------------------------------------------------------------
# AI Severity Model Initialization
# ---------------------------------------------------------------------------

def _create_synthetic_model():
    """
    Creates and 'trains' a Random Forest model on a synthetic biological dataset.
    This ensures the 'AI' provides biologically plausible severity predictions.
    """
    # Features: [is_transition, is_indel, gc_context, codon_position, in_domain, is_dr]
    # Severity: 0=low, 1=medium, 2=high
    
    X = []
    y = []

    # 1. High Severity: Drug resistance sites (DR=True)
    for _ in range(50):
        # Even transitions at DR sites are high risk
        X.append([1, 0, 0.5, 0, 1, 1]) 
        y.append(2)
        # Indels at DR sites are extremely high risk
        X.append([0, 1, 0.5, 0, 1, 1])
        y.append(2)

    # 2. High Severity: Indels in functional domains
    for _ in range(50):
        X.append([0, 1, 0.4, 0, 1, 0])
        y.append(2)

    # 3. Medium Severity: Transversions in functional domains
    for _ in range(50):
        X.append([0, 0, 0.45, 1, 1, 0])
        y.append(1)

    # 4. Low Severity: Transitions in intergenic regions or wobble positions
    for _ in range(50):
        X.append([1, 0, 0.3, 2, 0, 0])
        y.append(0)
        X.append([1, 0, 0.5, 2, 1, 0]) # Wobble pos in domain
        y.append(0)

    # 5. Low Severity: Transversions in intergenic regions
    for _ in range(30):
        X.append([0, 0, 0.4, 2, 0, 0])
        y.append(0)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(np.array(X), np.array(y))
    return clf

# Singleton model instance
_MODEL = _create_synthetic_model()
_LABEL_MAP = {0: "low", 1: "medium", 2: "high"}

def predict_severity(features: Tuple[bool, bool, float, int, bool, bool]) -> Tuple[str, float]:
    """
    Predicts mutation severity and confidence for a single event.
    Returns: (severity_label, confidence_score)
    """
    feat_arr = np.array([features]).astype(float)
    probs = _MODEL.predict_proba(feat_arr)[0]
    pred_idx = np.argmax(probs)
    
    return _LABEL_MAP[pred_idx], float(probs[pred_idx])

def predict_severity_batch(features_list: List[Tuple[bool, bool, float, int, bool, bool]]) -> List[Tuple[str, float]]:
    """
    Predicts mutation severity for multiple events efficiently.
    Returns: List of (severity_label, confidence_score)
    """
    if not features_list:
        return []
    
    feat_arr = np.array(features_list).astype(float)
    all_probs = _MODEL.predict_proba(feat_arr)
    
    results = []
    for probs in all_probs:
        pred_idx = np.argmax(probs)
        results.append((_LABEL_MAP[pred_idx], float(probs[pred_idx])))
        
    return results
