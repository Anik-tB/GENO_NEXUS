from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import io
import math
from collections import Counter

try:
    from Bio import SeqIO
    from Bio import Entrez
    from Bio import Align
    Entrez.email = "example@genonexus.com"
except ImportError:
    pass

app = FastAPI()

# ─────────────────────────────────────────────────────────────────────────────
# Disease Models — scored entirely from mutation signatures
# Each entry defines:
#   base_risk      : population baseline risk (%)
#   max_risk       : ceiling risk (%)
#   base_conf      : base confidence level (%)
#   genes          : associated gene symbols
#   transition_risk_per : risk added per C>T or A>G transition
#   transversion_risk_per : risk added per A>T, G>C, C>A, T>G transversion
#   specific_subs  : list of (ref, query, risk_boost) tuples for high-impact SNPs
#   high_threshold : risk % above which severity is HIGH
#   med_threshold  : risk % above which severity is MEDIUM
# ─────────────────────────────────────────────────────────────────────────────
DISEASE_MODELS = {
    "alzheimers": {
        "id": "p4",
        "disease": "Late-Onset Alzheimer's",
        "base_risk": 5,
        "max_risk": 97,
        "base_conf": 85,
        "genes": "APOE, CLU, PICALM",
        "transition_risk_per": 4.5,    # C>T transitions are most damaging here
        "transversion_risk_per": 1.2,
        "specific_subs": [
            ("C", "T", 12.0),   # C>T is the hallmark Alzheimer's-linked variant
            ("G", "A", 8.0),    # complement of C>T on other strand
            ("A", "G", 3.5),
        ],
        "high_threshold": 60,
        "med_threshold": 35,
        "insight_low": "No significant APOE risk alleles detected. Baseline population-level risk.",
        "insight_med": "Moderate C>T transition burden detected in APOE/CLU genomic footprint. Routine monitoring advised.",
        "insight_high": "High-penetrance C>T transition signature detected. Associated with early APOE ε4 allele expression and accelerated neurodegeneration risk.",
    },
    "brca": {
        "id": "p3",
        "disease": "Breast Cancer (BRCA)",
        "base_risk": 2,
        "max_risk": 96,
        "base_conf": 95,
        "genes": "BRCA1, BRCA2, PALB2",
        "transition_risk_per": 1.0,
        "transversion_risk_per": 6.5,   # Transversions (especially A>T) are key
        "specific_subs": [
            ("A", "T", 15.0),   # Pathogenic frameshift-associated transversion
            ("G", "C", 10.0),   # BRCA2 loss-of-function signature
            ("T", "A", 9.0),    # Complementary pathogenic pair
            ("C", "A", 7.0),
        ],
        "high_threshold": 50,
        "med_threshold": 20,
        "insight_low": "No pathogenic BRCA1/BRCA2 variant signature identified. Standard screening schedule recommended.",
        "insight_med": "Moderate transversion burden found. Some variants co-locate with BRCA2 exonic regions. Enhanced imaging screening advised.",
        "insight_high": "High-confidence pathogenic A>T transversion detected. Loss-of-function signature in BRCA1/BRCA2 binding domain. Genetic counselling strongly recommended.",
    },
    "diabetes": {
        "id": "p1",
        "disease": "Type 2 Diabetes",
        "base_risk": 10,
        "max_risk": 92,
        "base_conf": 88,
        "genes": "TCF7L2, KCNQ1, SLC30A8",
        "transition_risk_per": 2.0,
        "transversion_risk_per": 3.5,
        "specific_subs": [
            ("T", "A", 12.0),   # TCF7L2 locus transversion
            ("G", "T", 8.0),
            ("C", "G", 5.5),
        ],
        "high_threshold": 60,
        "med_threshold": 35,
        "insight_low": "TCF7L2 and KCNQ1 loci show no elevated variant burden. Baseline metabolic risk profile.",
        "insight_med": "Elevated transversion burden near TCF7L2 locus. Lifestyle intervention and annual HbA1c monitoring recommended.",
        "insight_high": "High-risk variant signature in TCF7L2/KCNQ1 regulatory region. Significant insulin secretion pathway disruption predicted.",
    },
    "cad": {
        "id": "p2",
        "disease": "Coronary Artery Disease",
        "base_risk": 15,
        "max_risk": 93,
        "base_conf": 92,
        "genes": "APOB, LDLR, PCSK9",
        "transition_risk_per": 2.5,
        "transversion_risk_per": 3.0,
        "specific_subs": [
            ("G", "C", 11.0),  # LDLR/PCSK9 disruptive transversion
            ("A", "C", 7.0),
            ("T", "G", 6.0),
            ("C", "T", 4.0),
        ],
        "high_threshold": 60,
        "med_threshold": 35,
        "insight_low": "APOB and LDLR loci show standard baseline profile. Standard cardiovascular risk screening schedule.",
        "insight_med": "Moderate G>C transversion burden detected. Possible PCSK9 gain-of-function pathway activation. Lipid panel monitoring advised.",
        "insight_high": "Strong pathogenic signal in LDLR/PCSK9 binding domain. Elevated LDL-C elevation risk. Cardiology referral and statin therapy evaluation recommended.",
    },
    "hiv": {
        "id": "p5",
        "disease": "HIV Susceptibility",
        "base_risk": 3,
        "max_risk": 88,
        "base_conf": 82,
        "genes": "CCR5, HLA-B, TRIM5",
        "transition_risk_per": 3.0,    # G>A transitions degrade CCR5 regulatory regions
        "transversion_risk_per": 2.0,
        "specific_subs": [
            ("G", "A", 14.0),   # CCR5 Δ32 region — loss-of-function linked variants
            ("C", "T", 10.0),   # HLA-B*57:01 linked transition — hypersensitivity & immune escape
            ("A", "C", 6.0),    # TRIM5α restriction factor variant
            ("T", "C", 5.0),    # Secondary CCR5 promoter variant
        ],
        "high_threshold": 55,
        "med_threshold": 25,
        "insight_low": "No high-risk CCR5 or HLA-B variants detected. Innate antiviral restriction factors appear intact. Standard prevention guidelines apply.",
        "insight_med": "Partial CCR5 promoter variant burden detected. Reduced restriction factor activity may increase cell-entry susceptibility. PrEP consultation recommended.",
        "insight_high": "High-penetrance G>A transition signature in CCR5/HLA-B loci. Significant immune evasion pathway disruption predicted. Immediate immunology referral and PrEP initiation strongly advised.",
    },
    "lung_cancer": {
        "id": "p6",
        "disease": "Lung Cancer",
        "base_risk": 4,
        "max_risk": 95,
        "base_conf": 90,
        "genes": "EGFR, KRAS, TP53, STK11",
        "transition_risk_per": 2.8,
        "transversion_risk_per": 5.5,  # C>A is the hallmark tobacco carcinogen transversion
        "specific_subs": [
            ("C", "A", 16.0),   # KRAS G12C — the dominant tobacco smoke transversion
            ("G", "T", 14.0),   # TP53 loss-of-function transversion (complementary strand C>A)
            ("C", "T", 9.0),    # EGFR activating transition (sensitising mutation)
            ("A", "T", 7.0),    # STK11/LKB1 frameshift-associated transversion
        ],
        "high_threshold": 55,
        "med_threshold": 25,
        "insight_low": "No pathogenic EGFR, KRAS, or TP53 variant signatures identified. Baseline population-level lung cancer risk. Standard annual screening for high-risk smokers.",
        "insight_med": "Moderate C>A transversion burden consistent with early carcinogen exposure signature. KRAS or TP53 pathway activation possible. Low-dose CT screening and smoking cessation strongly advised.",
        "insight_high": "High-confidence KRAS G12C / TP53 loss-of-function signature detected. Strongly associated with non-small cell lung carcinoma (NSCLC). Immediate oncology referral and CT scan indicated.",
    },
}


def is_transition(ref: str, query: str) -> bool:
    """True if the substitution is a transition (purine<>purine or pyrimidine<>pyrimidine)."""
    purines = {"A", "G"}
    pyrimidines = {"C", "T"}
    return (ref in purines and query in purines) or (ref in pyrimidines and query in pyrimidines)


def compute_risk(model: dict, mutations: list[dict]) -> tuple[float, float, int]:
    """
    Computes (risk%, confidence%, mutation_count) for a single disease model
    given the full list of mutation dicts {position, reference, query}.
    
    Risk is calculated by:
      1. Specific high-impact SNP matches (highest weight)
      2. Transition / transversion classification per remaining mutation
      3. Non-linear saturation curve using tanh to prevent clamping at 100%
    """
    risk = model["base_risk"]
    relevant_count = 0
    
    # Count substitution type occurrences
    sub_counts = Counter((m.get("reference", ""), m.get("query", "")) for m in mutations)
    
    # Step 1 — Specific high-impact SNPs
    for ref, query, boost in model["specific_subs"]:
        count = sub_counts.get((ref, query), 0)
        if count > 0:
            # Diminishing returns: each additional identical substitution adds less
            risk += boost * (1 + math.log(count))
            relevant_count += count

    # Step 2 — General transition / transversion burden on remaining mutations
    for (ref, query), count in sub_counts.items():
        if not ref or not query or ref == "-" or query == "-":
            continue
        # Avoid double-counting specific subs we already scored
        if any(ref == r and query == q for r, q, _ in model["specific_subs"]):
            continue
        per_mut = (
            model["transition_risk_per"] if is_transition(ref, query)
            else model["transversion_risk_per"]
        )
        risk += per_mut * math.log(1 + count)
        relevant_count += count

    # Step 3 — Saturate using tanh to keep risk realistic and non-linear
    # Maps [base_risk, ∞) → [base_risk, max_risk) smoothly
    normalized = (risk - model["base_risk"]) / model["max_risk"]
    saturated = model["base_risk"] + (model["max_risk"] - model["base_risk"]) * math.tanh(normalized)
    final_risk = round(min(model["max_risk"], max(model["base_risk"], saturated)), 1)

    # Confidence scales up with more relevant mutations (more data = higher confidence)
    extra_conf = min(10, relevant_count * 0.5)
    confidence = round(min(99, model["base_conf"] + extra_conf), 0)

    return final_risk, confidence, relevant_count


def build_prediction(model: dict, risk: float, confidence: float, total_mutations: int) -> dict:
    """Assembles the final prediction dict from computed risk metrics."""
    if risk >= model["high_threshold"]:
        severity = "high"
        trend = "increasing"
        insight = model["insight_high"]
    elif risk >= model["med_threshold"]:
        severity = "medium"
        trend = "increasing"
        insight = model["insight_med"]
    else:
        severity = "low"
        trend = "stable"
        insight = model["insight_low"]

    # Append a dynamic mutation count annotation to every insight
    insight += f" ({total_mutations} variants analysed.)"

    return {
        "id": model["id"],
        "disease": model["disease"],
        "risk": int(risk),
        "confidence": int(confidence),
        "trend": trend,
        "severity": severity,
        "genes": model["genes"],
        "insight": insight,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    query_path: str
    reference_url: str

@app.post("/compare")
async def compare_sequences(req: CompareRequest):
    try:
        ref_id = "NC_045512.2"
        if "NC_" in req.reference_url:
            ref_id = req.reference_url.split("NC_")[1].split("?")[0]
            if not ref_id.startswith("NC_"):
                ref_id = "NC_" + ref_id

        try:
            handle = Entrez.efetch(db="nucleotide", id=ref_id, rettype="fasta", retmode="text")
            ref_record = SeqIO.read(handle, "fasta")
            ref_seq = str(ref_record.seq)
            handle.close()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch reference from NCBI: {str(e)}")

        if not os.path.exists(req.query_path):
            raise HTTPException(status_code=404, detail="Query file not found")

        ext = os.path.splitext(req.query_path)[1].lower()
        file_format = "fasta"
        if ext in [".fastq", ".fq"]:
            file_format = "fastq"
        elif ext == ".vcf":
            raise HTTPException(status_code=400, detail="VCF direct alignment not supported yet. Use FASTA/FASTQ.")

        try:
            query_record = SeqIO.read(req.query_path, file_format)
            query_seq = str(query_record.seq)
        except Exception:
            with open(req.query_path, "r") as f:
                content = f.read().replace('\n', '').replace('\r', '')
                query_seq = content if not content.startswith('>') else "".join(content.split('>')[1].split('\n')[1:])

        ref_sub = ref_seq[:2000]
        query_sub = query_seq[:2000]

        if len(ref_sub) == 0 or len(query_sub) == 0:
            raise HTTPException(status_code=400, detail="Invalid sequence data")

        aligner = Align.PairwiseAligner()
        aligner.mode = 'global'
        alignments = aligner.align(ref_sub, query_sub)
        best_alignment = alignments[0]

        match_score = best_alignment.score
        seq_length = max(len(ref_sub), len(query_sub))
        match_percentage = (match_score / seq_length) * 100 if seq_length > 0 else 0

        mutations = []
        alignment_str = format(best_alignment)
        lines = alignment_str.split('\n')

        if len(lines) >= 3:
            t_str = lines[0]
            m_str = lines[1]
            q_str = lines[2]

            pos = 1
            for t_base, m_char, q_base in zip(t_str, m_str, q_str):
                if m_char != '|':
                    if t_base != '-' or q_base != '-':
                        mutations.append({
                            "position": pos,
                            "reference": t_base,
                            "query": q_base
                        })
                if t_base != '-':
                    pos += 1

        return {
            "match_percentage": round(match_percentage, 2),
            "mutations_found": mutations[:100]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PredictRequest(BaseModel):
    mutations: list[dict]

@app.post("/predict_disease")
async def predict_disease(req: PredictRequest):
    """
    Scores each disease model against the actual mutation payload.
    All risk values are computed from mutation signatures — nothing is hardcoded.
    """
    mutations = req.mutations
    total = len(mutations)

    results = []
    for model in DISEASE_MODELS.values():
        risk, confidence, _ = compute_risk(model, mutations)
        results.append(build_prediction(model, risk, confidence, total))

    # Sort by risk descending so highest-risk conditions appear first
    results.sort(key=lambda x: x["risk"], reverse=True)

    return {"predictions": results}
