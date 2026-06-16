import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'testuser',
    pass: process.env.SMTP_PASS || 'testpass',
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: '"PulseWatch Alerts" <alerts@pulsewatch.local>',
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
  }
};

export const templates = {
  monitorDown: (monitorName: string, url: string, time: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Monitor DOWN</h2>
      </div>
      <div style="padding: 20px;">
        <p>Your monitor <strong>${monitorName}</strong> (${url}) is currently unreachable.</p>
        <p>Time detected: ${time}</p>
      </div>
    </div>
  `,

  monitorUp: (monitorName: string, duration: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #22c55e; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Monitor UP</h2>
      </div>
      <div style="padding: 20px;">
        <p>Your monitor <strong>${monitorName}</strong> is back online.</p>
        <p>Downtime duration: ${duration}</p>
      </div>
    </div>
  `,

  sslExpiring: (domain: string, daysRemaining: number) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #eab308; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">SSL Certificate Expiring</h2>
      </div>
      <div style="padding: 20px;">
        <p>The SSL certificate for <strong>${domain}</strong> will expire in ${daysRemaining} days.</p>
        <p>Please renew it soon to prevent outages.</p>
      </div>
    </div>
  `,

  apiFailure: (url: string, statusCode: number, error: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">API Failure</h2>
      </div>
      <div style="padding: 20px;">
        <p>API Endpoint: <strong>${url}</strong></p>
        <p>Status Code: ${statusCode}</p>
        <p>Error: ${error}</p>
      </div>
    </div>
  `
};

export const getInviteTemplate = (inviterName: string, workspaceName: string, acceptLink: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #6366f1; padding: 20px; text-align: center;">
      <h2 style="color: white; margin: 0;">You've been invited!</h2>
    </div>
    <div style="padding: 20px;">
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on PulseWatch.</p>
      <p style="margin-top: 30px;">
        <a href="${acceptLink}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Accept Invitation
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">This link will expire in 7 days.</p>
    </div>
  </div>
`;
