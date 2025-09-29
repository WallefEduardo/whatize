const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3500;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Company Lookup Service' });
});

// Lookup company by code
app.get('/lookup/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT backend_url, company_name FROM company_instances WHERE code = $1 AND status = true',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Código da empresa não encontrado',
        code: code
      });
    }

    const company = result.rows[0];
    res.json({
      code: code.toUpperCase(),
      backendUrl: company.backend_url,
      companyName: company.company_name
    });

  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// List all companies (for admin)
app.get('/companies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code, backend_url, company_name, status, created_at FROM company_instances ORDER BY created_at DESC'
    );

    res.json({
      companies: result.rows
    });

  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Add new company (for admin)
app.post('/companies', async (req, res) => {
  try {
    const { code, backendUrl, companyName } = req.body;

    if (!code || !backendUrl) {
      return res.status(400).json({
        error: 'Código e URL do backend são obrigatórios'
      });
    }

    const result = await pool.query(
      'INSERT INTO company_instances (code, backend_url, company_name) VALUES ($1, $2, $3) RETURNING *',
      [code.toUpperCase(), backendUrl, companyName]
    );

    res.status(201).json({
      message: 'Empresa adicionada com sucesso',
      company: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Código da empresa já existe'
      });
    }

    console.error('Add company error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Update company (for admin)
app.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { backendUrl, companyName, status } = req.body;

    if (!backendUrl) {
      return res.status(400).json({
        error: 'URL do backend é obrigatória'
      });
    }

    const result = await pool.query(
      'UPDATE company_instances SET backend_url = $1, company_name = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [backendUrl, companyName, status !== undefined ? status : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    res.json({
      message: 'Empresa atualizada com sucesso',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Delete company (for admin)
app.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM company_instances WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    res.json({
      message: 'Empresa deletada com sucesso',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Toggle company status (for admin)
app.patch('/companies/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE company_instances SET status = NOT status, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    res.json({
      message: 'Status da empresa alterado com sucesso',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lookup Service rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Lookup: http://localhost:${PORT}/lookup/{CODE}`);
});