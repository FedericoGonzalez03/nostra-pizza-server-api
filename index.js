import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({limit: '50mb'}));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

/*
const params = [
    {
        id: 1,
        cedula: "53769841",
        nombre: "Federico González",
        email: "fedegonzalez@bcu.gub.uy",
        tipo_pago: 1,
        costo: 1,
        detalle: "Pago de servicios",
    },
    {
        id: 2,
        cedula: "53769841",
        nombre: "Federico González",
        email: "fedegonzalez@bcu.gub.uy",
        tipo_pago: 2,
        costo: 1321.48,
        detalle: "Pago viaje a Miami",
    },
    {
        id: 3,
        cedula: "53769841",
        nombre: "Federico González",
        email: "fedegonzalez@bcu.gub.uy",
        tipo_pago: 1,
        costo: 3,
        detalle: "Pago de servicios a ANTEL",
    },
    {
        id: 4,
        cedula: "53769841",
        nombre: "Federico González",
        email: "fedegonzalez@bcu.gub.uy",
        tipo_pago: 2,
        costo: 102,
        detalle: "Pago de viaje a Buenos Aires",
    },
];

app.get('/params', (req, res) => {
    const id_solicitud = req.query.id_solicitud;
    console.log("Se recibió el siguiente request: " + id_solicitud);
    const param = params.find(param => param.id == id_solicitud);
    res.json(param);
});

app.post('/status', (req, res) => {
    console.log("Se recibió el siguiente estado: " + req.body.status);
    res.sendStatus(200);
});

*/

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nostrapizza',
    user: 'nostrapizza',
    password: 'nostrapizza',
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos', err);
    } else {
        console.log('Conectado a PostgreSQL');
    }
});


app.get('/menu', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        console.log('Buscando:', search);
        const result = await pool.query('SELECT * FROM menu WHERE upper(name) ILIKE $1 OR upper(description) ILIKE $1', [`%${search.toUpperCase()}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener el menú', err);
        res.status(500).send('Error al obtener el menú');
    }
});

app.get('/flavours/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            `SELECT mfg.max_quantity AS quantity, fg.grp_title AS grp_title, f.id AS flv_id8, f.flavour_name AS name, f.available AS available 
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

app.post('/menu', async (req, res) => {
    try {
        const { name, description, price, available, image } = req.body;
        await pool.query('INSERT INTO menu (name, description, price, available, image) VALUES ($1, $2, $3, $4, $5)', [name, description, price, available, image]);
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