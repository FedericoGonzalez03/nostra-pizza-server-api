import express from 'express';
import { pool } from './index.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        const result = await pool.query('SELECT * FROM flavour WHERE upper(flavour_name) ILIKE $1', [`%${search.toUpperCase()}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los gustos', err);
        res.status(500).send('Error al obtener los gustos');
    }
});

router.post('/', async (req, res) => {
    try {
        const { flavour_name, available, flavour_group_id } = req.body;
        const result = await pool.query('INSERT INTO flavour (flavour_name, available, flavour_group_id) VALUES ($1, $2, $3) RETURNING id', [flavour_name, available, flavour_group_id]);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('Error al agregar un gusto', req.body, err);
        res.status(500).send('Error al agregar el gusto');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { flavour_name, available, flavour_group_id } = req.body;
        await pool.query('UPDATE flavour SET flavour_name = $1, available = $2, flavour_group_id = $3 WHERE id = $4', [flavour_name, available, flavour_group_id, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar el gusto', req.body, err);
        res.status(500).send('Error al actualizar el gusto');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM flavour WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un gusto', err);
        res.status(500).send('Error al eliminar el gusto');
    }
});

router.get('/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM flavour_group');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los grupos de gustos', err);
        res.status(500).send('Error al obtener los grupos de gustos');
    }
});

router.post('/groups', async (req, res) => {
    try {
        const { grp_title } = req.body;
        const result = await pool.query('INSERT INTO flavour_group (grp_title) VALUES ($1) RETURNING id', [grp_title]);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('Error al agregar un grupo de gustos', req.body, err);
        res.status(500).send('Error al agregar el grupo de gustos');
    }
});

router.put('/groups/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { grp_title } = req.body;
        await pool.query('UPDATE flavour_group SET grp_title = $1 WHERE id = $2', [grp_title, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar el grupo de gustos', req.body, err);
        res.status(500).send('Error al actualizar el grupo de gustos');
    }
});

router.delete('/groups/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM flavour_group WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un grupo de gustos', err);
        res.status(500).send('Error al eliminar el grupo de gustos');
    }
});

export default router;
