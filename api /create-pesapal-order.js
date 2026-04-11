// /api/create-pesapal-order.js
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { first_name, last_name, email, phone_number, amount, currency, payment_method } = req.body;
    
    // Generate unique order ID
    const orderId = `KABGAYI-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    // Get PesaPal authentication token
    const authToken = await getPesapalToken();
    
    // Create order request
    const orderData = {
        id: orderId,
        currency: currency,
        amount: amount,
        description: "Kabgayi Music School Registration Fee",
        callback_url: "https://your-vercel-domain.vercel.app/api/pesapal-callback",
        notification_id: "YOUR_NOTIFICATION_ID", // Get from PesaPal dashboard
        billing_address: {
            email_address: email,
            phone_number: phone_number,
            first_name: first_name,
            last_name: last_name,
            country_code: "RW"
        },
        line_items: [
            {
                name: "Music School Registration",
                quantity: 1,
                unit_price: amount,
                total_amount: amount
            }
        ]
    };
    
    // Submit to PesaPal
    const pesapalResponse = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
    });
    
    const result = await pesapalResponse.json();
    
    // Store order in Supabase
    const { supabase } = require('../lib/supabase');
    await supabase.from('payments').insert({
        order_id: orderId,
        transaction_id: result.transaction_id,
        amount: amount,
        email: email,
        phone: phone_number,
        status: 'pending',
        registration_data: req.body,
        created_at: new Date().toISOString()
    });
    
    res.status(200).json({ 
        redirect_url: result.redirect_url,
        transaction_id: result.transaction_id,
        order_id: orderId
    });
}

async function getPesapalToken() {
    const auth = Buffer.from(
        `${process.env.PESAPAL_CONSUMER_KEY}:${process.env.PESAPAL_CONSUMER_SECRET}`
    ).toString('base64');
    
    const response = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
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
    
    const data = await response.json();
    return data.token;
}
