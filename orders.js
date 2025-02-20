import express from 'express';
import { pool } from './index.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { customer_name, customer_phone, customer_address, order } = req.body;
        const result = await pool.query('INSERT INTO orders (customer_name, customer_phone, customer_address, order, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id', [customer_name, customer_phone, customer_address, order, new Date()]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error al agregar un pedido', req.body, err);
        res.status(500).send('Error al agregar el pedido');
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los pedidos', err);
        res.status(500).send('Error al obtener los pedidos');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).send('Order not found');
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener el pedido', err);
        res.status(500).send('Error al obtener el pedido');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar el pedido', req.body, err);
        res.status(500).send('Error al actualizar el pedido');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un pedido', err);
        res.status(500).send('Error al eliminar el pedido');
    }
});

export default router;
