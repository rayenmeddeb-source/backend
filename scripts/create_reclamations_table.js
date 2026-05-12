const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function readEnvFile(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    });

  return Object.fromEntries(entries);
}

async function main() {
  const envPath = path.join(process.cwd(), '.env');
  const env = readEnvFile(envPath);

  const client = new Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS reclamations (
      id SERIAL PRIMARY KEY,
      auteur_type VARCHAR(20) NOT NULL CHECK (auteur_type IN ('client','prestataire')),
      auteur_id INT NOT NULL,
      sujet VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      statut VARCHAR(30) NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente','En cours','Résolue','Rejetée')),
      reponse_admin TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.end();
  console.log('reclamations table created or already exists');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
