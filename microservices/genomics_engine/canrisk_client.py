from pydantic import BaseModel
from typing import Optional

class FamilyHistory(BaseModel):
    first_degree_relatives_with_breast_cancer: int = 0
    first_degree_relatives_with_ovarian_cancer: int = 0

class PatientProfile(BaseModel):
    age: int = 40
    biological_sex: str = "female"
    family_history: FamilyHistory = FamilyHistory()

class CanRiskResult(BaseModel):
    breast_cancer_risk_percentage: float
    ovarian_cancer_risk_percentage: float
    prostate_cancer_risk_percentage: float
    pancreatic_cancer_risk_percentage: float
    clinical_insight: str

def calculate_boadicea_risk(patient: PatientProfile, has_brca1_pathogenic: bool, has_brca1_vus: bool) -> CanRiskResult:
    """
    Simulates the CanRisk (BOADICEA) clinical algorithm for BRCA1 variants.
    Real CanRisk API integrates complex Bayesian networks over Polygenic Risk Scores (PRS)
    and detailed pedigree data. This module uses established literature penetrance figures
    to simulate a realistic clinical engine response.
    """
    # Baseline population risk (by age 80)
    base_breast = 12.0
    base_ovarian = 1.3
    base_prostate = 12.5 # for males
    base_pancreatic = 1.6

    # Adjust for family history (simplified heuristic mimicking BOADICEA)
    fh_breast_multiplier = 1.0 + (patient.family_history.first_degree_relatives_with_breast_cancer * 0.8)
    fh_ovarian_multiplier = 1.0 + (patient.family_history.first_degree_relatives_with_ovarian_cancer * 1.5)

    breast_risk = base_breast * fh_breast_multiplier
    ovarian_risk = base_ovarian * fh_ovarian_multiplier
    prostate_risk = base_prostate
    pancreatic_risk = base_pancreatic

    insight_msg = "No pathogenic variants detected. Risk modeled on population baseline and inputted family history."

    if has_brca1_pathogenic:
        # Standard literature penetrance for BRCA1 Pathogenic (e.g., c.68_69del) by age 80
        # Breast: ~72%, Ovarian: ~44%
        # Family history modifies this further in BOADICEA models.
        breast_risk = min(85.0, 72.0 * (1.0 + (patient.family_history.first_degree_relatives_with_breast_cancer * 0.1)))
        ovarian_risk = min(60.0, 44.0 * (1.0 + (patient.family_history.first_degree_relatives_with_ovarian_cancer * 0.15)))
        
        if patient.biological_sex == "male":
            prostate_risk = min(40.0, base_prostate * 2.5) # Elevated in male BRCA1 carriers
        
        pancreatic_risk = min(15.0, base_pancreatic * 3.0) # Modest elevation
        
        insight_msg = "BOADICEA Clinical Model: High-penetrance pathogenic BRCA1 variant identified. Lifetime risk calculated using standard penetrance modulated by inputted pedigree data."

    elif has_brca1_vus:
        # VUS (Variant of Uncertain Significance) does NOT alter the base medical risk profile
        # in standard clinical practice. Treat as baseline, but add a warning.
        insight_msg = "BOADICEA Clinical Model: A Variant of Uncertain Significance (VUS) was found. Clinical protocol dictates managing patient risk based strictly on family history until the variant is reclassified."

    return CanRiskResult(
        breast_cancer_risk_percentage=round(breast_risk, 1),
        ovarian_cancer_risk_percentage=round(ovarian_risk, 1) if patient.biological_sex == "female" else 0.0,
        prostate_cancer_risk_percentage=round(prostate_risk, 1) if patient.biological_sex == "male" else 0.0,
        pancreatic_cancer_risk_percentage=round(pancreatic_risk, 1),
        clinical_insight=insight_msg
    )
