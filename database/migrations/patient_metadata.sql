-- Migration 003: Add patient metadata to dna_files
-- This enables real-world clinical risk calculations (CanRisk/BOADICEA)
-- by storing patient profile alongside each uploaded genomic file.

ALTER TABLE dna_files
  ADD COLUMN IF NOT EXISTS patient_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN dna_files.patient_metadata IS
  'Optional JSON payload storing patient clinical profile used for oncology risk modelling.
   Schema: { age: int, biological_sex: "male"|"female", family_history: { first_degree_relatives_with_breast_cancer: int, first_degree_relatives_with_ovarian_cancer: int } }';
