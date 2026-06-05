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
  8. Real-time WebSocket hub for collaboration (Live Activity Stream)
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
import requests
import os
import io
import re
import json
import asyncio
import random
import time
import psycopg2
from typing import Optional, List
from dataclasses import dataclass, field
from Bio import SeqIO
from Bio.Align import PairwiseAligner

from virus_classifier import predict_severity, predict_severity_batch
from canrisk_client import PatientProfile, FamilyHistory, calculate_boadicea_risk

app = FastAPI(title="GenoNexus Engine v2", version="2.0.0")

# ===========================================================================
# Real-Time Collaboration WebSocket Hub
# ===========================================================================

_MEMBER_POOL = [
    {"id": "AI", "name": "Nexus Copilot", "role": "AI Engine v3.2",         "color": "#06b6d4"},
]

_VIEWINGS = [
    "BRCA1 VCF Cohort", "WGS Pipeline Config", "Global Mutation Index",
    "Patient Batch 12", "Alignment Report", "Variant Dashboard",
]

_STREAM_POOL = []

_INITIAL_STREAMS = []

_INITIAL_PIPELINES = []

_uid_counter = 80000
def _next_id() -> int:
    global _uid_counter
    _uid_counter += 1
    return _uid_counter


class CollabState:
    """In-process shared collaboration state (single-server, in-memory)."""
    def __init__(self):
        import copy
        self.streams: list = list(_INITIAL_STREAMS)
        self.pipelines: list = [dict(p) for p in _INITIAL_PIPELINES]
        self.members: list = [
            {"id": m["id"], "name": m["name"], "role": m["role"], "color": m["color"],
             "status": "online" if m["id"] == "AI" else "offline",
             "viewing": _VIEWINGS[i % len(_VIEWINGS)], "typing": False}
            for i, m in enumerate(_MEMBER_POOL)
        ]
        self._stream_pool_idx = 0

    def tick_pipelines(self):
        changed = False
        for pipe in self.pipelines:
            if pipe["status"] == "running" and pipe["progress"] < 100:
                inc = random.randint(1, 3)
                pipe["progress"] = min(100, pipe["progress"] + inc)
                
                # Mock realistic logs based on progress
                if pipe["progress"] == 20:
                    pipe["logs"].append("QC passed. Removing adapters...")
                elif pipe["progress"] == 40:
                    pipe["logs"].append("Aligning reads to reference genome...")
                elif pipe["progress"] == 60:
                    pipe["logs"].append("Variant calling in progress (HaplotypeCaller)...")
                elif pipe["progress"] == 80:
                    pipe["logs"].append("Filtering low quality SNPs...")
                    pipe["logs"].append("Detected potential mutations. Annotating...")

                if pipe["progress"] >= 100:
                    pipe["status"] = "completed"
                    pipe["eta"] = None
                    pipe["logs"].append("Pipeline completed successfully. Generated final report.")
                    
                    # Generate mock results
                    organism = "SARS-CoV-2" if "SARS" in pipe["name"] else ("HIV-1" if "HIV" in pipe["name"] else "Human")
                    pipe["result"] = {
                        "organism": organism,
                        "mutations": [
                            {"position": random.randint(100, 5000), "reference": "A", "query": "G", "type": "Transition", "severity": "high", "gene": "Env"},
                            {"position": random.randint(5000, 10000), "reference": "C", "query": "T", "type": "Transition", "severity": "medium", "gene": "Pol"},
                            {"position": random.randint(10000, 15000), "reference": "G", "query": "C", "type": "Transversion", "severity": "low", "gene": "Gag"}
                        ]
                    }
                else:
                    eta_min = max(0, (100 - pipe["progress"]) // 2)
                    pipe["eta"] = f"{eta_min} min"
                # Update stages
                n = len(pipe["stages"])
                for i, stage in enumerate(pipe["stages"]):
                    threshold = ((i + 1) / n) * 100
                    if pipe["progress"] >= threshold:
                        stage["status"] = "done"
                    elif pipe["progress"] >= threshold - (100 / n):
                        stage["status"] = "active"
                changed = True
        return changed

    def tick_presence(self):
        # AI is always online, no typing. Humans are managed by WS.
        for m in self.members:
            if m["id"] == "AI":
                m["status"] = "online"
                m["typing"] = False
            if m["status"] == "offline":
                m["typing"] = False

    def set_online(self, member_id: str, member_data: dict = None):
        found = False
        for m in self.members:
            if m["id"] == member_id:
                m["status"] = "online"
                found = True
                break
        if not found and member_data:
            self.members.append({
                "id": member_id,
                "name": member_data.get("name", "Unknown"),
                "role": member_data.get("role", "Researcher"),
                "color": member_data.get("color", "#10b981"),
                "status": "online",
                "viewing": "",
                "typing": False
            })
                
    def set_offline(self, member_id: str):
        for m in self.members:
            if m["id"] == member_id:
                m["status"] = "offline"
                m["typing"] = False

    def add_stream_entry(self) -> dict:
        if not _STREAM_POOL:
            return None
        src = _STREAM_POOL[self._stream_pool_idx % len(_STREAM_POOL)]
        self._stream_pool_idx += 1
        entry = {"id": _next_id(), "ts": int(time.time() * 1000), **src}
        self.streams = [entry] + self.streams[:49]
        return entry

    def post_note(self, author: str, text: str, note_type: str) -> dict:
        entry = {
            "id": _next_id(),
            "ts": int(time.time() * 1000),
            "type": note_type,
            "author": author,
            "desc": text,
        }
        self.streams = [entry] + self.streams[:49]
        return entry

    def apply_pipeline_action(self, pipeline_id: str, action: str):
        if action == "spawn":
            name = None
            conn = _get_db_conn()
            if conn:
                try:
                    with conn.cursor() as cur:
                        cur.execute("SELECT file_name FROM dna_files ORDER BY created_at DESC LIMIT 1")
                        row = cur.fetchone()
                        if row and row[0]:
                            # Strip extension if any
                            base = row[0].rsplit(".", 1)[0]
                            name = f"{base} Pipeline"
                except Exception as e:
                    print(f"Failed to fetch latest file: {e}")
                finally:
                    conn.close()

            if not name:
                names = ["SARS-CoV-2 Variant Calling", "HIV-1 Resistance Analysis", "BRCA1 Mutation Calling", "Influenza-A Strain Typing"]
                name = random.choice(names)
                
            new_pipe = {
                "id": f"pipe-{_next_id()}",
                "name": name,
                "status": "running",
                "progress": 0,
                "eta": "15 min",
                "logs": [f"Initializing {name} pipeline...", "Starting Quality Control..."],
                "stages": [
                    {"name": "QC", "status": "active"},
                    {"name": "Align", "status": "pending"},
                    {"name": "Call", "status": "pending"},
                    {"name": "Filter", "status": "pending"},
                    {"name": "Annotate", "status": "pending"},
                ]
            }
            self.pipelines.insert(0, new_pipe)
            return

        for pipe in self.pipelines:
            if pipe["id"] == pipeline_id:
                if action == "pause":
                    pipe["status"] = "paused"
                elif action == "resume":
                    pipe["status"] = "running"
                elif action == "stop":
                    pipe["status"] = "failed"
                break

    def snapshot(self) -> dict:
        return {
            "streams": self.streams,
            "pipelines": self.pipelines,
            "members": self.members,
        }


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []
        self.ws_to_member: dict[WebSocket, str] = {}

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> Optional[str]:
        if ws in self.active:
            self.active.remove(ws)
        return self.ws_to_member.pop(ws, None)

    async def broadcast(self, msg: dict):
        data = json.dumps(msg)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send(self, ws: WebSocket, msg: dict):
        try:
            await ws.send_text(json.dumps(msg))
        except Exception:
            self.disconnect(ws)


collab_state = CollabState()
manager = ConnectionManager()


async def _background_ticker():
    """Server-driven ticks — pushes presence, pipeline, and stream updates to all clients."""
    stream_tick = 0
    presence_tick = 0
    while True:
        await asyncio.sleep(3)

        # Pipeline progress every 3s
        if collab_state.tick_pipelines():
            await manager.broadcast({"type": "pipeline_update", "pipelines": collab_state.pipelines})

        # Presence/typing every ~4s (every other 3s tick, randomised)
        presence_tick += 1
        if presence_tick >= 2 and random.random() < 0.6:
            collab_state.tick_presence()
            # We don't need to broadcast presence_update on a timer anymore unless typing changes
            # But we can keep it to clear typing states
            await manager.broadcast({"type": "presence_update", "members": collab_state.members})
            presence_tick = 0

        # New stream entry every 8–14s
        stream_tick += 3
        if stream_tick >= random.randint(8, 14):
            entry = collab_state.add_stream_entry()
            if entry:
                await manager.broadcast({"type": "stream_add", "entry": entry})
            stream_tick = 0


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_background_ticker())


@app.websocket("/ws/collab")
async def collab_ws(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send full snapshot to the new client immediately
        await manager.send(ws, {"type": "snapshot", "state": collab_state.snapshot()})
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")

            if mtype == "join":
                member_id = msg.get("memberId")
                member_data = msg.get("memberData")
                if member_id:
                    manager.ws_to_member[ws] = member_id
                    collab_state.set_online(member_id, member_data)
                    await manager.broadcast({"type": "presence_update", "members": collab_state.members})

            elif mtype == "invite_member":
                member_data = msg.get("memberData")
                if member_data and "id" in member_data:
                    collab_state.set_online(member_data["id"], member_data)
                    await manager.broadcast({"type": "presence_update", "members": collab_state.members})

            elif mtype == "post_note":
                entry = collab_state.post_note(
                    author=msg.get("author", "You"),
                    text=msg.get("text", ""),
                    note_type=msg.get("noteType", "note"),
                )
                await manager.broadcast({"type": "stream_add", "entry": entry})

            elif mtype == "typing":
                member_id = msg.get("memberId", "")
                typing = bool(msg.get("typing", False))
                for m in collab_state.members:
                    if m["id"] == member_id:
                        m["typing"] = typing
                        break
                await manager.broadcast({"type": "presence_update", "members": collab_state.members})

            elif mtype == "pipeline_action":
                collab_state.apply_pipeline_action(
                    pipeline_id=msg.get("pipelineId", ""),
                    action=msg.get("action", ""),
                )
                await manager.broadcast({"type": "pipeline_update", "pipelines": collab_state.pipelines})

    except WebSocketDisconnect:
        member_id = manager.disconnect(ws)
        if member_id and not any(m == member_id for m in manager.ws_to_member.values()):
            collab_state.set_offline(member_id)
            asyncio.create_task(manager.broadcast({"type": "presence_update", "members": collab_state.members}))

# ===========================================================================
# Real-Time Private Chat WebSocket Hub
# ===========================================================================
class ChatConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.active_connections[user_id] = ws

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

chat_manager = ChatConnectionManager()

@app.websocket("/ws/chat/{user_id}")
async def chat_ws(ws: WebSocket, user_id: str):
    await chat_manager.connect(ws, user_id)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")
            if mtype == "private_message":
                receiver_id = msg.get("receiver_id")
                
                # Save to database
                conn = _get_db_conn()
                db_msg_id = None
                if conn:
                    try:
                        with conn.cursor() as cur:
                            cur.execute(
                                "INSERT INTO private_messages (sender_id, receiver_id, content, file_url, file_type) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                                (user_id, receiver_id, msg.get("content"), msg.get("file_url"), msg.get("file_type"))
                            )
                            db_msg_id = cur.fetchone()[0]
                            conn.commit()
                    except Exception as e:
                        print(f"[WARN] Failed to save private message: {e}")
                    finally:
                        conn.close()

                out_msg = {
                    "type": "private_message",
                    "id": db_msg_id or str(_next_id()),
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": msg.get("content"),
                    "file_url": msg.get("file_url"),
                    "file_type": msg.get("file_type"),
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                }
                
                await chat_manager.send_personal_message(out_msg, receiver_id)
                if receiver_id != user_id:
                    await chat_manager.send_personal_message(out_msg, user_id)
            
            elif mtype == "typing":
                receiver_id = msg.get("receiver_id")
                out_msg = {
                    "type": "typing",
                    "sender_id": user_id,
                    "typing": msg.get("typing", False)
                }
                await chat_manager.send_personal_message(out_msg, receiver_id)

    except WebSocketDisconnect:
        chat_manager.disconnect(user_id)

# ===========================================================================

# ---------------------------------------------------------------------------
# DB helpers (reads from ENV same as Next.js)
# ---------------------------------------------------------------------------
def _get_db_conn():
    """Optional PostgreSQL connection — engine degrades gracefully if unavailable."""
    dsn = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL") or "postgresql://postgres:geno@localhost:5432/genonexus"
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
    "BRCA1 (Homo sapiens)": {"accession": "NM_007294.4", "gene_map": {"BRCA1_CDS": [1, 7224]}},
}

# Known high-severity mutation positions per organism (simplified HIVDB/ClinVar seeds)
KNOWN_DR_POSITIONS = {
    "HIV-1":      {65, 74, 75, 101, 103, 106, 115, 116, 151, 184, 190, 215, 219, 41, 67, 70, 210, 215, 219},
    "SARS-CoV-2": {501, 484, 417, 452, 614, 681},
    "Influenza-A": {275, 119, 292, 222, 226},
    "Ebola": {274, 509, 544},
}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class CompareRequest(BaseModel):
    query_path: str
    reference_url: Optional[str] = None
    reference_path: Optional[str] = None

class PredictDiseaseRequest(BaseModel):
    mutations: list[dict]
    organism: str = "Unknown"
    matchPct: float = 0.0
    patient_profile: Optional[dict] = None

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
        "BRCA1 (Homo sapiens)": ["BRCA1", "HOMO SAPIENS", "NC_000017", "NM_007294"],
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
    # Extract accession from URL if needed (handles NC_, NM_, NG_, etc.)
    acc = accession_or_url
    nc_match = re.search(r"[A-Z]{2}_[\d.]+", accession_or_url)
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

        # Prefer query header, fall back to ref header
        detected_organism = query_organism if query_organism != "Unknown" else ref_organism

        # Length-based cross-species fallback validation (skip for Human Genetics)
        if detected_organism != "BRCA1 (Homo sapiens)" and max_len > 0 and abs(query_len - ref_len) / max_len > 0.30:
            raise HTTPException(
                status_code=400,
                detail=f"Organism mismatch detected. The query sequence ({query_len:,} bp) and reference ({ref_len:,} bp) differ in size by more than 30%. You are likely comparing completely different organisms."
            )

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


@app.post("/predict_disease")
async def predict_disease(req: PredictDiseaseRequest):
    try:
        # Determine base disease from organism
        disease_map = {
            "HIV-1": "AIDS (HIV Infection)",
            "HIV-2": "AIDS (HIV Infection)",
            "SARS-CoV-2": "COVID-19",
            "Influenza-A": "Seasonal Influenza A",
            "Influenza-B": "Seasonal Influenza B",
            "Hepatitis-B": "Hepatitis B",
            "Hepatitis-C": "Hepatitis C",
            "Dengue-1": "Dengue Fever",
            "Ebola": "Ebola Virus Disease",
            "Monkeypox": "Mpox (Monkeypox)",
            "BRCA1 (Homo sapiens)": "Hereditary Breast and Ovarian Cancer Syndrome"
        }

        base_disease = disease_map.get(req.organism, "Unknown Pathogenic Infection")

        # Analyze mutations
        high_sev_count = sum(1 for m in req.mutations if m.get("severity") == "high")
        med_sev_count = sum(1 for m in req.mutations if m.get("severity") == "medium")
        dr_count = sum(1 for m in req.mutations if m.get("drug_resistance_site") is True)

        affected_genes = set()
        for m in req.mutations:
            gene = m.get("functional_region", "Intergenic")
            if gene != "Intergenic":
                affected_genes.add(gene)

        genes_str = ", ".join(affected_genes) if affected_genes else "Unknown"

        predictions = []

        # Oncology Pathway (Human Genetics)
        if req.organism == "BRCA1 (Homo sapiens)":
            # 1. Parse patient profile from request (or use default mock)
            pp_data = req.patient_profile or {}
            fh_data = pp_data.get("family_history", {})
            patient = PatientProfile(
                age=pp_data.get("age", 40),
                biological_sex=pp_data.get("biological_sex", "female"),
                family_history=FamilyHistory(
                    first_degree_relatives_with_breast_cancer=fh_data.get("first_degree_relatives_with_breast_cancer", 0),
                    first_degree_relatives_with_ovarian_cancer=fh_data.get("first_degree_relatives_with_ovarian_cancer", 0)
                )
            )

            # 2. Determine mutation status
            has_pathogenic = high_sev_count > 0
            has_vus = med_sev_count > 0
            
            # 3. Call simulated CanRisk/BOADICEA API
            boadicea_result = calculate_boadicea_risk(patient, has_pathogenic, has_vus)

            predictions.append({
                "id": "pred-breast",
                "disease": "Breast Cancer Risk (Lifetime)",
                "genes": "BRCA1",
                "severity": "high" if boadicea_result.breast_cancer_risk_percentage >= 50 else "medium" if boadicea_result.breast_cancer_risk_percentage >= 20 else "low",
                "risk": int(boadicea_result.breast_cancer_risk_percentage),
                "confidence": 95 if has_pathogenic else 80,
                "trend": "stable",
                "insight": f"CanRisk/BOADICEA: {boadicea_result.clinical_insight}"
            })

            if patient.biological_sex == "female":
                predictions.append({
                    "id": "pred-ovary",
                    "disease": "Ovarian Cancer Risk (Lifetime)",
                    "genes": "BRCA1",
                    "severity": "high" if boadicea_result.ovarian_cancer_risk_percentage >= 30 else "medium" if boadicea_result.ovarian_cancer_risk_percentage >= 10 else "low",
                    "risk": int(boadicea_result.ovarian_cancer_risk_percentage),
                    "confidence": 90 if has_pathogenic else 80,
                    "trend": "stable",
                    "insight": f"CanRisk/BOADICEA: {boadicea_result.clinical_insight}"
                })
            elif patient.biological_sex == "male":
                predictions.append({
                    "id": "pred-prostate",
                    "disease": "Prostate Cancer Risk (Lifetime)",
                    "genes": "BRCA1",
                    "severity": "high" if boadicea_result.prostate_cancer_risk_percentage >= 30 else "medium" if boadicea_result.prostate_cancer_risk_percentage >= 15 else "low",
                    "risk": int(boadicea_result.prostate_cancer_risk_percentage),
                    "confidence": 85 if has_pathogenic else 80,
                    "trend": "increasing" if patient.age > 50 else "stable",
                    "insight": "CanRisk: Pathogenic BRCA1 variants increase the lifetime risk of developing aggressive prostate cancer in male carriers." if has_pathogenic else "Baseline male screening."
                })

            if has_pathogenic or has_vus:
                predictions.append({
                    "id": "pred-pancreatic",
                    "disease": "Pancreatic Cancer Risk (Lifetime)",
                    "genes": "BRCA1",
                    "severity": "medium" if boadicea_result.pancreatic_cancer_risk_percentage >= 10 else "low",
                    "risk": int(boadicea_result.pancreatic_cancer_risk_percentage),
                    "confidence": 80,
                    "trend": "stable",
                    "insight": "CanRisk: Pathogenic alterations in BRCA1 confer a modest but clinically significant elevated risk for pancreatic adenocarcinoma."
                })

            return {"predictions": predictions}


        # 1. Primary Disease Profile (Pathogens)
        # The user logically expects that if the sequence matches the pathogenic reference genome 
        # heavily (e.g. >99%), then the "Risk" of having that disease is equally high (>99%).
        primary_risk = min(99, max(0, req.matchPct))
        primary_sev = "high" if primary_risk >= 75 else "medium" if primary_risk >= 40 else "low"
        
        insight_msg = f"Diagnostic Match: {req.matchPct}%. High sequence homology confirms a definitive {base_disease} presence."
        if primary_risk < 50:
             insight_msg = f"Diagnostic Match: {req.matchPct}%. Low sequence homology suggests an unlikely or highly divergent {base_disease} presence."

        predictions.append({
            "id": "pred-primary",
            "disease": base_disease + " Detection",
            "genes": genes_str,
            "severity": primary_sev,
            "risk": int(primary_risk),
            "confidence": 99 if req.matchPct > 80 else 70,
            "trend": "stable",
            "insight": insight_msg
        })
        
        # 2. Antimicrobial/Antiviral Resistance
        if dr_count > 0 or req.organism.startswith("HIV") or req.organism == "Ebola":
            dr_risk = min(99, 1 + (dr_count * 25) + (high_sev_count * 1))
            predictions.append({
                "id": "pred-dr",
                "disease": "Antiviral Resistance",
                "genes": genes_str,
                "severity": "high" if dr_risk >= 75 else "medium" if dr_risk >= 40 else "low",
                "risk": int(dr_risk),
                "confidence": 88 if dr_count > 0 else 70,
                "trend": "increasing" if dr_count > 2 else "stable",
                "insight": f"Detected {dr_count} mutations at known drug resistance loci. High likelihood of reduced efficacy for standard frontline antiviral therapies." if dr_count > 0 else "Baseline screening for resistance markers based on overall mutation rate."
            })

        # 3. Immune Evasion / Vaccine Escape (e.g. Spike/Env/HA genes)
        evasion_genes = {"S", "env", "HA", "E1", "E2", "GP"}
        evasion_hits = len(affected_genes.intersection(evasion_genes))
        if evasion_hits > 0 or high_sev_count > 10:
            ev_risk = min(99, 30 + (evasion_hits * 10) + (high_sev_count * 2))
            predictions.append({
                "id": "pred-evasion",
                "disease": "Immune Evasion Risk",
                "genes": ", ".join(affected_genes.intersection(evasion_genes)) if evasion_hits > 0 else genes_str,
                "severity": "high" if ev_risk >= 75 else "medium" if ev_risk >= 50 else "low",
                "risk": int(ev_risk),
                "confidence": 85,
                "trend": "increasing" if ev_risk > 60 else "stable",
                "insight": "Mutations localized in primary surface glycoproteins. Elevated risk of reduced neutralization by convalescent sera or vaccine-induced antibodies."
            })

        return {"predictions": predictions}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
