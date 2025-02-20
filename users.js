import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from './index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.status(200).json({ success: true, userId: user.id });
    } catch (err) {
        console.error('Error during login', err);
        res.status(500).send('Error during login');
    }
});

router.post('/signup', async (req, res) => {
    const { name, email, phone, password } = req.body;
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    pool.query('INSERT INTO users (name, email, phone, password_hash, google_id, is_guest, created_at, is_admin) VALUES ($1, $2, $3, $4, null, false, now(), false) RETURNING id', [name, email, phone, passwordHash], (err, result) => {
        if (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Email already in use' });
            }
            console.error('Error al registrar un usuario', err);
            res.status(500).send('Error al registrar el usuario');
        } else {
            res.status(201).json({ success: true, id: result.rows[0].id });
        }
    });
});

router.post('/signup/google', async (req, res) => {
    const { name, email, phone, google_id } = req.body;
    pool.query('INSERT INTO users (name, email, phone, password_hash, google_id, is_guest, created_at, is_admin) VALUES ($1, $2, $3, null, $4, false, now(), false) RETURNING id', [name, email, phone, google_id], (err, result) => {
        if (err) {
            console.error('Error al registrar un usuario', err);
            res.status(500).send('Error al registrar el usuario');
        } else {
            res.status(201).json({ success: true, id: result.rows[0].id });
        }
    });
});

router.get('/', (req, res) => {
    pool.query('SELECT * FROM users', (err, result) => {
        if (err) {
            console.error('Error al obtener los usuarios', err);
            res.status(500).send('Error al obtener los usuarios');
        } else {
            res.status(200).json(result.rows);
        }
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    pool.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
        if (err) {
            console.error('Error al obtener el usuario', err);
            res.status(500).send('Error al obtener el usuario');
        } else if (result.rows.length === 0) {
            res.status(404).send('User not found');
        } else {
            res.status(200).json(result.rows[0]);
        }
    });
});

router.get('/google/:id', (req, res) => {
    const id = req.params.id;
    pool.query('SELECT * FROM users WHERE google_id = $1', [id], (err, result) => {
        if (err) {
            console.error('Error al obtener el usuario', err);
            res.status(500).send('Error al obtener el usuario');
        } else if (result.rows.length === 0) {
            res.status(404).send('User not found');
        } else {
            res.status(200).json(result.rows[0]);
        }
    });
});

router.get('/addresses/:user_id', (req, res) => {
    const id = req.params.user_id;
    pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [id], (err, result) => {
        if (err) {
            console.error('Error al obtener las direcciones', err);
            res.status(500).send('Error al obtener las direcciones');
        } else {
            res.status(200).json(result.rows);
        }
    });
});

router.post('/addresses', async (req, res) => {
    try {
        const { title, user_id, address, additional_references, latitude, longitude } = req.body;
        const result = await pool.query(
            'INSERT INTO user_addresses (title, user_id, address, additional_references, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [title, user_id, address, additional_references, latitude, longitude]
        );
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('Error al agregar una dirección de usuario', req.body, err);
        res.status(500).send('Error al agregar la dirección de usuario');
    }
});

router.put('/addresses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { title, address, additional_references, latitude, longitude } = req.body;
        await pool.query('UPDATE user_addresses SET title = $1, address = $2, additional_references = $3, latitude = $4, longitude = $5 WHERE id = $6', [title, address, additional_references, latitude, longitude, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar la dirección de usuario', req.body, err);
        res.status(500).send('Error al actualizar la dirección de usuario');
    }
});

router.delete('/addresses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM user_addresses WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar una dirección de usuario', err);
        res.status(500).send('Error al eliminar la dirección de usuario');
    }
});

export default router;
