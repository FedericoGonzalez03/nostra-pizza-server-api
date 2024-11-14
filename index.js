import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const mercadopago = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const PORT = process.env.LISTEN_PORT || 3000;

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

// https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
//     console.log('HTTPS server listening on port ' + PORT);
// });

http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log('HTTP server listening on port ' + PORT);
});

// app.listen(PORT, () => {
//     console.log('Server listening on port ' + PORT);
// });

app.get('/menu', async (req, res) => {
    try {
        const search = req.query.search ?? '';
        const result = await pool.query('SELECT * FROM menu WHERE upper(name) ILIKE $1 OR upper(description) ILIKE $1', [`%${search.toUpperCase()}%`]);
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

app.post('/orders', async (req, res) => {
    try {
        const { customer_name, customer_phone, customer_address, order } = req.body;
        const result = await pool.query('INSERT INTO orders (customer_name, customer_phone, customer_address, order, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id', [customer_name, customer_phone, customer_address, order, new Date()]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error al agregar un pedido', req.body, err);
        res.status(500).send('Error al agregar el pedido');
    }
});

app.get('/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los pedidos', err);
        res.status(500).send('Error al obtener los pedidos');
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener el pedido', err);
        res.status(500).send('Error al obtener el pedido');
    }
});

app.put('/orders/:id', async (req, res) => {
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

app.delete('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error al eliminar un pedido', err);
        res.status(500).send('Error al eliminar el pedido');
    }
});

app.post('/checkout/mp', async (req, res) => {
    try {
        const { items } = req.body;
        const preference = new Preference(mercadopago);
        const preferenceData = {
            items: items.map((item) => {
                return {
                    title: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                };
            }),
            back_urls: {
                success: `${process.env.APP_DEEP_LINK_HOST}/success`,
                pending: `${process.env.APP_DEEP_LINK_HOST}/pending`,
                failure: `${process.env.APP_DEEP_LINK_HOST}/failure`,
            },
            auto_return: 'approved',
        };
        console.log(preferenceData);
        const response = await preference.create({ body: preferenceData });
        console.log('Preference', response);
        res.json({ id: response.id });
    } catch (err) {
        res.status(500).send('Error al crear la preferencia ' + JSON.stringify(err));
    }
});

app.post('/checkout/dlocal', async (req, res) => {
    try {
        const { amount } = req.body;
        const response = await fetch('https://api-sbx.dlocalgo.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DLOCAL_API_KEY}:${process.env.DLOCAL_SECRET_KEY}`,
            },
            body: JSON.stringify({
                description: 'Pedido Nostra Pizza',
                amount,
                currency: 'UYU',
                country: 'UY',
                notification_url: process.env.THIS_SERVER_URL + '/checkout/dlocal/webhook',
            }),
        });
        const data = await response.json();
        if (data.code) {
            throw new Error(data);
        }
        console.log('Payment', data);
        res.json({ id: data.id, url: data.redirect_url });
    } catch (err) {
        res.status(500).send('Error al crear el pago' + JSON.stringify(err));
    }
});

app.post('/checkout/mp/webhook', async (req, res) => {
    console.log('Webhook MP', req.body);
    try {
        const { body } = req;
        console.log('Webhook MP', body);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error al procesar el webhook', req.body, err);
        res.status(500).send('Error al procesar el webhook');
    }
});


app.post('/checkout/dlocal/webhook', async (req, res) => {
    console.log('Webhook DLocal', req.body);
    try {
        const { payment_id } = req.body;
        const response = await fetch(
            `https://api-sbx.dlocalgo.com/v1/payments/:payment_id${payment_id}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DLOCAL_API_KEY}:${process.env.DLOCAL_SECRET_KEY}`,
                },
            }
        );
        const data = await response.json();
        if (data.code) {
            throw new Error(data);
        }
        console.log('Webhook DLocal', data);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error al procesar el webhook', req.body, err);
        res.status(500).send('Error');
    }
});