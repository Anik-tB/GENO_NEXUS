-- ============================================================================
-- Migration: 002_genomics_engine_v2.sql
-- Adds: reference_genomes, known_mutations tables
--       + new columns on comparison_results
-- ============================================================================

-- Reference genome library
CREATE TABLE IF NOT EXISTS reference_genomes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organism         TEXT NOT NULL UNIQUE,      -- 'HIV-1', 'SARS-CoV-2', ...
  ncbi_accession   TEXT NOT NULL,             -- 'NC_001802.1'
  common_name      TEXT,
  genome_length    INTEGER,
  gene_map         JSONB,                     -- {"gag":[790,2292],"pol":[2085,5096],...}
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_genomes_organism ON reference_genomes(organism);

-- Known/curated mutation library (seed from HIVDB, ClinVar, etc.)
CREATE TABLE IF NOT EXISTS known_mutations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organism              TEXT NOT NULL,
  position              INTEGER NOT NULL,
  reference_base        TEXT NOT NULL,
  query_base            TEXT NOT NULL,
  severity              TEXT NOT NULL CHECK (severity IN ('high','medium','low')),
  functional_annotation TEXT,
  clinical_significance TEXT,
  drug_resistance       BOOLEAN NOT NULL DEFAULT false,
  source                TEXT,                 -- 'HIVDB','ClinVar','Manual'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_known_mut_organism ON known_mutations(organism, position);

-- Extend comparison_results with new v2 columns
ALTER TABLE comparison_results ADD COLUMN IF NOT EXISTS detected_organism   TEXT;
ALTER TABLE comparison_results ADD COLUMN IF NOT EXISTS alignment_score     NUMERIC(12,2);
ALTER TABLE comparison_results ADD COLUMN IF NOT EXISTS indels_found        JSONB;
ALTER TABLE comparison_results ADD COLUMN IF NOT EXISTS analysis_metadata   JSONB;

-- ============================================================================
-- Seed data: Reference Genomes
-- ============================================================================
INSERT INTO reference_genomes (organism, ncbi_accession, common_name, genome_length, gene_map)
VALUES
  ('HIV-1',       'NC_001802.1', 'Human Immunodeficiency Virus 1',     9181,
   '{"gag":[790,2292],"pol":[2085,5096],"env":[6225,8795],"rev":[5970,6045],"tat":[5831,6045],"nef":[8797,9417]}'),
  ('HIV-2',       'NC_001722.1', 'Human Immunodeficiency Virus 2',     9671,
   '{"gag":[777,2277],"pol":[2073,5087]}'),
  ('SARS-CoV-2',  'NC_045512.2', 'Severe Acute Respiratory Syndrome Coronavirus 2', 29903,
   '{"ORF1ab":[266,21555],"S":[21563,25384],"E":[26245,26472],"M":[26523,27191],"N":[28274,29533]}'),
  ('Influenza-A', 'NC_002016.1', 'Influenza A Virus (H1N1)',           2280,
   '{"HA":[1,1779],"NA":[1,1410]}'),
  ('Influenza-B', 'NC_002204.1', 'Influenza B Virus',                  2313,
   '{"HA":[1,1841]}'),
  ('Hepatitis-B', 'NC_003977.2', 'Hepatitis B Virus',                  3182,
   '{"S":[155,835],"C":[1816,2454],"P":[2307,3182]}'),
  ('Hepatitis-C', 'NC_004102.1', 'Hepatitis C Virus',                  9646,
   '{"E1":[914,1490],"E2":[1490,2579],"NS5B":[7601,9374]}'),
  ('Dengue-1',    'NC_001477.1', 'Dengue Virus 1',                     10735,
   '{"E":[937,2421]}'),
  ('Ebola',       'NC_002549.1', 'Ebola Virus',                        18959,
   '{"GP":[6039,8068],"NP":[469,2689]}'),
  ('Monkeypox',   'NC_063383.1', 'Monkeypox Virus',                    197209,
   '{}')
ON CONFLICT (organism) DO UPDATE
  SET ncbi_accession = EXCLUDED.ncbi_accession,
      common_name    = EXCLUDED.common_name,
      genome_length  = EXCLUDED.genome_length,
      gene_map       = EXCLUDED.gene_map;

-- ============================================================================
-- Seed data: Known High-Severity Mutations (HIV-1 HIVDB key sites)
-- ============================================================================
INSERT INTO known_mutations (organism, position, reference_base, query_base, severity, functional_annotation, clinical_significance, drug_resistance, source)
VALUES
  ('HIV-1', 65,  'A', 'G', 'high', 'pol/RT',      'K65R — major NRTI resistance',                  true,  'HIVDB'),
  ('HIV-1', 70,  'A', 'G', 'medium','pol/RT',     'K70R — NRTI intermediate resistance',           true,  'HIVDB'),
  ('HIV-1', 103, 'A', 'G', 'high', 'pol/RT',      'K103N — primary NNRTI resistance',              true,  'HIVDB'),
  ('HIV-1', 184, 'A', 'G', 'high', 'pol/RT',      'M184V — high-level 3TC/FTC resistance',         true,  'HIVDB'),
  ('HIV-1', 215, 'A', 'C', 'high', 'pol/RT',      'T215Y/F — thymidine analogue mutation (TAM)',   true,  'HIVDB'),
  ('HIV-1', 190, 'G', 'A', 'high', 'pol/RT',      'G190A — NNRTI resistance, reduced suscept.',    true,  'HIVDB'),
  ('HIV-1', 41,  'A', 'T', 'medium','pol/RT',     'M41L — TAM1 pathway',                           true,  'HIVDB'),
  ('HIV-1', 74,  'T', 'A', 'medium','pol/RT',     'L74V — ddI/abacavir reduced susceptibility',    true,  'HIVDB'),
  ('HIV-1', 501, 'A', 'T', 'high', 'env/gp120',   'N501Y — receptor binding domain change',        false, 'Manual'),

  ('SARS-CoV-2', 501, 'A', 'T', 'high', 'S/RBD', 'N501Y — ACE2 binding affinity increase (Alpha/Beta/Gamma/Delta)', false, 'ClinVar'),
  ('SARS-CoV-2', 484, 'G', 'A', 'high', 'S/RBD', 'E484K — immune evasion signature',              false, 'ClinVar'),
  ('SARS-CoV-2', 417, 'A', 'C', 'high', 'S/RBD', 'K417T/N — Beta/Gamma variant signature',        false, 'ClinVar'),
  ('SARS-CoV-2', 614, 'A', 'G', 'medium','S',     'D614G — fitness enhancement',                   false, 'ClinVar'),
  ('SARS-CoV-2', 681, 'C', 'T', 'high', 'S/FCS',  'P681H/R — furin cleavage site (Delta/Omicron)', false, 'ClinVar')
ON CONFLICT DO NOTHING;
