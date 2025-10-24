import nodemailer from "nodemailer";

/**
 * Email Transporter Configuration
 * Uses Gmail SMTP service for sending emails
 * Make sure to set EMAIL_USER and EMAIL_PASSWORD in .env.local
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Optional: Add these for better reliability
  pool: true, // Use pooled connections
  maxConnections: 5, // Maximum simultaneous connections
  maxMessages: 100, // Maximum messages per connection
});

/**
 * Verify transporter configuration on startup
 * This helps catch configuration errors early
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service configuration error:", error);
  } else {
    console.log("✅ Email service is ready to send emails");
  }
});

/**
 * Send Email Verification
 * Called when a new user signs up
 * 
 * @param email - User's email address
 * @param url - Verification URL with token
 * @param name - User's name (optional)
 */
export async function sendVerificationEmail(
  email: string,
  url: string,
  name?: string
): Promise<void> {
  try {
    const mailOptions = {
      from: {
        name: "Hospital Management System",
        address: process.env.EMAIL_USER as string,
      },
      to: email,
      subject: "Verify Your Email Address - Hospital Management System",
      html: getVerificationEmailTemplate(url, name),
      // Plain text fallback for email clients that don't support HTML
      text: `
        Welcome to Hospital Management System${name ? ", " + name : ""}!
        
        Please verify your email address by clicking the link below:
        ${url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent successfully to:", email);
    console.log("📧 Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error("Failed to send verification email. Please try again later.");
  }
}

/**
 * Send Password Reset Email
 * Called when user requests password reset
 * 
 * @param email - User's email address
 * @param url - Password reset URL with token
 */
export async function sendPasswordResetEmail(
  email: string,
  url: string
): Promise<void> {
  try {
    const mailOptions = {
      from: {
        name: "Hospital Management System",
        address: process.env.EMAIL_USER as string,
      },
      to: email,
      subject: "Reset Your Password - Hospital Management System",
      html: getPasswordResetEmailTemplate(url),
      // Plain text fallback
      text: `
        Password Reset Request
        
        We received a request to reset your password for your Hospital Management System account.
        
        Click the link below to reset your password:
        ${url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email or contact support.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully to:", email);
    console.log("📧 Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error("Failed to send password reset email. Please try again later.");
  }
}

/**
 * HTML Template for Verification Email
 * Modern, responsive design with proper styling
 */
function getVerificationEmailTemplate(url: string, name?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🏥 Hospital Management</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                    Welcome${name ? ", " + name : ""}! 👋
                  </h2>
                  
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with Hospital Management System. We're excited to have you on board!
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                    To complete your registration and access your account, please verify your email address by clicking the button below:
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <a href="${url}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link in your browser:
                  </p>
                  <p style="margin: 10px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                    ${url}
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      ⏱️ This verification link will expire in <strong>24 hours</strong>.
                    </p>
                    <p style="margin: 15px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                    © ${new Date().getFullYear()} Hospital Management System. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                    This is an automated message, please do not reply.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * HTML Template for Password Reset Email
 * Security-focused design with clear warnings
 */
function getPasswordResetEmailTemplate(url: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                    Reset Your Password
                  </h2>
                  
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password for your Hospital Management System account.
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                    Click the button below to reset your password:
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <a href="${url}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link in your browser:
                  </p>
                  <p style="margin: 10px 0 0; color: #f5576c; font-size: 14px; word-break: break-all;">
                    ${url}
                  </p>
                  
                  <!-- Security Warning -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600;">
                      ⚠️ Security Notice
                    </p>
                    <p style="margin: 10px 0 0; color: #856404; font-size: 14px; line-height: 1.6;">
                      This link will expire in <strong>1 hour</strong> for security reasons. If you didn't request this password reset, please ignore this email or contact our support team immediately.
                    </p>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you're having trouble with the button above, you can also paste the link directly into your browser's address bar.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                    © ${new Date().getFullYear()} Hospital Management System. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                    This is an automated message, please do not reply.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Optional: Send Welcome Email (can be used after email verification)
 * You can call this function after user verifies their email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string
): Promise<void> {
  try {
    const mailOptions = {
      from: {
        name: "Hospital Management System",
        address: process.env.EMAIL_USER as string,
      },
      to: email,
      subject: "Welcome to Hospital Management System! 🎉",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h1 style="color: #667eea; font-size: 28px;">🎉 Welcome, ${name}!</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Your email has been verified successfully. You're all set to use Hospital Management System as a <strong>${role}</strong>.
                      </p>
                      <p style="color: #666666; font-size: 16px;">
                        Get started by logging into your account!
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    // Don't throw error for welcome email - it's not critical
  }
}