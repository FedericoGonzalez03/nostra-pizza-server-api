import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import http from 'http';
import createCustomLogger from './logger.mjs';

dotenv.config();

const logger = createCustomLogger('boot');

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
    ssl: {
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true',
        ca: fs.readFileSync(process.env.DB_CA_PATH).toString() ?? null,
    },
});

pool.connect((err, client, release) => {
    if (err) {
        logger.error('Error al conectar a la base de datos', err);
        throw err;
    }
    client.query("SELECT VERSION()", [], function (err, result) {
        if (err) throw err;
        logger.info(result.rows[0].version);
    });
    logger.info('Conectado a PostgreSQL');
    release();
});

const httpsOptions = {
    key: fs.readFileSync(process.env.KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH),
    passphrase: process.env.KEY_PASS,
};

// https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
//     logger.info('HTTPS server listening on port ' + PORT);
// });

http.createServer(app).listen(PORT, '0.0.0.0', () => {
    logger.info('HTTP server listening on port ' + PORT);
});

// app.listen(PORT, () => {
//     logger.info('Server listening on port ' + PORT);
// });

import checkoutRoutes from './checkout.js';
import userRoutes from './users.js';
import menuRoutes from './menu.js';
import flavourRoutes from './flavours.js';
import orderRoutes from './orders.js';

app.use('/checkout', checkoutRoutes);
app.use('/users', userRoutes);
app.use('/menu', menuRoutes);
app.use('/flavours', flavourRoutes);
app.use('/orders', orderRoutes);

export { pool };
