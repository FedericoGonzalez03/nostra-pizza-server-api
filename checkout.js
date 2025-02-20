import express from 'express';
import fetch from 'node-fetch';
import createCustomLogger from './logger.mjs';

const router = express.Router();

const logger = createCustomLogger('checkout'); 

const genIdempotency = () => {
    return Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
};

router.post('/mp/card_token', async (req, res) => {
    try {
        const { card_number, security_code, card_expiration_month, card_expiration_year } = req.body;
        const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                card_number,
                security_code,
                expiration_month: card_expiration_month,
                expiration_year: card_expiration_year,
                cardholder: {
                    name: 'APRO',
                }
            }),
        });
        const data = await response.json();
        if (data.status !== 21) {
            throw new Error(data.message);
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).send('Error al crear el token de la tarjeta ' + JSON.stringify(err));
    }
});

router.post('/mp/customer', async (req, res) => {
    try {
        const { email, first_name, last_name } = req.body;
        const response = await fetch('https://api.mercadopago.com/v1/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                email,
                first_name,
                last_name
            }),
        });
        const data = await response.json();
        if (data.status !== 201) {
            throw new Error(data.message);
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).send('Error al crear el cliente ' + JSON.stringify(err));
    }
});

router.post('/mp/customer/:customer_id/card', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const { token } = req.body;
        const response = await fetch(`https://api.mercadopago.com/v1/customers/${customer_id}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (data.status !== 201) {
            throw new Error(data.message);
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).send('Error al agregar la tarjeta ' + JSON.stringify(err));
    }
});

router.post('/mp', async (req, res) => {
    try {
        console.log('Payment', response);
        res.status(200).json({ id: response.id });
    } catch (err) {
        res.status(500).send('Error al crear la preferencia ' + JSON.stringify(err));
    }
});

router.post('/mp/webhook', async (req, res) => {
    console.log('Webhook MP', req.body);
    try {
        const { id } = req.body.data;
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: {
                Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 
            }
        });
        const data = await response.json();
        console.log(data);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error al procesar el webhook', req.body, err);
        res.status(500).send('Error al procesar el webhook');
    }
});

router.post('/dlocal', async (req, res) => {
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
                notification_url: `${process.env.THIS_SERVER_URL}/checkout/dlocal/webhook`,
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

router.post('/dlocal/webhook', async (req, res) => {
    console.log('Webhook DLocal', req.body);
    try {
        const { payment_id } = req.body;
        const response = await fetch(
            `https://api-sbx.dlocalgo.com/payments/${payment_id}`,
            {
                method: 'GET',
                headers: {
                    'X-Version': '2.1',
                    accept: 'application/json',
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

export default router;
