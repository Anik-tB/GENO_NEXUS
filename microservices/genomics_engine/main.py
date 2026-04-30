"""
main.py — GenoNexus Genomics Engine v2
========================================
FastAPI microservice that performs:
  1. Biopython SeqIO parsing (FASTA / FASTQ)
  2. FASTA header-based virus auto-detection
  3. PostgreSQL reference_genomes lookup for dynamic gene maps
  4. Needleman-Wunsch global gapped alignment (Bio.Align.PairwiseAligner)
  5. SNP + Indel extraction from aligned pair
  6. Random Forest severity scoring (virus_classifier.py)
  7. Enriched mutation JSON returned to Next.js
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import requests
import os
import io
import re
import psycopg2
from typing import Optional
from Bio import SeqIO
from Bio.Align import PairwiseAligner

from virus_classifier import predict_severity, predict_severity_batch

app = FastAPI(title="GenoNexus Engine v2", version="2.0.0")

# ---------------------------------------------------------------------------
# DB helpers (reads from ENV same as Next.js)
# ---------------------------------------------------------------------------
def _get_db_conn():
    """Optional PostgreSQL connection — engine degrades gracefully if unavailable."""
    dsn = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not dsn:
        return None
    try:
        conn = psycopg2.connect(dsn)
        return conn
    except Exception as e:
        print(f"[WARN] Could not connect to PostgreSQL: {e}")
        return None

# ---------------------------------------------------------------------------
# In-process fallback reference genome library
# (used when PostgreSQL is unavailable)
# ---------------------------------------------------------------------------
BUILTIN_REFERENCES = {
    "HIV-1":        {"accession": "NC_001802.1", "gene_map": {"gag": [790, 2292], "pol": [2085, 5096], "env": [6225, 8795], "rev": [5970, 6045], "tat": [5831, 6045], "nef": [8797, 9417]}},
    "HIV-2":        {"accession": "NC_001722.1", "gene_map": {"gag": [777, 2277], "pol": [2073, 5087]}},
    "SARS-CoV-2":   {"accession": "NC_045512.2", "gene_map": {"S": [21563, 25384], "N": [28274, 29533], "E": [26245, 26472], "M": [26523, 27191], "ORF1ab": [266, 21555]}},
    "Influenza-A":  {"accession": "NC_002016.1", "gene_map": {"HA": [1, 1779], "NA": [1, 1410]}},
    "Influenza-B":  {"accession": "NC_002204.1", "gene_map": {"HA": [1, 1841]}},
    "Hepatitis-B":  {"accession": "NC_003977.2", "gene_map": {"S": [155, 835], "C": [1816, 2454], "P": [2307, 3182]}},
    "Hepatitis-C":  {"accession": "NC_004102.1", "gene_map": {"E1": [914, 1490], "E2": [1490, 2579], "NS5B": [7601, 9374]}},
    "Dengue-1":     {"accession": "NC_001477.1", "gene_map": {"E": [937, 2421]}},
    "Ebola":        {"accession": "NC_002549.1", "gene_map": {"GP": [6039, 8068], "NP": [469, 2689]}},
    "Monkeypox":    {"accession": "NC_063383.1", "gene_map": {}},
}

# Known high-severity mutation positions per organism (simplified HIVDB/ClinVar seeds)
KNOWN_DR_POSITIONS = {
    "HIV-1":      {65, 74, 75, 101, 103, 106, 115, 116, 151, 184, 190, 215, 219, 41, 67, 70, 210, 215, 219},
    "SARS-CoV-2": {501, 484, 417, 452, 614, 681},
    "Influenza-A": {275, 119, 292, 222, 226},
}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class CompareRequest(BaseModel):
    query_path: str
    reference_url: Optional[str] = None
    reference_path: Optional[str] = None

# ---------------------------------------------------------------------------
# Helper: Parse a FASTA or FASTQ file with Biopython SeqIO
# ---------------------------------------------------------------------------
def _parse_sequence(file_path: str) -> tuple[str, str]:
    """
    Returns (sequence_string, header_line).
    Reads raw text first then parses via StringIO to avoid Biopython 1.87+
    fasta-pearson format auto-detection issues.
    """
    ext = file_path.lower()
    is_fastq = ext.endswith((".fastq", ".fq"))

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()

    # Normalize line endings
    raw = raw.replace("\r\n", "\n").replace("\r", "\n")

    try:
        fmt = "fastq" if is_fastq else "fasta"
        handle = io.StringIO(raw)
        records = list(SeqIO.parse(handle, fmt))
        if records:
            return str(records[0].seq).upper(), records[0].description
    except Exception:
        pass

    # Manual FASTA fallback — always works for >header / sequence files
    lines = raw.strip().splitlines()
    header = ""
    seq_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith(">"):
            if not header:
                header = line[1:]
        elif header or not line.startswith(">"):
            seq_lines.append(line)

    if seq_lines:
        return "".join(seq_lines).upper(), header

    # Last resort: treat file as raw bases
    return "".join(raw.split()).upper(), "unknown"


def _parse_sequence_from_text(text: str) -> tuple[str, str]:
    """Parse FASTA text fetched from NCBI into (seq, header)."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    try:
        handle = io.StringIO(text)
        records = list(SeqIO.parse(handle, "fasta"))
        if records:
            return str(records[0].seq).upper(), records[0].description
    except Exception:
        pass

    # Manual fallback
    lines = text.strip().splitlines()
    header = ""
    seq_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith(">"):
            if not header:
                header = line[1:]
        elif header:
            seq_lines.append(line)

    if seq_lines:
        return "".join(seq_lines).upper(), header

    raise ValueError("Could not parse FASTA from remote source")


# ---------------------------------------------------------------------------
# Helper: Detect virus from FASTA header
# ---------------------------------------------------------------------------
def _detect_organism(header: str) -> str:
    """
    Match header tokens against known organisms.
    Returns organism key like 'HIV-1', 'SARS-CoV-2', or 'Unknown'.
    """
    h = header.upper()
    patterns = {
        "HIV-1":       ["HIV-1", "HIV1", "HIV", "HUMAN IMMUNODEFICIENCY VIRUS 1", "NC_001802"],
        "HIV-2":       ["HIV-2", "HIV2", "HUMAN IMMUNODEFICIENCY VIRUS 2", "NC_001722"],
        "SARS-CoV-2":  ["SARS-COV-2", "SARS2", "COVID", "NC_045512", "SEVERE ACUTE"],
        "Influenza-A": ["INFLUENZA A", "H1N1", "H3N2", "NC_002016"],
        "Influenza-B": ["INFLUENZA B", "NC_002204"],
        "Hepatitis-B": ["HEPATITIS B", "HBV", "NC_003977"],
        "Hepatitis-C": ["HEPATITIS C", "HCV", "NC_004102"],
        "Dengue-1":    ["DENGUE", "DENV", "NC_001477"],
        "Ebola":       ["EBOLA", "EBOV", "NC_002549"],
        "Monkeypox":   ["MONKEYPOX", "MPXV", "NC_063383"],
    }
    for organism, tokens in patterns.items():
        if any(t in h for t in tokens):
            return organism
    return "Unknown"

# ---------------------------------------------------------------------------
# Helper: Lookup reference genome from PostgreSQL (with fallback)
# ---------------------------------------------------------------------------
def _get_reference_info(organism: str) -> dict:
    conn = _get_db_conn()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT ncbi_accession, gene_map FROM reference_genomes WHERE organism = %s LIMIT 1",
                    (organism,)
                )
                row = cur.fetchone()
                if row:
                    return {"accession": row[0], "gene_map": row[1] or {}}
        except Exception as e:
            print(f"[WARN] DB gene_map lookup failed: {e}")
        finally:
            conn.close()

    # Fallback to in-process library
    return BUILTIN_REFERENCES.get(organism, {"accession": None, "gene_map": {}})

# ---------------------------------------------------------------------------
# Helper: GC content of a window around a position
# ---------------------------------------------------------------------------
def _gc_context(seq: str, pos: int, window: int = 10) -> float:
    start = max(0, pos - window)
    end = min(len(seq), pos + window)
    region = seq[start:end]
    if not region:
        return 0.5
    gc = sum(1 for b in region if b in "GC")
    return round(gc / len(region), 3)

# ---------------------------------------------------------------------------
# Helper: Codon position (0, 1, or 2) relative to CDS
# ---------------------------------------------------------------------------
def _codon_position(genomic_pos: int, gene_map: dict) -> int:
    for gene, (start, end) in gene_map.items():
        if start <= genomic_pos <= end:
            return (genomic_pos - start) % 3
    return 2  # Outside known CDS → synonymous codon pos

# ---------------------------------------------------------------------------
# Helper: Is position in a functional domain?
# ---------------------------------------------------------------------------
def _in_domain(genomic_pos: int, gene_map: dict) -> tuple[bool, str]:
    for gene, (start, end) in gene_map.items():
        if start <= genomic_pos <= end:
            return True, gene
    return False, "Intergenic"

# ---------------------------------------------------------------------------
# Helper: Fetch reference from NCBI eUtils
# ---------------------------------------------------------------------------
def _fetch_ncbi(accession_or_url: str) -> tuple[str, str]:
    """Returns (sequence_string, description)"""
    # Extract accession from URL if needed
    acc = accession_or_url
    nc_match = re.search(r"NC_[\d.]+", accession_or_url)
    if nc_match:
        acc = nc_match.group(0)

    ncbi_api = (
        f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        f"?db=nuccore&id={acc}&rettype=fasta&retmode=text"
    )
    resp = requests.get(ncbi_api, timeout=30)
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"NCBI fetch failed for {acc}")
    return _parse_sequence_from_text(resp.text)

# ---------------------------------------------------------------------------
# Core endpoint
# ---------------------------------------------------------------------------
@app.post("/compare")
async def compare_sequences(req: CompareRequest):
    try:
        # ── 1. Load sequences ──────────────────────────────────────────────
        ref_seq, ref_header = "", ""
        query_seq, query_header = "", ""

        if req.reference_url and "http" in req.reference_url:
            ref_seq, ref_header = _fetch_ncbi(req.reference_url)
        elif req.reference_path:
            if not os.path.exists(req.reference_path):
                raise HTTPException(status_code=404, detail="Reference file not found")
            ref_seq, ref_header = _parse_sequence(req.reference_path)
        else:
            raise HTTPException(status_code=400, detail="Provide reference_url or reference_path")

        if not os.path.exists(req.query_path):
            raise HTTPException(status_code=404, detail="Query file not found")
        query_seq, query_header = _parse_sequence(req.query_path)

        if not ref_seq or not query_seq:
            raise HTTPException(status_code=400, detail="One or both sequences are empty")

        # ── 2. Detect and validate organism match ──────────────────────────
        query_organism = _detect_organism(query_header)
        ref_organism = _detect_organism(ref_header)

        # Cross-species validation: prevent analyzing e.g. HIV against COVID reference
        if query_organism != "Unknown" and ref_organism != "Unknown" and query_organism != ref_organism:
            raise HTTPException(
                status_code=400, 
                detail=f"Organism mismatch detected. You are trying to align an {query_organism} sequence against a {ref_organism} reference genome. This is scientifically invalid."
            )

        query_len = len(query_seq)
        ref_len = len(ref_seq)
        max_len = max(query_len, ref_len)
        
        # Length-based cross-species fallback validation
        if max_len > 0 and abs(query_len - ref_len) / max_len > 0.30:
            raise HTTPException(
                status_code=400,
                detail=f"Organism mismatch detected. The query sequence ({query_len:,} bp) and reference ({ref_len:,} bp) differ in size by more than 30%. You are likely comparing completely different organisms."
            )

        # Prefer query header, fall back to ref header
        detected_organism = query_organism if query_organism != "Unknown" else ref_organism

        # ── 3. Get gene map ────────────────────────────────────────────────
        gene_map_raw = _get_reference_info(detected_organism)["gene_map"]
        gene_map: dict[str, tuple[int, int]] = {}
        for gene, coords in gene_map_raw.items():
            if isinstance(coords, (list, tuple)) and len(coords) == 2:
                gene_map[gene] = (int(coords[0]), int(coords[1]))

        # ── 4. Needleman-Wunsch global gapped alignment ────────────────────
        # Window to 15,000 bp to avoid OOM on massive genomes
        MAX_BP = 15_000
        ref_aln = ref_seq[:MAX_BP]
        qry_aln = query_seq[:MAX_BP]

        aligner = PairwiseAligner()
        aligner.mode = "global"
        aligner.match_score = 2
        aligner.mismatch_score = -1
        aligner.open_gap_score = -2
        aligner.extend_gap_score = -0.5

        alignments = aligner.align(ref_aln, qry_aln)
        best = alignments[0]
        alignment_score = float(best.score)

        # Extract the two aligned strings (with gap characters)
        lines = format(best, "fasta").splitlines()
        aligned_ref = lines[1].strip()
        aligned_qry = lines[3].strip()

        # ── 5. Extract mutations (SNPs + Indels) ──────────────────────────
        dr_positions = KNOWN_DR_POSITIONS.get(detected_organism, set())

        mutations = []
        indels = []
        genomic_ref_pos = 0  # tracks position on the *original* reference
        matches = 0
        total_aligned = 0

        mutations_features = []
        
        for ref_char, qry_char in zip(aligned_ref, aligned_qry):
            is_ref_gap = ref_char == "-"
            is_qry_gap = qry_char == "-"

            if not is_ref_gap:
                genomic_ref_pos += 1

            if ref_char == qry_char:
                matches += 1
                total_aligned += 1
                continue

            total_aligned += 1

            if is_ref_gap:
                # Insertion in query
                indels.append({
                    "type": "insertion",
                    "position": genomic_ref_pos,
                    "query_base": qry_char,
                })
                continue

            if is_qry_gap:
                # Deletion in query
                indels.append({
                    "type": "deletion",
                    "position": genomic_ref_pos,
                    "reference_base": ref_char,
                })
                continue

            # SNP
            is_purine = lambda b: b in "AG"
            is_pyrimidine = lambda b: b in "CT"
            is_transition = (is_purine(ref_char) and is_purine(qry_char)) or \
                            (is_pyrimidine(ref_char) and is_pyrimidine(qry_char))

            gc = _gc_context(ref_aln, genomic_ref_pos - 1)
            cp = _codon_position(genomic_ref_pos, gene_map)
            in_dom, domain_name = _in_domain(genomic_ref_pos, gene_map)
            is_dr = genomic_ref_pos in dr_positions

            mutations_features.append((is_transition, False, gc, cp, in_dom, is_dr))

            mutations.append({
                "position": genomic_ref_pos,
                "reference": ref_char,
                "query": qry_char,
                "type": "Transition" if is_transition else "Transversion",
                "severity": "low",
                "ai_confidence": 0.0,
                "gc_context": gc,
                "functional_region": domain_name,
                "in_functional_domain": in_dom,
                "drug_resistance_site": is_dr,
                "codon_position": cp,
            })

        # Batch predict SNP mutations
        if mutations_features:
            snp_preds = predict_severity_batch(mutations_features)
            for i, p in enumerate(snp_preds):
                mutations[i]["severity"] = p[0]
                mutations[i]["ai_confidence"] = p[1]

        # Score Indels with the RF too
        indels_features = []
        for indel in indels:
            pos = indel["position"]
            in_dom, domain_name = _in_domain(pos, gene_map)
            is_dr = pos in dr_positions
            gc = _gc_context(ref_aln, pos - 1)
            cp = _codon_position(pos, gene_map)
            indels_features.append((False, True, gc, cp, in_dom, is_dr))
            indel.update({
                "severity": "low",
                "ai_confidence": 0.0,
                "functional_region": domain_name,
                "in_functional_domain": in_dom,
                "drug_resistance_site": is_dr,
            })

        if indels_features:
            indel_preds = predict_severity_batch(indels_features)
            for i, p in enumerate(indel_preds):
                indels[i]["severity"] = p[0]
                indels[i]["ai_confidence"] = p[1]

        match_percentage = round((matches / total_aligned * 100) if total_aligned > 0 else 0.0, 2)

        return {
            "match_percentage": match_percentage,
            "alignment_score": alignment_score,
            "detected_organism": detected_organism,
            "query_length": len(query_seq),
            "reference_length": len(ref_seq),
            "aligned_length": total_aligned,
            "mutations_found": mutations[:200],
            "indels_found": indels[:100],
            "analysis_metadata": {
                "model": "RandomForest-v1",
                "algorithm": "Needleman-Wunsch",
                "gene_map_used": list(gene_map.keys()),
                "max_bp_window": MAX_BP,
                "ref_header": ref_header[:120],
                "query_header": query_header[:120],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
