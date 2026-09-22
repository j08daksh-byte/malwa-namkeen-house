import { Resend } from 'resend';
import mongoose from 'mongoose';
import { EmailLog, type EmailEventType } from '../models/EmailLog.ts';

export interface EmailResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

function getEmailConfig() {
  const rawBaseUrl = process.env.APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
  return {
    provider: process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'simulated'),
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Malwa Namkeen House <orders@malwanamkeen.com>',
    appBaseUrl: rawBaseUrl.replace(/\/+$/, ''),
  };
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const { resendApiKey } = getEmailConfig();
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

/**
 * Base email layout wrapper with Malwa Namkeen House heritage aesthetics.
 */
function wrapEmailTemplate({
  title,
  preheader,
  contentHtml,
  storeContact,
}: {
  title: string;
  preheader?: string;
  contentHtml: string;
  storeContact?: { phone?: string; email?: string; address?: string };
}): string {
  const phone = storeContact?.phone || '+91 7987732765';
  const email = storeContact?.email || 'malwanamkeenhouse@gmail.com';
  const address = storeContact?.address || 'Near Mahakaleshwar Temple, Sarafa Bazaar, Ujjain, MP 456001';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A0A0F; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAE5D9; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #3C0815 0%, #1A040A 100%); padding: 32px 24px; text-align: center; color: #FFF8EC; }
    .brand-name { color: #F0C74E; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .brand-sub { color: rgba(255, 248, 236, 0.65); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .footer { background: #FAF7F2; padding: 24px; text-align: center; font-size: 12px; color: #78716C; border-top: 1px solid #EAE5D9; }
    .btn { display: inline-block; background: #3C0815; color: #FFF8EC !important; font-weight: 700; font-size: 13.5px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 18px 0; }
    .table-wrap { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table-wrap th { background: #F8F6F2; text-align: left; padding: 10px 12px; font-size: 12px; color: #57534E; font-weight: 600; text-transform: uppercase; }
    .table-wrap td { padding: 12px; border-bottom: 1px solid #F2EFEB; font-size: 13.5px; }
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1 class="brand-name">Malwa Namkeen House</h1>
      <div class="brand-sub">Artisanal Savouries & Heritage Sweets · Since 1954</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px; font-weight: 600; color: #44403C;">Malwa Namkeen House</p>
      <p style="margin: 0 0 8px;">${address}</p>
      <p style="margin: 0;">Phone: <strong>${phone}</strong> · Email: <strong>${email}</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch transactional email via configured provider or safe dev simulation.
 * Logs delivery attempt in EmailLog for auditability and idempotency.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  eventType,
  relatedId,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  eventType?: EmailEventType;
  relatedId?: string;
}): Promise<EmailResult> {
  const config = getEmailConfig();
  const isProd = process.env.NODE_ENV === 'production';
  const cleanTo = to.trim().toLowerCase();

  // Basic email address validation
  if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    return { success: false, provider: 'none', error: 'Invalid recipient email address.' };
  }

  let result: EmailResult = { success: false, provider: config.provider };

  // 1. Resend Provider (Production / Configured Key)
  if (config.resendApiKey) {
    try {
      const client = getResendClient();
      if (!client) throw new Error('Resend client initialization failed');

      const response = await client.emails.send({
        from: config.emailFrom,
        to: [cleanTo],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      if (response.error) {
        result = { success: false, provider: 'resend', error: response.error.message };
      } else {
        result = { success: true, provider: 'resend', messageId: response.data?.id };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result = { success: false, provider: 'resend', error: msg };
    }
  } else if (isProd) {
    // 2. Production without configured provider (Fail safely without throwing)
    console.warn(`[Email Service] Production email provider unconfigured. Message to <${cleanTo}> safely dropped.`);
    result = { success: false, provider: 'unconfigured', error: 'Email provider unconfigured.' };
  } else {
    // 3. Local Development Simulation
    console.log('\n================== [DEV EMAIL SIMULATOR] ==================');
    console.log(`To: ${cleanTo}`);
    console.log(`From: ${config.emailFrom}`);
    console.log(`Event: ${eventType || 'generic'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Preview:\n${text || html.replace(/<[^>]*>?/gm, '').slice(0, 300)}...`);
    console.log('===========================================================\n');
    result = { success: true, provider: 'simulated', simulated: true };
  }

  // 4. Log attempt in MongoDB EmailLog (Non-blocking)
  if (eventType && mongoose.connection.readyState === 1) {
    try {
      await EmailLog.create({
        eventType,
        recipient: cleanTo,
        subject,
        relatedId: relatedId || null,
        provider: result.provider,
        providerMessageId: result.messageId || null,
        status: result.simulated
          ? 'simulated'
          : result.success
          ? 'sent'
          : result.provider === 'unconfigured'
          ? 'unconfigured'
          : 'failed',
        error: result.error || null,
        attemptedAt: new Date(),
      });
    } catch (logErr) {
      console.warn('[EmailLog Warning] Failed to log email record:', logErr);
    }
  }

  return result;
}

/**
 * 1. Admin Invitation Email
 */
export async function sendAdminInvitation({
  email,
  name,
  role,
  token,
  inviterName = 'Super Administrator',
}: {
  email: string;
  name: string;
  role?: string;
  token: string;
  inviterName?: string;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const inviteUrl = `${appBaseUrl}/admin/accept-invite?token=${encodeURIComponent(token)}`;
  const roleTitle = role === 'super_admin' ? 'Super Administrator' : 'Administrator';

  const html = wrapEmailTemplate({
    title: 'Administrator Invitation',
    preheader: `You have been invited to join Malwa Namkeen House as ${roleTitle}.`,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Welcome to the Team, ${name}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        <strong>${inviterName}</strong> has invited you to join the Malwa Namkeen House management team with the access role of <strong>${roleTitle}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Please click the button below to accept your invitation, confirm your profile details, and choose your account password:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${inviteUrl}" class="btn">Accept Invitation & Set Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This invitation link is cryptographically signed and will expire in 48 hours. If you were not expecting this invitation, you may disregard this email.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `Invitation to join Malwa Namkeen House Staff Portal (${roleTitle})`,
    html,
    eventType: 'admin_invitation',
    relatedId: email,
  });
}

/**
 * 2. Admin Password Reset Email
 */
export async function sendAdminPasswordReset({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const resetUrl = `${appBaseUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;

  const html = wrapEmailTemplate({
    title: 'Password Reset Request',
    preheader: 'Reset instructions for your administrator account.',
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Password Reset Instructions</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Namaste ${name},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to reset the password for your administrator account (<strong>${email}</strong>).
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="btn">Reset Your Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This link is valid for 1 hour and can only be used once. If you did not make this request, please inform your store administrator immediately.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: 'Password Reset Request — Malwa Namkeen House Staff Portal',
    html,
    eventType: 'admin_password_reset',
    relatedId: email,
  });
}

/**
 * 2b. Customer Password Reset Email
 */
export async function sendCustomerPasswordReset({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const resetUrl = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = wrapEmailTemplate({
    title: 'Password Reset Request',
    preheader: 'Reset instructions for your Malwa Namkeen House account.',
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Password Reset Instructions</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Namaste ${name},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to reset the password for your Malwa Namkeen House account (<strong>${email}</strong>).
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="btn">Reset Your Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This link is valid for 1 hour and can only be used once. If you did not make this request, you can safely ignore this email.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: 'Password Reset Request — Malwa Namkeen House',
    html,
    eventType: 'customer_password_reset',
    relatedId: email,
  });
}

/**
 * 3. Customer Order Confirmation Email
 */
export async function sendCustomerOrderConfirmation({
  order,
  storeContact,
}: {
  order: any;
  storeContact?: any;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || 'Customer';

  if (!customerEmail) {
    return { success: false, provider: 'none', error: 'No recipient email found on order.' };
  }

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td>
          <strong>${item.productName}</strong><br>
          <span style="font-size: 12px; color: #78716C;">${item.variantLabel || 'Standard'}</span>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₹${item.price}</td>
        <td style="text-align: right; font-weight: 600;">₹${item.itemTotal || item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  const html = wrapEmailTemplate({
    title: `Order Confirmation — ${order.orderNumber}`,
    preheader: `Thank you for your order #${order.orderNumber}. We are preparing your fresh Malwa delicacies.`,
    storeContact,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #D1FAE5; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; borderRadius: 20px; text-transform: uppercase;">
          Order Confirmed · #${order.orderNumber}
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Dhanyawaad, ${customerName}!
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Your order has been received and our kitchen is preparing your authentic handcrafted savouries.
      </p>

      <table class="table-wrap">
        <thead>
          <tr>
            <th>Delicacy</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background: #FAF7F2; padding: 16px; border-radius: 10px; margin: 20px 0; font-size: 13.5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #78716C;">Subtotal:</span>
          <span>₹${order.subtotal}</span>
        </div>
        ${
          order.discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #047857;">
                 <span>Discount ${order.discountCode ? `(${order.discountCode})` : ''}:</span>
                 <span>-₹${order.discount}</span>
               </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #78716C;">Delivery:</span>
          <span>${order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; border-top: 1px solid #EAE5D9; padding-top: 8px; margin-top: 6px; color: #3C0815;">
          <span>Grand Total:</span>
          <span>₹${order.total}</span>
        </div>
      </div>

      <div style="border: 1px solid #EAE5D9; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #57534E; text-transform: uppercase; margin-bottom: 6px;">
          Delivery Address
        </div>
        <div style="font-size: 13px; color: #374151; line-height: 1.4;">
          ${order.shippingAddress?.name || customerName}<br>
          ${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.addressLine2 || ''}<br>
          ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} — ${order.shippingAddress?.pincode || ''}<br>
          Phone: ${order.shippingAddress?.phone || ''}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${appBaseUrl}/dashboard" class="btn">View Order in Dashboard</a>
      </div>
    `,
  });

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation — #${order.orderNumber} (Malwa Namkeen House)`,
    html,
    eventType: 'order_confirmation',
    relatedId: order.orderNumber,
  });
}

/**
 * 4. Customer Order Status Update Email
 */
export async function sendOrderStatusUpdate({
  order,
  previousStatus,
  newStatus,
  storeContact,
}: {
  order: any;
  previousStatus: string;
  newStatus: string;
  storeContact?: any;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || 'Customer';

  if (!customerEmail) {
    return { success: false, provider: 'none', error: 'No recipient email found on order.' };
  }

  // Idempotency: Ignore if status did not actually change
  if (previousStatus === newStatus) {
    return { success: true, provider: 'none', simulated: true };
  }

  const statusDescriptions: Record<string, { title: string; desc: string; color: string }> = {
    confirmed: {
      title: 'Order Confirmed',
      desc: 'Your order has been verified and scheduled for kitchen preparation.',
      color: '#065F46',
    },
    processing: {
      title: 'Fresh Batch In Preparation',
      desc: 'Our artisans are hand-frying and packaging your savouries with cold-pressed groundnut oil.',
      color: '#B45309',
    },
    shipped: {
      title: 'Dispatched & On the Way',
      desc: 'Your parcel has been handed over to our courier partner for fast delivery.',
      color: '#1E40AF',
    },
    delivered: {
      title: 'Order Delivered',
      desc: 'Your Malwa Namkeen parcel has been delivered. Enjoy the crisp heritage flavours of Ujjain!',
      color: '#065F46',
    },
    cancelled: {
      title: 'Order Cancelled',
      desc: 'Your order has been cancelled. If payment was made, your refund will be processed.',
      color: '#991B1B',
    },
  };

  const statusInfo = statusDescriptions[newStatus] || {
    title: `Order Status: ${newStatus.toUpperCase()}`,
    desc: `Your order status has been updated to ${newStatus}.`,
    color: '#3C0815',
  };

  const trackingHtml =
    order.trackingInfo?.trackingNumber
      ? `
    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px; margin: 18px 0; font-size: 13px;">
      <div style="font-weight: 700; color: #1E40AF; margin-bottom: 4px;">Courier Tracking Information</div>
      <div>Courier: <strong>${order.trackingInfo.courierName || 'Standard Express'}</strong></div>
      <div>AWB / Tracking Number: <strong>${order.trackingInfo.trackingNumber}</strong></div>
      ${
        order.trackingInfo.trackingUrl
          ? `<div style="margin-top: 8px;"><a href="${order.trackingInfo.trackingUrl}" target="_blank" style="color: #1D4ED8; font-weight: 600;">Track Package Online →</a></div>`
          : ''
      }
    </div>
  `
      : '';

  const html = wrapEmailTemplate({
    title: `Order Update — #${order.orderNumber}`,
    preheader: `Your order status is now: ${statusInfo.title}.`,
    storeContact,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="background: #F3F4F6; color: ${statusInfo.color}; font-size: 13px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase;">
          ${statusInfo.title}
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Order #${order.orderNumber}
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Namaste ${customerName}, ${statusInfo.desc}
      </p>

      ${trackingHtml}

      <div style="text-align: center; margin-top: 24px;">
        <a href="${appBaseUrl}/dashboard" class="btn">Track Order in Dashboard</a>
      </div>
    `,
  });

  return sendEmail({
    to: customerEmail,
    subject: `Order Update (#${order.orderNumber}): ${statusInfo.title}`,
    html,
    eventType: 'order_status_update',
    relatedId: `${order.orderNumber}_${newStatus}`,
  });
}

/**
 * 5. Admin New-Order Alert Email
 */
export async function sendNewOrderAdminAlert({
  order,
  adminEmails,
  storeContact,
}: {
  order: any;
  adminEmails: string[];
  storeContact?: any;
}): Promise<EmailResult[]> {
  const { appBaseUrl } = getEmailConfig();
  const itemCount = (order.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

  const html = wrapEmailTemplate({
    title: `[NEW ORDER] #${order.orderNumber} · ₹${order.total}`,
    preheader: `New store order received for ₹${order.total} from ${order.customerInfo?.name || 'Customer'}.`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">New Customer Order Placed</h2>
      <p style="font-size: 14px; color: #374151;">
        A new order has been submitted on the storefront and is awaiting fulfillment.
      </p>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13.5px;">
        <div>Order Number: <strong>#${order.orderNumber}</strong></div>
        <div>Customer: <strong>${order.customerInfo?.name || 'Customer'}</strong> (${order.customerInfo?.phone || 'No phone'})</div>
        <div>Total Items: <strong>${itemCount}</strong></div>
        <div>Payment Method: <strong>${(order.paymentMethod || 'cod').toUpperCase()}</strong></div>
        <div>Order Amount: <strong style="color: #3C0815; font-size: 15px;">₹${order.total}</strong></div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${appBaseUrl}/admin/orders" class="btn">Manage Order in Admin Portal</a>
      </div>
    `,
  });

  const results: EmailResult[] = [];
  const uniqueEmails = [...new Set(adminEmails.map(e => e.trim().toLowerCase()))];

  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Order #${order.orderNumber} (₹${order.total})`,
      html,
      eventType: 'admin_new_order_alert',
      relatedId: order.orderNumber,
    });
    results.push(res);
  }

  return results;
}

/**
 * 6. Customer Inquiry Acknowledgement Email
 */
export async function sendInquiryAcknowledgement({
  inquiry,
  storeContact,
}: {
  inquiry: any;
  storeContact?: any;
}): Promise<EmailResult> {
  const customerEmail = inquiry.email;
  const customerName = inquiry.name || 'Customer';

  if (!customerEmail) {
    return { success: false, provider: 'none', error: 'No recipient email provided.' };
  }

  const referenceId = inquiry._id ? String(inquiry._id).slice(-6).toUpperCase() : 'MN-INQ';

  const html = wrapEmailTemplate({
    title: 'Inquiry Received',
    preheader: `Thank you for contacting Malwa Namkeen House (Ref: #${referenceId}).`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Namaste ${customerName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Thank you for reaching out to Malwa Namkeen House. We have received your inquiry regarding <strong>${inquiry.category || 'Namkeen Orders'}</strong>.
      </p>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13px;">
        <div>Reference ID: <strong>#${referenceId}</strong></div>
        <div>Category: <strong>${inquiry.category || 'General'}</strong></div>
        <div style="margin-top: 8px; font-style: italic; color: #57534E;">"${inquiry.message}"</div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Our team in Ujjain will review your request and get back to you via phone or email within 1 business day.
      </p>
    `,
  });

  return sendEmail({
    to: customerEmail,
    subject: `We have received your inquiry (Ref: #${referenceId}) — Malwa Namkeen House`,
    html,
    eventType: 'inquiry_acknowledgement',
    relatedId: String(inquiry._id || referenceId),
  });
}

/**
 * 7. Admin New-Inquiry Alert Email
 */
export async function sendNewInquiryAdminAlert({
  inquiry,
  adminEmails,
  storeContact,
}: {
  inquiry: any;
  adminEmails: string[];
  storeContact?: any;
}): Promise<EmailResult[]> {
  const { appBaseUrl } = getEmailConfig();
  const referenceId = inquiry._id ? String(inquiry._id).slice(-6).toUpperCase() : 'MN-INQ';

  const html = wrapEmailTemplate({
    title: `[NEW INQUIRY] #${referenceId} · ${inquiry.category}`,
    preheader: `New customer inquiry from ${inquiry.name} (${inquiry.email}).`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">New Customer Inquiry Received</h2>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13.5px;">
        <div>Reference ID: <strong>#${referenceId}</strong></div>
        <div>Customer Name: <strong>${inquiry.name}</strong></div>
        <div>Email: <strong>${inquiry.email}</strong></div>
        <div>Phone: <strong>${inquiry.phone || 'Not provided'}</strong></div>
        <div>Category: <strong>${inquiry.category}</strong></div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #EAE5D9;">
          <strong>Message:</strong><br>
          ${inquiry.message}
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${appBaseUrl}/admin/inquiries" class="btn">View & Respond in Admin Portal</a>
      </div>
    `,
  });

  const results: EmailResult[] = [];
  const uniqueEmails = [...new Set(adminEmails.map(e => e.trim().toLowerCase()))];

  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Inquiry #${referenceId} from ${inquiry.name}`,
      html,
      eventType: 'admin_new_inquiry_alert',
      relatedId: String(inquiry._id || referenceId),
    });
    results.push(res);
  }

  return results;
}

// ── Password Change OTP & Role Notification Email Services ───────────────────

/**
 * 8. Customer/User Password Change OTP Verification Email
 */
export async function sendPasswordChangeOtp({
  email,
  name,
  otp,
  minutesValid = 10,
}: {
  email: string;
  name: string;
  otp: string;
  minutesValid?: number;
}): Promise<EmailResult> {
  const safeName = name ? name.trim() : 'Customer';
  const html = wrapEmailTemplate({
    title: 'Verify Password Change',
    preheader: `Your verification code is: ${otp}`,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to change the password for your Malwa Namkeen House account.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your verification code is:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: #FAF7F2; border: 2px dashed #C89A3D; border-radius: 12px; padding: 16px 36px;">
          <span style="font-family: monospace, Courier, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #3C0815;">
            ${otp}
          </span>
        </div>
      </div>
      <p style="font-size: 13.5px; line-height: 1.5; color: #57534E; text-align: center;">
        This code expires in <strong>${minutesValid} minutes</strong>.
      </p>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        <strong>Security Notice:</strong> If you did not request this change, you can safely ignore this email. Malwa Namkeen House will never ask for your verification code.
      </p>
    `,
  });

  const text = `Hello ${safeName},\n\nWe received a request to change the password for your Malwa Namkeen House account.\n\nYour verification code is:\n\n${otp}\n\nThis code expires in ${minutesValid} minutes.\n\nIf you did not request this change, you can ignore this email.\n\nMalwa Namkeen House`;

  return sendEmail({
    to: email,
    subject: 'Malwa Namkeen House - Verify Password Change',
    html,
    text,
    eventType: 'password_change_otp',
    relatedId: email,
  });
}

/**
 * 9. Password Changed Confirmation Alert Email
 */
export async function sendPasswordChangedConfirmation({
  email,
  name,
}: {
  email: string;
  name: string;
}): Promise<EmailResult> {
  const safeName = name ? name.trim() : 'Customer';
  const timeFormatted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = wrapEmailTemplate({
    title: 'Password Successfully Changed',
    preheader: 'Your Malwa Namkeen House account password was changed.',
    contentHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #D1FAE5; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          Security Alert · Password Changed
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Hello ${safeName},
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Your Malwa Namkeen House account password was successfully changed on <strong>${timeFormatted} (IST)</strong>.
      </p>
      <div style="background: #FAF7F2; border: 1px solid #EAE5D9; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #4B5563; line-height: 1.6;">
        <strong style="color: #991B1B;">Did not perform this change?</strong><br>
        If you did not perform this change, please contact our support team immediately at <a href="mailto:malwanamkeenhouse@gmail.com" style="color: #3C0815; font-weight: 600;">malwanamkeenhouse@gmail.com</a> or call <strong>+91 7987732765</strong> to secure your account.
      </div>
    `,
  });

  const text = `Hello ${safeName},\n\nYour Malwa Namkeen House account password was successfully changed on ${timeFormatted} (IST).\n\nIf you did not perform this change, please contact our support team immediately at malwanamkeenhouse@gmail.com or +91 7987732765.\n\nMalwa Namkeen House`;

  return sendEmail({
    to: email,
    subject: 'Your Malwa Namkeen House Password Was Changed',
    html,
    text,
    eventType: 'password_changed_notification',
    relatedId: email,
  });
}

/**
 * 10. Role Changed / Promotion Notification Email
 */
export async function sendRoleChangedNotification({
  email,
  name,
  oldRole,
  newRole,
}: {
  email: string;
  name: string;
  oldRole: string;
  newRole: string;
}): Promise<EmailResult> {
  const { appBaseUrl } = getEmailConfig();
  const safeName = name ? name.trim() : 'User';

  let subject = 'Access Role Updated - Malwa Namkeen House';
  let bodyHtml = '';
  let bodyText = '';

  if (newRole === 'super_admin') {
    subject = 'You Have Been Made a Super Admin - Malwa Namkeen House';
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House account has been granted <strong>Super Administrator</strong> access.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your account now has elevated administrative permissions across the platform, including team access control, staff management, and system-level configuration.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appBaseUrl}/admin/staff" class="btn">Manage Staff Portal</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you believe this change was made by mistake, please contact the site administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},\n\nYour Malwa Namkeen House account now has elevated administrative permissions as Super Administrator.\n\nPortal: ${appBaseUrl}/admin/staff\n\nIf you believe this change was made by mistake, please contact the site administrator.\n\nMalwa Namkeen House`;
  } else if (newRole === 'admin' && oldRole !== 'super_admin') {
    subject = 'You Have Been Made an Admin - Malwa Namkeen House';
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House account has been granted <strong>Admin</strong> access.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        You can now access the Admin Dashboard and the permissions assigned to the Admin role.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appBaseUrl}/admin/dashboard" class="btn">Go to Admin Dashboard</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you believe this change was made by mistake, please contact the site administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},\n\nYour Malwa Namkeen House account has been granted Admin access.\n\nYou can now access the Admin Dashboard and the permissions assigned to the Admin role.\n\nIf you believe this change was made by mistake, please contact the site administrator.\n\nMalwa Namkeen House`;
  } else {
    // Downgrade / revocation (e.g. super_admin -> admin, admin -> customer, super_admin -> customer)
    subject = 'Access Role Updated - Malwa Namkeen House';
    const oldRoleTitle = oldRole === 'super_admin' ? 'Super Administrator' : oldRole === 'admin' ? 'Administrator' : oldRole;
    const newRoleTitle = newRole === 'admin' ? 'Administrator' : newRole === 'customer' ? 'Customer' : newRole;
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House access role has been updated from <strong>${oldRoleTitle}</strong> to <strong>${newRoleTitle}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your administrative privileges and permissions have been updated accordingly.
      </p>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you have questions regarding this change, please contact the store administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},\n\nYour Malwa Namkeen House access role has been updated from ${oldRoleTitle} to ${newRoleTitle}.\n\nIf you believe this was in error, please contact the store administrator.\n\nMalwa Namkeen House`;
  }

  const html = wrapEmailTemplate({
    title: subject,
    preheader: `Your account role has been updated to ${newRole}.`,
    contentHtml: bodyHtml,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    text: bodyText,
    eventType: 'role_changed_notification',
    relatedId: `${email}_${newRole}`,
  });
}

// Aliases for backwards-compatibility & convenience
export const sendAdminInvitationEmail = sendAdminInvitation;
export const sendPasswordResetEmail = sendAdminPasswordReset;
export const sendPasswordChangeOtpEmail = sendPasswordChangeOtp;
export const sendPasswordChangedEmail = sendPasswordChangedConfirmation;
export const sendRoleChangedEmail = sendRoleChangedNotification;

// --- Migrated from email.ts ---

import { BUSINESS } from '../config.ts';

function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C89A3D;width:140px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#34211D;line-height:1.55;">${esc(value)}</td>
  </tr>`;
}

function dataTable(rows: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows.map(([l, v]) => row(l, v)).join('')}
  </table>`;
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || BUSINESS.email;
export interface ContactEmailData {
  referenceId:  string;
  customerName: string;
  customerEmail:string;
  phone:        string;
  category:     string;
  categoryLabel:string;
  message:      string;
  locationId:   string;
  submittedAt:  string;
}

export async function sendContactCustomerEmail(d: ContactEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Thank you, ${esc(d.customerName)}!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#5E4940;">
      We have received your enquiry and our team will get back to you shortly.
    </p>
    ${dataTable([
      ['Reference',  d.referenceId],
      ['Category',   d.categoryLabel],
      ['Your Name',  d.customerName],
      ['Your Email', d.customerEmail],
      ['Phone',      d.phone || '—'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#5E4940;">
      <strong>Your message:</strong><br/>
      <span style="color:#75645C;">${esc(d.message)}</span>
    </p>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team typically responds within one business day. For urgent matters,
      reach us directly at
      <a href="mailto:${esc(BUSINESS.email)}" style="color:#C89A3D;">${esc(BUSINESS.email)}</a>
      or WhatsApp <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;

  return sendEmail({
    eventType: 'inquiry_acknowledgement',
    to:      d.customerEmail,
    subject: `We received your enquiry — ${BUSINESS.name}`,
    html:    wrapEmailTemplate({
      title: `Enquiry Received — ${BUSINESS.name}`,
      contentHtml:  body
    }),
  });
}

export async function sendContactAdminEmail(d: ContactEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New ${esc(d.categoryLabel)} Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> ·
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
      ['Reference', d.referenceId],
      ['Category',  d.categoryLabel],
      ['Name',      d.customerName],
      ['Email',     d.customerEmail],
      ['Phone',     d.phone || '—'],
      ['Location',  d.locationId],
    ])}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:rgba(255,248,236,0.85);">
      <strong style="color:#F0C74E;">Message:</strong><br/>
      ${esc(d.message)}
    </p>
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}?text=${encodeURIComponent(`Hello ${d.customerName}, thank you for reaching out to MALWA NAMKEEN HOUSE (Ref: ${d.referenceId}). We are happy to assist you!`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;

  return sendEmail({
    eventType: 'admin_new_inquiry_alert',
    to:      ADMIN_EMAIL,
    subject: `[${d.categoryLabel}] ${d.customerName} — ${BUSINESS.name}`,
    html:    wrapEmailTemplate({
      title: `New Enquiry — ${BUSINESS.name}`,
      contentHtml:  body
    }),
  });
}

// ── Reservation emails ──────────────────────────────────────────────────────

export interface ReservationEmailData {
  referenceId:      string;
  customerName:     string;
  customerEmail:    string;
  phone:            string;
  reservationDate:  string;
  preferredTime:    string;
  guestCount:       string | number;
  specialRequest:   string;
  locationId:       string;
  submittedAt:      string;
}

export async function sendReservationCustomerEmail(d: ReservationEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Reservation Enquiry Received
    </h2>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#5E4940;">
      Thank you, <strong>${esc(d.customerName)}</strong>. We have received your reservation enquiry.
    </p>
    <div style="background:#FFF3CD;border:1px solid #C89A3D;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#856404;line-height:1.6;">
        ⚠ This is a reservation <em>enquiry</em> — not a confirmed booking.
        Our team will contact you to confirm availability.
      </p>
    </div>
    ${dataTable([
      ['Reference',       d.referenceId],
      ['Name',            d.customerName],
      ['Date Requested',  d.reservationDate],
      ['Preferred Time',  d.preferredTime],
      ['Guests',          String(d.guestCount)],
      ['Special Request', d.specialRequest || '—'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team will call or message you to confirm your table.
      For same-day enquiries, please also WhatsApp us at
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;

  return sendEmail({
    eventType: 'inquiry_acknowledgement',
    to:      d.customerEmail,
    subject: `Reservation enquiry received — ${BUSINESS.name}`,
    html:    wrapEmailTemplate({
      title: `Reservation Enquiry — ${BUSINESS.name}`,
      contentHtml:  body
    }),
  });
}

export async function sendReservationAdminEmail(d: ReservationEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New Reservation Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> ·
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
      ['Reference',      d.referenceId],
      ['Name',           d.customerName],
      ['Email',          d.customerEmail],
      ['Phone',          d.phone],
      ['Date',           d.reservationDate],
      ['Time',           d.preferredTime],
      ['Guests',         String(d.guestCount)],
      ['Special Req.',   d.specialRequest || '—'],
      ['Location',       d.locationId],
    ])}
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber.replace(d.phone, ''))}${encodeURIComponent(d.phone.replace(/\D/g, ''))}?text=${encodeURIComponent(`Hello ${d.customerName}, this is MALWA NAMKEEN HOUSE confirming your enquiry (Ref: ${d.referenceId}) for ${d.reservationDate} at ${d.preferredTime}.`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;

  return sendEmail({
    eventType: 'admin_new_inquiry_alert',
    to:      ADMIN_EMAIL,
    subject: `[Reservation] ${d.customerName} · ${d.reservationDate} · ${d.guestCount} guests`,
    html:    wrapEmailTemplate({
      title: `New Reservation — ${BUSINESS.name}`,
      contentHtml:  body
    }),
  });
}

// ── Admin-triggered: reservation confirmed ──────────────────────────────────

interface ReservationConfirmationData {
  referenceId:     string;
  customerName:    string;
  customerEmail:   string;
  phone:           string;
  reservationDate: string;
  preferredTime:   string;
  guestCount:      number;
  specialRequest:  string;
  locationId:      string;
  adminUser:       string;
}

export async function sendReservationConfirmationEmail(d: ReservationConfirmationData): Promise<EmailResult> {
  if (!d.customerEmail) return { success: false, provider: 'none', error: 'no_email' };

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#3A211D;">
      Your Table is Confirmed
    </h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#5E4940;">
      Dear ${esc(d.customerName)}, your reservation at <strong>${esc(BUSINESS.name)}</strong> has been confirmed.
    </p>
    ${dataTable([
      ['Reference',      d.referenceId],
      ['Date',           d.reservationDate],
      ['Time',           d.preferredTime],
      ['Guests',         String(d.guestCount)],
      ['Special Request', d.specialRequest || '—'],
      ['Location',       'Sarjapur Road, Bengaluru'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      We look forward to welcoming you. If you need to cancel or make changes,
      please WhatsApp us at <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>
      at least 2 hours in advance.
    </p>`;

  return sendEmail({
    eventType: 'inquiry_acknowledgement',
    to:      d.customerEmail,
    subject: `Reservation Confirmed — ${d.reservationDate} at ${d.preferredTime} · ${BUSINESS.name}`,
    html:    wrapEmailTemplate({
      title: `Reservation Confirmed — ${BUSINESS.name}`,
      contentHtml:  body
    }),
  });
}
