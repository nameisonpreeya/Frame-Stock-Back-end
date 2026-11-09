const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่าเชื่อมต่อ PostgreSQL ไปยัง Supabase ด้วย Connection String[cite: 2]
const pool = new Pool({
  connectionString: process.env.SUPERBASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับการเชื่อมต่อ Supabase จากภายนอก[cite: 2]
  }
});

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มเซิร์ฟเวอร์[cite: 2]
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to Supabase PostgreSQL successfully!');
  release();
});

// 1. ดึงข้อมูลสินค้าทั้งหมด (GET)[cite: 2]
app.get('/api/frames', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM frames ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. เพิ่มข้อมูลใหม่ (POST)[cite: 2]
app.post('/api/frames', async (req, res) => {
  const { name, size, color, quantity, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO frames (name, size, color, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, size, color, quantity, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. แก้ไขข้อมูลสินค้า (PUT)[cite: 2]
app.put('/api/frames/:id', async (req, res) => {
  const { id } = req.params;
  const { name, size, color, quantity, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE frames SET name = $1, size = $2, color = $3, quantity = $4, price = $5 WHERE id = $6 RETURNING *',
      [name, size, color, quantity, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ต้องการแก้ไข' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ลบข้อมูลสินค้า (DELETE)[cite: 2]
app.delete('/api/frames/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM frames WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ต้องการลบ' });
    }
    res.json({ message: 'Deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// รันเซิร์ฟเวอร์[cite: 2]
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});