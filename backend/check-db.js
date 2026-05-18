const { Pool } = require('pg');

const pool = new Pool({
  host: '192.168.1.66',
  port: 5432,
  database: 'equipment_nodes',
  user: 'postgres',
  password: '59Goviso' 
});

async function check() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ База данных подключена:', res.rows[0]);
    
    // Проверка наличия таблиц
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'equipment'
    `);
    console.log('📋 Таблицы в схеме equipment:', tables.rows.map(r => r.table_name));
    
  } catch (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
    console.log('\nВозможные решения:');
    console.log('1. Запустите PostgreSQL');
    console.log('2. Проверьте пароль в .env файле');
    console.log('3. Создайте базу данных equipment_db');
  }
  process.exit();
}

check();