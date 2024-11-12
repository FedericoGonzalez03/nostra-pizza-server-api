import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import http from 'http';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.disable('x-powered-by');
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // ssl: {
    //     rejectUnauthorized: false,
    // },
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos', err);
    } else {
        console.log('Conectado a PostgreSQL');
    }
    release();
});

const httpsOptions = {
    key: fs.readFileSync(process.env.KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH),
    passphrase: process.env.KEY_PASS,
};

// https.createServer(httpsOptions, app).listen(PORT, () => {
//     console.log('HTTPS server listening on port ' + PORT);
// });

http.createServer(app).listen(PORT, () => {
    console.log('HTTP server listening on port ' + PORT);
});

// app.listen(PORT, () => {
//     console.log('Server listening on port ' + PORT);
// });

app.get('/menu', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        const result = await pool.query('SELECT *, \'12\' AS prueba FROM menu WHERE upper(name) ILIKE $1 OR upper(description) ILIKE $1', [`%${search.toUpperCase()}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener el menú', err);
        res.status(500).send('Error al obtener el menú');
    }
});

app.post('/menu', async (req, res) => {
    try {
        const { name, description, price, available, image } = req.body;
        await pool.query('INSERT INTO menu (name, description, price, available, image, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [name, description, price, available, image, new Date()]);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error al agregar un producto al menú', req.body, err);
        res.status(500).send('Error al agregar el producto al menú');
    }
});

app.put('/menu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, available, image } = req.body;
        await pool.query('UPDATE menu SET name = $1, description = $2, price = $3, available = $4, image = $5 WHERE id = $6', [name, description, price, available, image, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar el menú', req.body, err);
        res.status(500).send('Error al actualizar el menú');
    }
});

app.delete('/menu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM menu WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un producto del menú', err);
        res.status(500).send('Error al eliminar el producto del menú');
    }
});

app.get('/flavours', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        const result = await pool.query('SELECT * FROM flavour WHERE upper(flavour_name) ILIKE $1', [`%${search.toUpperCase()}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los gustos', err);
        res.status(500).send('Error al obtener los gustos');
    }
});

app.post('/flavours', async (req, res) => {
    try {
        const { flavour_name, available, flavour_group_id } = req.body;
        await pool.query('INSERT INTO flavour (flavour_name, available, flavour_group_id) VALUES ($1, $2, $3)', [flavour_name, available, flavour_group_id]);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error al agregar un gusto', req.body, err);
        res.status(500).send('Error al agregar el gusto');
    }
});

app.put('/flavours/:id', async (req, res) => {
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

app.delete('/flavours/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM flavour WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un gusto', err);
        res.status(500).send('Error al eliminar el gusto');
    }
});

app.get('/flavours/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM flavour_group');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los grupos de gustos', err);
        res.status(500).send('Error al obtener los grupos de gustos');
    }
});

app.post('/flavours/groups', async (req, res) => {
    try {
        const { grp_title } = req.body;
        await pool.query('INSERT INTO flavour_group (grp_title) VALUES ($1)', [grp_title]);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error al agregar un grupo de gustos', req.body, err);
        res.status(500).send('Error al agregar el grupo de gustos');
    }
});

app.put('/flavours/groups/:id', async (req, res) => {
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

app.delete('/flavours/groups/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM flavour_group WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un grupo de gustos', err);
        res.status(500).send('Error al eliminar el grupo de gustos');
    }
});

app.get('/menu/flavours/:id', async (req, res) => {
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
        console.error('Error al obtener los gustos', err);
        res.status(500).send('Error al obtener los gustos');
    }
});

app.post('/menu/flavours', async (req, res) => {
    try {
        for (const mfg of req.body) {
            const { menu_id, flavour_grp_id, max_quantity } = mfg;
            await pool.query('INSERT INTO menu_flavour_group (menu_id, flavour_grp_id, max_quantity) VALUES ($1, $2, $3)', [menu_id, flavour_grp_id, max_quantity]);
        }
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error al agregar un gusto al menú', req.body, err);
        res.status(500).send('Error al agregar el gusto al menú');
    }
});

app.put('/menu/flavours/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM menu_flavour_group WHERE menu_id = $1', [id]);
        for (const mfg of req.body) {
            const { menu_id, flavour_grp_id, max_quantity } = mfg;
            await pool.query('INSERT INTO menu_flavour_group (menu_id, flavour_grp_id, max_quantity) VALUES ($1, $2, $3)', [menu_id, flavour_grp_id, max_quantity]);
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al actualizar el gusto del menú', req.body, err);
        res.status(500).send('Error al actualizar el gusto del menú');
    }
});