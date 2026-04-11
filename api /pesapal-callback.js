// /api/pesapal-callback.js
export default async function handler(req, res) {
    const { OrderTrackingId, OrderMerchantReference, Status, PaymentStatusDescription } = req.query;
    
    if (Status === 'COMPLETED') {
        // Verify payment status with PesaPal
        const isValid = await verifyPayment(OrderTrackingId);
        
        if (isValid) {
            const { supabase } = require('../lib/supabase');
            
            // Get pending registration
            const { data: payment } = await supabase
                .from('payments')
                .select('registration_data')
                .eq('order_id', OrderMerchantReference)
                .single();
            
            // Upload image if exists (from previous step)
            let imageUrl = '';
            // Retrieve from temporary storage or user re-uploads
            
            // Complete registration
            const registrationData = payment.registration_data;
            await supabase.from('registrations').insert({
                first_name: registrationData.first_name,
                last_name: registrationData.last_name,
                email: registrationData.email,
                contact: registrationData.phone_number,
                province: registrationData.province,
                district: registrationData.district,
                sector: registrationData.sector,
                parish: registrationData.parish,
                report_image_url: imageUrl,
                payment_status: 'completed',
                payment_reference: OrderTrackingId,
                registered_at: new Date().toISOString()
            });
            
            // Update payment record
            await supabase
                .from('payments')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('order_id', OrderMerchantReference);
            
            // Send confirmation email
            await sendConfirmation(registrationData.email, OrderTrackingId);
            
            // Redirect to success page
            res.redirect(302, 'https://your-vercel-domain.vercel.app/success.html');
        }
    }
    
    // If payment failed, redirect to failure page
    res.redirect(302, 'https://your-vercel-domain.vercel.app/failed.html');
}

async function verifyPayment(orderTrackingId) {
    const token = await getPesapalToken();
    const response = await fetch(
        `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    const data = await response.json();
    return data.status === 'COMPLETED' && data.payment_status === 'PAID';
}
