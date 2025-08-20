const nodemailer = require("nodemailer");
const {
  getWelcomeTemplate,
  getPasswordResetTemplate,
  getVerificationTemplate,
} = require("./emailTemplatesProfessional");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.NODEMAIL_HOST,
    port: process.env.NODEMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.NODEMAIL_EMAIL,
      pass: process.env.NODEMAIL_APP_PASSWORD,
    },
  });
};

exports.sendWelcomeEmailWithCredentials = async (email, name, password) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MBTI Personality Platform" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: "Welcome to MBTI Platform - Account Created Successfully",
      html: getWelcomeTemplate(name, email, password),

      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        Importance: "Normal",
        "List-Unsubscribe": `<mailto:${process.env.NODEMAIL_EMAIL}?subject=unsubscribe>`,
      },
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MBTI Personality Platform" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: "Password Reset Request - MBTI Platform",
      html: getPasswordResetTemplate(name, resetToken),
      headers: {
        "X-Priority": "2",
        "X-MSMail-Priority": "High",
        Importance: "High",
        "List-Unsubscribe": `<mailto:${process.env.NODEMAIL_EMAIL}?subject=unsubscribe>`,
      },
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

exports.sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MBTI Personality Platform" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: "Email Verification Required - MBTI Platform",
      html: getVerificationTemplate(name, verificationToken),
      headers: {
        "X-Priority": "2",
        "X-MSMail-Priority": "High",
        Importance: "High",
        "List-Unsubscribe": `<mailto:${process.env.NODEMAIL_EMAIL}?subject=unsubscribe>`,
      },
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

exports.sendNotificationEmail = async (
  email,
  name,
  subject,
  message,
  buttonText = null,
  buttonUrl = null
) => {
  try {
    const transporter = createTransporter();

    const content = `
      <div class="header">
          <h1>📢 ${subject}</h1>
          <p>Important update from MBTI App</p>
      </div>
      
      <div class="content">
          <div class="greeting">Hello ${name}! 👋</div>
          
          <div class="message">
              ${message}
          </div>
          
          ${
            buttonText && buttonUrl
              ? `
          <div class="button-center">
              <a href="${buttonUrl}" class="button">
                  ${buttonText}
              </a>
          </div>
          `
              : ""
          }
      </div>
    `;

    const { getBaseTemplate } = require("./emailTemplates");

    const mailOptions = {
      from: `"MBTI Personality App" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: `${subject} - MBTI App`,
      html: getBaseTemplate(subject, content, "#3b82f6"),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Notification email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"MBTI App" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: "Password Reset Request - MBTI App",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          
          <p>Dear ${name},</p>
          
          <p>We received a request to reset your password for your MBTI App account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
            ${resetUrl}
          </p>
          
          <p style="color: #dc3545;"><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
          
          <p>Best regards,<br>MBTI App Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};
