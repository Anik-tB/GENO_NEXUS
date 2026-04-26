const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://geno:geno@localhost:5432/genonexus' });
const userId = 'e053b148-4353-4465-a7d6-5b45e3d35051';

async function seed() {
  await client.connect();
  const res1 = await client.query('INSERT INTO dna_files (user_id, file_name, file_size, file_type, storage_path, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [userId, 'Outbreak_Strain_Alpha.fasta', 1048576, 'fasta', '/storage/outbreak', 'completed']);
  const id1 = res1.rows[0].id;
  
  const res2 = await client.query('INSERT INTO dna_files (user_id, file_name, file_size, file_type, storage_path, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [userId, 'Patient_Zero_Genome.vcf', 2048576, 'vcf', '/storage/patient', 'completed']);
  const id2 = res2.rows[0].id;
  
  await client.query('INSERT INTO comparison_results (query_file_id, reference_file_id, match_percentage, status) VALUES ($1, $2, $3, $4)', [id1, id2, 98.5, 'completed']);
  
  console.log('Mock data seeded!');
  await client.end();
}

seed().catch(console.error);
