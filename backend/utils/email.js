const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'ApartEase <noreply@apartease.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failures shouldn't break app flow
  }
};

// Email templates
const emailTemplates = {
  orderConfirmed: (order, user) => ({
    subject: `✅ Order #${order._id.toString().slice(-8).toUpperCase()} Confirmed — ApartEase`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: #1a1a2e; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 ApartEase</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0;">Your apartment service platform</p>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px; margin-bottom: 16px;">
          <h2 style="color: #1a1a2e; margin: 0 0 8px;">Order Confirmed! ✅</h2>
          <p style="color: #6b7280; margin: 0 0 20px;">Hi ${user.name}, your order has been placed successfully.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
            <p style="margin: 0 0 6px;"><strong>Type:</strong> ${order.orderType.replace('_', ' ')}</p>
            <p style="margin: 0 0 6px;"><strong>Apartment:</strong> ${user.apartmentNumber}${user.block ? ', Block ' + user.block : ''}</p>
            <p style="margin: 0;"><strong>Total:</strong> ₹${order.totalAmount}</p>
          </div>
          <h3 style="color: #1a1a2e; margin: 0 0 12px;">Items Ordered</h3>
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>${item.name} x${item.quantity}</span>
              <strong>₹${item.price * item.quantity}</strong>
            </div>
          `).join('')}
        </div>
        <p style="color: #9ca3af; text-align: center; font-size: 13px; margin: 0;">© 2024 ApartEase. All rights reserved.</p>
      </div>
    `,
  }),

  orderStatusUpdate: (order, user, newStatus) => ({
    subject: `📦 Order #${order._id.toString().slice(-8).toUpperCase()} — Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: #1a1a2e; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 ApartEase</h1>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px;">
          <h2 style="color: #1a1a2e; margin: 0 0 8px;">Order Update 📦</h2>
          <p style="color: #6b7280; margin: 0 0 20px;">Hi ${user.name}, your order status has been updated.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 16px;"><strong>New Status:</strong> <span style="color: #16a34a; text-transform: capitalize;">${newStatus.replace('_', ' ')}</span></p>
          </div>
          <p style="margin: 0 0 6px;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
          <p style="margin: 0;"><strong>Total:</strong> ₹${order.totalAmount}</p>
        </div>
      </div>
    `,
  }),

  paymentSuccess: (order, user) => ({
    subject: `💳 Payment Successful — ₹${order.totalAmount} | ApartEase`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: #1a1a2e; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 ApartEase</h1>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px;">
          <h2 style="color: #16a34a; margin: 0 0 8px;">Payment Successful 💳</h2>
          <p style="color: #6b7280; margin: 0 0 20px;">Hi ${user.name}, we've received your payment.</p>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 6px;"><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
            <p style="margin: 0 0 6px;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
            <p style="margin: 0;"><strong>Payment ID:</strong> ${order.razorpayPaymentId || 'Wallet'}</p>
          </div>
        </div>
      </div>
    `,
  }),

  walletTopup: (user, amount, newBalance) => ({
    subject: `💰 Wallet Topped Up — ₹${amount} | ApartEase`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: #1a1a2e; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 ApartEase</h1>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px;">
          <h2 style="color: #1a1a2e; margin: 0 0 8px;">Wallet Topped Up 💰</h2>
          <p style="color: #6b7280;">Hi ${user.name}, ₹${amount} has been added to your ApartEase wallet.</p>
          <div style="background: #eff6ff; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 6px;"><strong>Amount Added:</strong> ₹${amount}</p>
            <p style="margin: 0;"><strong>New Balance:</strong> ₹${newBalance}</p>
          </div>
        </div>
      </div>
    `,
  }),

  bookingConfirmed: (booking, user, facility) => ({
    subject: `🏊 Facility Booking Confirmed — ${facility.name} | ApartEase`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: #1a1a2e; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 ApartEase</h1>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px;">
          <h2 style="color: #1a1a2e; margin: 0 0 8px;">Booking Confirmed! 🎉</h2>
          <p style="color: #6b7280;">Hi ${user.name}, your facility booking is confirmed.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 6px;"><strong>Facility:</strong> ${facility.name}</p>
            <p style="margin: 0 0 6px;"><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0;"><strong>Time Slot:</strong> ${booking.timeSlot}</p>
          </div>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
