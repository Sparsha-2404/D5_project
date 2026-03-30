const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email skipped — no credentials set');
      return;
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'D5 <noreply@d5app.com>',
      to, subject, html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
    // Never throw — email failure should not break order flow
  }
};

const header = `
  <div style="background:linear-gradient(135deg,#2E1A3C,#3A1F4F);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;background:rgba(200,168,233,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:white;font-family:Georgia,serif;">D5</div>
      <div>
        <div style="font-size:20px;font-weight:800;color:white;font-family:Georgia,serif;letter-spacing:-0.02em;">D5</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.06em;text-transform:uppercase;">Resident Portal</div>
      </div>
    </div>
  </div>
`;

const footer = `
  <div style="padding:20px 32px;text-align:center;border-top:1px solid #f1f5f9;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© D5 Resident Portal · Dubai Residences · All rights reserved</p>
    <p style="color:#94a3b8;font-size:12px;margin:6px 0 0;">This is an automated email, please do not reply.</p>
  </div>
`;

const wrap = (content) => `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    ${header}
    <div style="background:white;padding:32px;">
      ${content}
    </div>
    ${footer}
  </div>
`;

const emailTemplates = {
  orderConfirmed: (order, user) => ({
    subject: `✅ Order #${order._id.toString().slice(-8).toUpperCase()} Confirmed — D5`,
    html: wrap(`
      <h2 style="color:#2E1A3C;margin:0 0 8px;font-family:Georgia,serif;font-size:24px;">Order Confirmed! 🎉</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${user.name}, your order has been placed successfully.</p>
      <div style="background:#f3eaff;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:13px;color:#6B4F8A;font-weight:700;margin-bottom:4px;">ORDER ID</div>
        <div style="font-size:18px;font-weight:800;color:#2E1A3C;">#${order._id.toString().slice(-8).toUpperCase()}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;color:#64748b;font-size:13px;">Service Type</td>
          <td style="padding:10px 0;font-weight:700;color:#2E1A3C;font-size:13px;text-align:right;text-transform:capitalize;">${order.orderType.replace('_',' ')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;color:#64748b;font-size:13px;">Items</td>
          <td style="padding:10px 0;font-weight:600;color:#2E1A3C;font-size:13px;text-align:right;">${order.items.length} item(s)</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;color:#64748b;font-size:13px;">Payment</td>
          <td style="padding:10px 0;font-weight:600;color:#2E1A3C;font-size:13px;text-align:right;text-transform:capitalize;">${order.paymentMethod.replace('_',' ')}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b;font-size:13px;">Total</td>
          <td style="padding:10px 0;font-weight:800;color:#2E1A3C;font-size:16px;text-align:right;">AED ${order.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
      ${order.deliveryOTP ? `<div style="background:#fffbf0;border:1.5px solid #fde68a;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
        <div style="font-size:12px;color:#a16207;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Your Delivery OTP</div>
        <div style="font-size:32px;font-weight:900;color:#2E1A3C;letter-spacing:10px;font-family:monospace;">${order.deliveryOTP}</div>
        <div style="font-size:12px;color:#a16207;margin-top:8px;">Share this with the delivery staff to confirm receipt</div>
      </div>` : ''}
      <p style="color:#64748b;font-size:13px;margin:0;">You can track your order in the D5 Resident Portal.</p>
    `),
  }),

  orderStatusUpdate: (order, user, status) => ({
    subject: `📦 Order #${order._id.toString().slice(-8).toUpperCase()} — Status: ${status.replace('_',' ')} — D5`,
    html: wrap(`
      <h2 style="color:#2E1A3C;margin:0 0 8px;font-family:Georgia,serif;">Order Update</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${user.name}, your order status has been updated.</p>
      <div style="background:#f3eaff;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
        <div style="font-size:12px;color:#6B4F8A;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">NEW STATUS</div>
        <div style="font-size:22px;font-weight:800;color:#2E1A3C;text-transform:capitalize;">${status.replace('_',' ')}</div>
      </div>
      <p style="color:#64748b;font-size:13px;">Order ID: <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong></p>
    `),
  }),

  paymentSuccess: (order, user) => ({
    subject: `💳 Payment Confirmed — Order #${order._id.toString().slice(-8).toUpperCase()} — D5`,
    html: wrap(`
      <h2 style="color:#2E1A3C;margin:0 0 8px;font-family:Georgia,serif;">Payment Successful! 💳</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${user.name}, your payment has been confirmed.</p>
      <div style="background:#f0fdf4;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
        <div style="font-size:28px;font-weight:900;color:#15803d;">AED ${order.totalAmount.toLocaleString()}</div>
        <div style="font-size:13px;color:#15803d;margin-top:4px;">Payment confirmed ✅</div>
      </div>
      ${order.paymentSimulation?.transactionId ? `<p style="color:#64748b;font-size:13px;">Transaction ID: <strong>${order.paymentSimulation.transactionId}</strong></p>` : ''}
    `),
  }),
};

module.exports = { sendEmail, emailTemplates };
