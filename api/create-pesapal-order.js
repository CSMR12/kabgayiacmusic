import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { first_name, last_name, email, phone_number, amount, payment_method } = req.body;
    
    // Get PesaPal token
    const auth = Buffer.from(
        `${process.env.PESAPAL_CONSUMER_KEY}:${process.env.PESAPAL_CONSUMER_SECRET}`
    ).toString('base64');
    
    const tokenResponse = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        })
    });
    
    const { token } = await tokenResponse.json();
    
    // Create order
    const orderResponse = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: `KAB-${Date.now()}`,
            currency: "RWF",
            amount: amount,
            description: "Kabgayi Music School Registration",
            callback_url: "https://YOUR_VERCEL_URL.vercel.app/api/pesapal-callback",
            notification_id: process.env.PESAPAL_NOTIFICATION_ID,
            billing_address: {
                email_address: email,
                phone_number: phone_number,
                first_name: first_name,
                last_name: last_name
            }
        })
    });
    
    const result = await orderResponse.json();
    res.status(200).json({ redirect_url: result.redirect_url });
}
