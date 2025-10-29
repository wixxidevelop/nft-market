import { Resend } from 'resend';
import { logError, logInfo } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

// Default sender email
const DEFAULT_FROM = process.env.DEFAULT_FROM_EMAIL || 'noreply@etheryte.com';

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html || '',
    });

    if (error) {
      logError('Email sending failed', new Error(error.message), { options });
      return false;
    }

    logInfo('Email sent successfully', { 
      emailId: data?.id, 
      to: options.to, 
      subject: options.subject 
    });
    return true;
  } catch (error) {
    logError('Email service error', error as Error, { options });
    return false;
  }
};

// Welcome email template
export const sendWelcomeEmail = async (email: string, username: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Etheryte</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Etheryte!</h1>
          <p>Your NFT Marketplace Journey Begins</p>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Thank you for joining Etheryte, the premier NFT marketplace. We're excited to have you as part of our community!</p>
          
          <p>With your account, you can:</p>
          <ul>
            <li>Create and mint your own NFTs</li>
            <li>Buy and sell digital assets</li>
            <li>Participate in auctions</li>
            <li>Build your collection</li>
          </ul>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Explore Dashboard</a>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Happy collecting!</p>
          <p>The Etheryte Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Etheryte. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome to Etheryte - Your NFT Journey Starts Now!',
    html,
  });
};

// Email verification template
export const sendVerificationEmail = async (email: string, username: string, verificationToken: string): Promise<boolean> => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Etheryte</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Please verify your email address to complete your Etheryte account setup.</p>
          
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>If you didn't create an account with Etheryte, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Etheryte. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Verify Your Email Address - Etheryte',
    html,
  });
};

// Password reset email template
export const sendPasswordResetEmail = async (email: string, username: string, resetToken: string): Promise<boolean> => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Etheryte</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We received a request to reset your password for your Etheryte account.</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          
          <p>This reset link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Etheryte. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your Password - Etheryte',
    html,
  });
};

// Transaction notification email
export const sendTransactionNotification = async (
  email: string, 
  username: string, 
  transactionType: string, 
  amount: number, 
  currency: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Transaction Notification - Etheryte</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .transaction-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Transaction Notification</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Your transaction has been processed successfully.</p>
          
          <div class="transaction-box">
            <h3>Transaction Details</h3>
            <p><strong>Type:</strong> ${transactionType}</p>
            <p><strong>Amount:</strong> ${amount} ${currency}</p>
            <p><strong>Status:</strong> Completed</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You can view all your transactions in your dashboard.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Transactions</a>
        </div>
        <div class="footer">
          <p>&copy; 2024 Etheryte. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Transaction ${transactionType} Completed - Etheryte`,
    html,
  });
};