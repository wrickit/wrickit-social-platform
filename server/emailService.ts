import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // For development: Log the email to console instead of sending via SendGrid
  console.log('=== EMAIL VERIFICATION ===');
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log('=== EMAIL CONTENT ===');
  
  // Extract verification code from HTML content
  const codeMatch = params.html.match(/class="code">(\d+)</);
  if (codeMatch) {
    console.log(`VERIFICATION CODE: ${codeMatch[1]}`);
  }
  
  console.log('========================');
  
  // Always return true for development
  return true;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createVerificationEmail(code: string, firstName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #667eea; color: white; padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 3px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Wrickit!</h1>
          <p>Verify your email to complete registration</p>
        </div>
        <div class="content">
          <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
          <p>Thank you for signing up for Wrickit, the social platform for 9th graders.</p>
          <p>To complete your registration, please enter the verification code below:</p>
          
          <div class="code">${code}</div>
          
          <p>This code will expire in 10 minutes for security reasons.</p>
          <p>If you didn't create an account with Wrickit, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Wrickit. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}