const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://geno:geno@localhost:5432/genonexus'});

pool.query(`SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles;`)
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(e => { console.error('Error:', e.message); pool.end(); });
