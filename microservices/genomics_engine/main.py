from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
import io
from Bio import pairwise2
from Bio.Seq import Seq

app = FastAPI()

class CompareRequest(BaseModel):
    query_path: str
    reference_url: str

@app.post("/compare")
async def compare_sequences(req: CompareRequest):
    try:
        # 1. Fetch Reference Sequence
        ref_id = "NC_045512.2" 
        if "NC_" in req.reference_url:
            ref_id = req.reference_url.split("NC_")[1].split("?")[0]
            ref_id = "NC_" + ref_id
            
        ncbi_api = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id={ref_id}&rettype=fasta&retmode=text"
        resp = requests.get(ncbi_api)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch reference from NCBI")
            
        ref_fasta = resp.text.split("\n")[1:] 
        ref_seq = "".join(ref_fasta).replace("\n", "").replace("\r", "")

        # 2. Read Local Query Sequence
        if not os.path.exists(req.query_path):
            raise HTTPException(status_code=404, detail="Query file not found")
            
        with open(req.query_path, "r") as f:
            query_lines = f.readlines()
            if len(query_lines) > 0 and query_lines[0].startswith(">"):
                query_seq = "".join([l.strip() for l in query_lines[1:]])
            else:
                query_seq = "".join([l.strip() for l in query_lines])

        # 3. Biopython Alignment
        # For demonstration purposes and to prevent server OOM on massive genomes, 
        # we will align the first 2000 base pairs.
        ref_sub = ref_seq[:2000]
        query_sub = query_seq[:2000]

        if len(ref_sub) == 0 or len(query_sub) == 0:
            raise HTTPException(status_code=400, detail="Invalid sequence data")

        alignments = pairwise2.align.globalxx(ref_sub, query_sub)
        best_alignment = alignments[0]
        
        match_score = best_alignment.score
        seq_length = max(len(ref_sub), len(query_sub))
        match_percentage = (match_score / seq_length) * 100 if seq_length > 0 else 0

        # Naive mutation detection
        mutations = []
        for i in range(len(best_alignment.seqA)):
            ref_base = best_alignment.seqA[i]
            query_base = best_alignment.seqB[i]
            if ref_base != query_base:
                mutations.append({
                    "position": i + 1,
                    "reference": ref_base,
                    "query": query_base
                })
        
        return {
            "match_percentage": round(match_percentage, 2),
            "mutations_found": mutations[:100] 
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
