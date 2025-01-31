/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify  
    it under the terms of the GNU Affero General Public License as published by  
    the Free Software Foundation, either version 3 of the License, or  
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,  
    but WITHOUT ANY WARRANTY; without even the implied warranty of  
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License  
    along with this program. If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/

import { pool } from './mysql.mjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const progressBar = (current, total, barLength = 30) => {
  const progress = Math.round((current / total) * barLength);
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(progress) + '▒'.repeat(barLength - progress);
  return `[${bar}] ${percentage}% (${current}/${total})`;
};

const createDatabase = async () => {
  const tempPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`${colors.green}✓ Database '${process.env.DB_NAME}' created/verified${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to create database: ${error.message}${colors.reset}`);
    throw error;
  } finally {
    await tempPool.end();
  }
};

const createMigrationsTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getAppliedMigrations = async () => {
  const [rows] = await pool.execute('SELECT name FROM migrations');
  return rows.map(row => row.name);
};

const loadQueriesFromFile = () => {
  const sqlPath = join(__dirname, '..', 'database.sql');
  const sqlContent = readFileSync(sqlPath, 'utf8');
  
  // Extract CREATE TABLE statements more accurately
  return sqlContent
    .match(/CREATE TABLE[\s\S]*?(?=CREATE TABLE|$)/g)
    .map(query => query.trim())
    .filter(query => query.length > 0);
};

const applyMigration = async (migration, current, total) => {
  try {
    const statements = loadQueriesFromFile();
    console.log(`${colors.blue}ℹ Creating ${statements.length} tables${colors.reset}`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        // Extract table name from CREATE TABLE statement
        const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/i)?.[1] || 'unknown';
        process.stdout.write('\r' + progressBar(i + 1, statements.length) + ` Creating table: ${tableName}`);
        await pool.execute(statement);
      }
    }
    
    process.stdout.write('\n');

    // Initialize automod settings
    console.log(`${colors.blue}ℹ Initializing automod settings${colors.reset}`);
    const automodSettings = [
      ['filter_enabled', 'true', 'Activar/desactivar el sistema de automod', 'general', 'boolean'],
      ['max_mentions', '5', 'Máximo de menciones permitidas por mensaje', 'limits', 'number'],
      ['max_lines', '10', 'Máximo de líneas permitidas por mensaje', 'limits', 'number'],
      ['max_duplicates', '3', 'Máximo de mensajes duplicados permitidos', 'limits', 'number'],
      ['warn_threshold', '3', 'Número de advertencias antes de tomar acción', 'actions', 'number'],
      ['timeout_duration', '300', 'Duración del timeout en segundos', 'actions', 'number'],
      ['exempt_roles', '[]', 'IDs de roles exentos del automod', 'general', 'json'],
      ['blocked_words', '[]', 'Lista de palabras bloqueadas', 'filters', 'json'],
      ['url_allowlist', '[]', 'Lista blanca de URLs permitidas', 'filters', 'json'],
      ['spam_sensitivity', '3', 'Nivel de sensibilidad anti-spam (1-5)', 'limits', 'number'],
      ['caps_percentage', '70', 'Porcentaje máximo de mayúsculas permitido', 'limits', 'number'],
      ['enable_antiflood', 'true', 'Activar protección contra flood', 'filters', 'boolean'],
      ['flood_time_window', '5', 'Ventana de tiempo para detectar flood (segundos)', 'limits', 'number'],
      ['flood_message_count', '5', 'Número de mensajes para detectar flood', 'limits', 'number'],
      ['punishment_escalation', 'true', 'Escalar castigos por infracciones repetidas', 'actions', 'boolean']
    ];

    for (const [name, value, description, category, type] of automodSettings) {
      await pool.execute(
        'INSERT IGNORE INTO automod_settings (setting_name, setting_value, setting_description, category, setting_type) VALUES (?, ?, ?, ?, ?)',
        [name, value, description, category, type]
      );
    }
    
    await pool.execute('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
    console.log(`${colors.green}✓ Migration completed: ${migration.name}${colors.reset}`);
  } catch (error) {
    process.stdout.write('\n');
    console.error(`${colors.red}✗ Error applying migration ${migration.name}: ${error}${colors.reset}`);
    throw error;
  }
};

const migrations = [
  {
    name: '001_initial_schema',
    sql: 'create_tables'
  }
];

const runMigrations = async () => {
  try {
    // Create database first
    await createDatabase();

    // Test database connection first
    await pool.getConnection().then(conn => {
      console.log(`${colors.green}✓ Database connection successful${colors.reset}`);
      conn.release();
    });

    await createMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.name));
    
    if (pendingMigrations.length === 0) {
      console.log(`${colors.blue}ℹ No pending migrations${colors.reset}`);
      return;
    }

    console.log(`${colors.blue}ℹ Found ${pendingMigrations.length} pending migrations${colors.reset}`);
    
    for (let i = 0; i < pendingMigrations.length; i++) {
      await applyMigration(pendingMigrations[i], i + 1, pendingMigrations.length);
    }
    
    process.stdout.write('\n');
    console.log(`${colors.green}✓ All migrations completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Database connection failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

console.log(`${colors.blue}ℹ Loading migrations from database.sql${colors.reset}`);
runMigrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });

export default runMigrations;