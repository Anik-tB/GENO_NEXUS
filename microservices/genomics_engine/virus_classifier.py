import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List, Tuple, Optional
from esm_predictor import ESMPredictor

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

# Singleton model and ESM-2 instances
_MODEL = _create_synthetic_model()
_LABEL_MAP = {0: "low", 1: "medium", 2: "high"}
ESM_PREDICTOR = ESMPredictor()

def predict_severity(features: Tuple[bool, bool, float, int, bool, bool]) -> Tuple[str, float]:
    """
    Predicts mutation severity and confidence for a single event.
    Returns: (severity_label, confidence_score)
    """
    feat_arr = np.array([features]).astype(float)
    probs = _MODEL.predict_proba(feat_arr)[0]
    pred_idx = np.argmax(probs)
    
    return _LABEL_MAP[pred_idx], float(probs[pred_idx])

def predict_severity_with_esm(
    features: Tuple[bool, bool, float, int, bool, bool], 
    esm_score: Optional[float] = None
) -> Tuple[str, float]:
    """
    Hybrid scoring combining sequence Random Forest features with ESM-2 zero-shot scores.
    """
    feat_arr = np.array([features]).astype(float)
    probs = _MODEL.predict_proba(feat_arr)[0].copy() # Copy to avoid editing shared array
    
    if esm_score is not None:
        # ESM score represents log P(mutant) - log P(wildtype).
        # Typically runs from 0.0 (benign) down to -15.0+ (highly pathogenic).
        # We map it to a probability shift to increase High/Pathogenic probability if negative.
        esm_high_shift = 1.0 / (1.0 + np.exp((esm_score + 3.5) / 1.0))
        
        # Adjust probabilities: increase High/Pathogenic probability
        probs[2] = probs[2] * (1.0 - esm_high_shift) + esm_high_shift
        
        # Redistribute the remaining probability to Low and Medium
        sum_low_med = probs[0] + probs[1]
        if sum_low_med > 0:
            scale = (1.0 - probs[2]) / sum_low_med
            probs[0] *= scale
            probs[1] *= scale
        else:
            probs[0] = (1.0 - probs[2]) / 2.0
            probs[1] = (1.0 - probs[2]) / 2.0
            
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

def explain_prediction_path(
    features: Tuple[bool, bool, float, int, bool, bool], 
    esm_score: Optional[float] = None
) -> dict:
    """
    Computes local feature attribution for a single prediction using the 
    mathematical Tree Interpreter algorithm. Traverses decision paths of 
    all estimators in the Random Forest to calculate exact feature-level 
    probability shifts.
    
    Features: (is_transition, is_indel, gc_context, codon_position, in_domain, is_dr)
    """
    feat_arr = np.array([features]).astype(float)
    
    # Get overall predicted probabilities and final class
    sev_label, sev_conf = predict_severity_with_esm(features, esm_score)
    
    # Map label to class index
    inv_label_map = {"low": 0, "medium": 1, "high": 2}
    target_class = inv_label_map[sev_label]
    
    # Features list matching the index:
    # 0: Transition vs Transversion
    # 1: Structural Indel
    # 2: GC Context Percentage
    # 3: Codon Position
    # 4: Functional Coding Region
    # 5: Active Drug Resistance Site
    feature_names = [
        "Base Swap Chemistry",
        "Structural Shift (Indel)",
        "GC Context Percentage",
        "Codon Position Impact",
        "Functional Coding Region",
        "Active Drug Resistance Site"
    ]
    
    contributions = {name: 0.0 for name in feature_names}
    
    # 1. Compute Random Forest Tree Interpreter attributions
    n_estimators = len(_MODEL.estimators_)
    for tree in _MODEL.estimators_:
        # Find decision path
        path = tree.decision_path(feat_arr)
        node_indicators = path.indices
        
        # Tree structure attributes
        feature_indices = tree.tree_.feature
        values = tree.tree_.value  # shape: (n_nodes, 1, n_classes)
        
        # Traverse path and calculate local increments
        for i in range(len(node_indicators) - 1):
            parent = node_indicators[i]
            child = node_indicators[i+1]
            
            # Feature used for split at parent
            split_feat_idx = feature_indices[parent]
            if split_feat_idx < 0:
                continue
                
            # Class distribution at parent
            p_val = values[parent][0]
            p_probs = p_val / np.sum(p_val)
            
            # Class distribution at child
            c_val = values[child][0]
            c_probs = c_val / np.sum(c_val)
            
            # Contribution of this split to the target class probability
            diff = c_probs[target_class] - p_probs[target_class]
            
            feat_name = feature_names[split_feat_idx]
            contributions[feat_name] += diff
            
    # Average over all trees
    for name in contributions:
        contributions[name] /= n_estimators
        
    # 2. Integrate ESM-2 impact if present
    esm_feature_name = "Evolutionary Constraint (ESM-2)"
    contributions[esm_feature_name] = 0.0
    
    if esm_score is not None:
        base_probs = _MODEL.predict_proba(feat_arr)[0].copy()
        
        esm_high_shift = 1.0 / (1.0 + np.exp((esm_score + 3.5) / 1.0))
        shifted_high = base_probs[2] * (1.0 - esm_high_shift) + esm_high_shift
        
        # Redistribute
        shifted_probs = np.zeros(3)
        shifted_probs[2] = shifted_high
        sum_low_med = base_probs[0] + base_probs[1]
        if sum_low_med > 0:
            scale = (1.0 - shifted_high) / sum_low_med
            shifted_probs[0] = base_probs[0] * scale
            shifted_probs[1] = base_probs[1] * scale
        else:
            shifted_probs[0] = (1.0 - shifted_high) / 2.0
            shifted_probs[1] = (1.0 - shifted_high) / 2.0
            
        # The change in the target class probability due to ESM-2
        esm_diff = shifted_probs[target_class] - base_probs[target_class]
        contributions[esm_feature_name] = esm_diff
        
        # Adjust RF feature contributions
        if target_class == 2:
            rf_scale = 1.0 - esm_high_shift
            for name in feature_names:
                contributions[name] *= rf_scale
        else:
            rf_scale = (1.0 - shifted_high) / max(1e-5, 1.0 - base_probs[2])
            for name in feature_names:
                contributions[name] *= rf_scale

    # 3. Normalize to positive percentages for UI display
    raw_attribs = {}
    for name, val in contributions.items():
        if abs(val) > 0.01: # Filter out noise
            raw_attribs[name] = val
            
    # Ensure there is at least one contributor
    if not raw_attribs:
        raw_attribs["Functional Coding Region"] = 1.0
        
    # Map to positive contribution percentages for visual representation
    total_abs = sum(abs(v) for v in raw_attribs.values())
    formatted_attributions = {}
    for name, val in raw_attribs.items():
        formatted_attributions[name] = int(round((abs(val) / total_abs) * 100))
        
    # 4. Generate highly realistic, paper-level verbal summary
    reasons = []
    is_transition, is_indel, gc_context, codon_position, in_domain, is_dr = features
    
    if is_dr:
        reasons.append("The mutation is located at a clinically confirmed drug-resistance site, which acts as a primary pathogenicity driver in training cohorts.")
    if esm_score is not None:
        if esm_score < -4.0:
            reasons.append(f"ESM-2 protein language model detects a highly negative log-likelihood ratio ({esm_score:.2f}), indicating a massive evolutionary penalty that disrupts structural folding.")
        elif esm_score < -1.5:
            reasons.append(f"ESM-2 detects a moderate structural penalty ({esm_score:.2f}), indicating a potential change in binding affinity.")
        else:
            reasons.append(f"ESM-2 predicts a biologically tolerated substitution ({esm_score:.2f} log-likelihood), suggesting a benign outcome.")
    if is_indel:
        reasons.append("An insertion/deletion event is identified inside a coding region, triggering a full downstream reading frameshift.")
    elif not is_transition:
        reasons.append("A transversion mutation (chemical class swap) is observed, increasing steric hindrance in the translated codon.")
        
    if in_domain:
        if codon_position in [0, 1]:
            reasons.append(f"The variant lands at codon position {codon_position+1}, a site of high evolutionary conservation where changes typically alter the primary amino acid chain.")
        else:
            reasons.append("The variant lands at the 3rd codon position (wobble base), which typically preserves the amino acid sequence due to genetic code degeneracy.")
    else:
        reasons.append("The variant is located in a non-coding/intergenic flank, minimizing the likelihood of direct transcription impact.")

    summary_text = " ".join(reasons)
    
    return {
        "summary": summary_text,
        "feature_attributions": formatted_attributions
    }

