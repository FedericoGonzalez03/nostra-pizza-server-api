import express from 'express';
import { pool } from './index.js';
import createCustomLogger from './logger.mjs';

const router = express.Router();
const logger = createCustomLogger('menu');

router.get('/', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        const result = await pool.query('SELECT * FROM menu WHERE upper(name) ILIKE $1 OR upper(description) ILIKE $1', [`%${search.toUpperCase()}%`]);
        if (result.rows.length === 0) {
            logger.warn(`No se encontró en el menú: '${search}'`);
            return res.status(200).json([]);
        }
        res.status(200).json(result.rows);
    } catch (err) {
        logger.error('Error al obtener el menú', err);
        res.status(500).send('Error al obtener el menú');
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, price, available, image } = req.body;
        const result = await pool.query('INSERT INTO menu (name, description, price, available, image, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [name, description, price, available, image, new Date()]);
        logger.info(`Menu item added with ID: ${result.rows[0].id}`);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        logger.error('Error al agregar un producto al menú', req.body, err);
        res.status(500).send('Error al agregar el producto al menú');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, available, image } = req.body;
        await pool.query('UPDATE menu SET name = $1, description = $2, price = $3, available = $4, image = $5 WHERE id = $6', [name, description, price, available, image, id]);
        logger.info(`Menu item with ID: ${id} updated`);
        res.status(200).json({ success: true });
    } catch (err) {
        logger.error('Error al actualizar el menú', req.body, err);
        res.status(500).send('Error al actualizar el menú');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM menu WHERE id = $1', [id]);
        logger.info(`Menu item with ID: ${id} deleted`);
        res.status(200).json({ success: true });
    } catch (err) {
        logger.error('Error al eliminar un producto del menú', err);
        res.status(500).send('Error al eliminar el producto del menú');
    }
});

router.get('/flavours/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            `SELECT mfg.max_quantity AS quantity, fg.grp_title AS grp_title, f.id AS flv_id, f.flavour_name AS name, f.available AS available 
             FROM menu_flavour_group mfg
             JOIN flavour_group fg ON mfg.flavour_grp_id = fg.id
             JOIN flavour f ON fg.id = f.flavour_group_id
             WHERE mfg.menu_id = $1`,
            [id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        logger.error('Error al obtener los gustos', err);
        res.status(500).send('Error al obtener los gustos');
    }
});

router.post('/flavours', async (req, res) => {
    try {
        for (const mfg of req.body) {
            const { menu_id, flavour_grp_id, max_quantity } = mfg;
            await pool.query('INSERT INTO menu_flavour_group (menu_id, flavour_grp_id, max_quantity) VALUES ($1, $2, $3)', [menu_id, flavour_grp_id, max_quantity]);
        }
        logger.info(`Flavours added to menu item ID: ${req.body[0].menu_id}`);
        res.status(201).json({ success: true });
    } catch (err) {
        logger.error('Error al agregar un gusto al menú', req.body, err);
        res.status(500).send('Error al agregar el gusto al menú');
    }
});

router.put('/flavours/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM menu_flavour_group WHERE menu_id = $1', [id]);
        for (const mfg of req.body) {
            const { menu_id, flavour_grp_id, max_quantity } = mfg;
            await pool.query('INSERT INTO menu_flavour_group (menu_id, flavour_grp_id, max_quantity) VALUES ($1, $2, $3)', [menu_id, flavour_grp_id, max_quantity]);
        }
        logger.info(`Flavours updated for menu item ID: ${id}`);
        res.status(200).json({ success: true });
    } catch (err) {
        logger.error('Error al actualizar el gusto del menú', req.body, err);
        res.status(500).send('Error al actualizar el gusto del menú');
    }
});

export default router;