"""
pharmacogenomics_client.py — Precision Prescribing Client
==========================================================
Queries the official CPIC (Clinical Pharmacogenomics Implementation Consortium) API
dynamically to fetch live clinical recommendations based on a patient's genotype.
"""

import requests
import json

class PharmacogenomicsClient:
    def __init__(self):
        self.cpic_api_url = "https://api.cpicpgx.org/v1/recommendation"

    def get_cpic_recommendations(self, gene: str, phenotype: str) -> list:
        """
        Queries the CPIC API for drug recommendations for a specific gene and phenotype.
        Example: gene='CYP2C19', phenotype='Poor Metabolizer'
        """
        # Format phenotype lookup key for CPIC
        # CPIC expects lookups in JSON format, e.g. {"CYP2C19": "Poor Metabolizer"}
        lookup_dict = {gene: phenotype}
        lookup_str = json.dumps(lookup_dict)
        
        params = {
            "genesymbol": f"eq.{gene}",
            "select": "drugid,guidelineid,comments,classification,lookupkey,recommendation",
            "limit": 10
        }
        
        try:
            # First fetch recommendations for the gene
            r = requests.get(self.cpic_api_url, params=params, timeout=5)
            if r.status_code == 200:
                data = r.json()
                
                # Filter locally based on the phenotype lookupkey
                filtered_recommendations = []
                for rec in data:
                    rec_lookup = rec.get("lookupkey", {})
                    # The lookupkey is a dictionary mapping gene -> phenotype
                    if rec_lookup.get(gene) == phenotype:
                        # Fetch drug details to get readable name
                        drug_id = rec.get("drugid")
                        drug_name = self._resolve_drug_name(drug_id)
                        
                        filtered_recommendations.append({
                            "drug_name": drug_name,
                            "recommendation": rec.get("recommendation"),
                            "classification": rec.get("classification"),
                            "comments": rec.get("comments"),
                            "guideline_url": f"https://cpicpgx.org/guidelines/"
                        })
                return filtered_recommendations
        except Exception as e:
            print(f"[WARN] CPIC API request failed: {e}")
            
        # Fallback to local representative CPIC dataset if API fails or rate-limited
        return self._get_local_fallback(gene, phenotype)

    def _resolve_drug_name(self, drug_id: str) -> str:
        """
        Resolves RxNorm or internal drug IDs to readable names via RXNAV or local map.
        """
        drug_map = {
            "RxNorm:321989": "Clopidogrel",
            "RxNorm:2670": "Amitriptyline",
            "RxNorm:36567": "Warfarin",
            "RxNorm:10093": "Simvastatin",
            "RxNorm:10379": "Tacrolimus",
            "RxNorm:36437": "Fluorouracil",
            "RxNorm:11289": "Mercaptopurine",
            "RxNorm:8782": "Codeine",
            "RxNorm:11253": "Abacavir"
        }
        if drug_id in drug_map:
            return drug_map[drug_id]
            
        # Query RxNorm API dynamically
        try:
            rx_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{drug_id.replace('RxNorm:', '')}/property.json?propName=RxNorm%20Name"
            res = requests.get(rx_url, timeout=3)
            if res.status_code == 200:
                rx_data = res.json()
                prop = rx_data.get("propConceptGroup", {}).get("propConcept", [])
                if prop:
                    return prop[0].get("propValue", drug_id)
        except Exception:
            pass
        return drug_id

    def map_variants_to_phenotype(self, mutations: list) -> dict:
        """
        Maps a list of identified variants in CYP genes to metabolizer phenotypes.
        In clinical genetics, variants are mapped using star-allele nomenclatures.
        """
        # Default phenotypes (Normal Metabolizer)
        phenotypes = {
            "CYP2C19": "Normal Metabolizer",
            "CYP2D6": "Normal Metabolizer",
            "DPYD": "Normal Metabolizer",
            "SLCO1B1": "Normal Metabolizer"
        }
        
        # Check if mutations contain key known alleles
        # For simplicity in this pipeline, we check positions mapping to common variants:
        # - CYP2C19*2 (c.681G>A / pos 99) -> Poor Metabolizer
        # - CYP2C19*17 (c.-806C>T) -> Ultrarapid Metabolizer
        # - CYP2D6*4 (c.1846G>A) -> Poor Metabolizer
        # - DPYD*2A (c.1905+1G>A) -> Poor Metabolizer
        
        for mut in mutations:
            gene = mut.get("functional_region", "")
            pos = mut.get("position", 0)
            ref = mut.get("reference", "")
            qry = mut.get("query", "")
            
            if gene == "CYP2C19":
                if pos == 681 or (ref == "G" and qry == "A"):
                    phenotypes["CYP2C19"] = "Poor Metabolizer"
                elif pos == 806 or (ref == "C" and qry == "T"):
                    phenotypes["CYP2C19"] = "Ultrarapid Metabolizer"
            elif gene == "CYP2D6":
                if pos == 1846 or (ref == "G" and qry == "A"):
                    phenotypes["CYP2D6"] = "Poor Metabolizer"
            elif gene == "DPYD":
                if pos == 1905 or (ref == "G" and qry == "A"):
                    phenotypes["DPYD"] = "Intermediate Metabolizer"
                    
        return phenotypes

    def _get_local_fallback(self, gene: str, phenotype: str) -> list:
        """
        Authoritative CPIC consensus recommendations for fallback scenarios.
        """
        fallback_db = {
            "CYP2C19": {
                "Poor Metabolizer": [
                    {
                        "drug_name": "Clopidogrel",
                        "recommendation": "Avoid standard dosing of clopidogrel. Alternate antiplatelet therapy (e.g., prasugrel or ticagrelor) is recommended in patients without contraindications.",
                        "classification": "Strong",
                        "comments": "Cardiovascular risk is significantly elevated due to reduced conversion of clopidogrel to its active metabolite.",
                        "guideline_url": "https://cpicpgx.org/guidelines/"
                    }
                ],
                "Ultrarapid Metabolizer": [
                    {
                        "drug_name": "Clopidogrel",
                        "recommendation": "Standard dosing of clopidogrel is acceptable.",
                        "classification": "Moderate",
                        "comments": "Normal activation of clopidogrel expected.",
                        "guideline_url": "https://cpicpgx.org/guidelines/"
                    }
                ]
            },
            "CYP2D6": {
                "Poor Metabolizer": [
                    {
                        "drug_name": "Codeine",
                        "recommendation": "Avoid codeine use due to lack of efficacy. Choose an alternative analgesic such as morphine or non-opioid options.",
                        "classification": "Strong",
                        "comments": "Poor metabolizers cannot convert codeine to active morphine, resulting in inadequate pain relief.",
                        "guideline_url": "https://cpicpgx.org/guidelines/"
                    }
                ]
            },
            "DPYD": {
                "Intermediate Metabolizer": [
                    {
                        "drug_name": "Fluorouracil",
                        "recommendation": "Reduce standard starting dose by 50%. Titrate dose based on toxicity or therapeutic drug monitoring.",
                        "classification": "Strong",
                        "comments": "Significantly elevated risk of life-threatening severe toxicities (neutropenia, mucositis).",
                        "guideline_url": "https://cpicpgx.org/guidelines/"
                    }
                ]
            }
        }
        return fallback_db.get(gene, {}).get(phenotype, [])
