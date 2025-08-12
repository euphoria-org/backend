exports.getBaseTemplate = (title, content, primaryColor = "#007bff") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', Arial, sans-serif;
                line-height: 1.6;
                background-color: #f8fafc;
                color: #334155;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                border-radius: 16px;
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, ${primaryColor} 0%, #4f46e5 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .header p {
                font-size: 16px;
                margin-top: 8px;
                opacity: 0.9;
                font-weight: 300;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 20px;
            }
            
            .message {
                font-size: 16px;
                line-height: 1.7;
                color: #475569;
                margin-bottom: 30px;
            }
            
            .info-box {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-left: 4px solid ${primaryColor};
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            
            .info-box h3 {
                color: #1e293b;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
            }
            
            .credentials {
                background-color: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .credential-item:last-child {
                border-bottom: none;
            }
            
            .credential-label {
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
                font-size: 14px;
                color: #1f2937;
                word-break: break-all;
            }
            
            .button {
                display: inline-block;
                background: linear-gradient(135deg, ${primaryColor} 0%, #4f46e5 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
                transition: all 0.3s ease;
                margin: 20px 0;
            }
            
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
            }
            
            .button-center {
                text-align: center;
                margin: 30px 0;
            }
            
            .warning {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
            }
            
            .warning-icon {
                color: #d97706;
                font-weight: bold;
                margin-right: 8px;
            }
            
            .warning-text {
                color: #92400e;
                font-weight: 500;
                font-size: 14px;
            }
            
            .features {
                margin: 25px 0;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                margin: 12px 0;
                padding: 8px 0;
            }
            
            .feature-icon {
                width: 24px;
                height: 24px;
                background-color: ${primaryColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            
            .footer {
                background-color: #f8fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer-content {
                color: #64748b;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .footer-links {
                margin-top: 20px;
            }
            
            .footer-link {
                color: ${primaryColor};
                text-decoration: none;
                margin: 0 10px;
                font-weight: 500;
            }
            
            .social-icons {
                margin-top: 20px;
            }
            
            .social-icon {
                display: inline-block;
                width: 40px;
                height: 40px;
                background-color: ${primaryColor};
                border-radius: 50%;
                margin: 0 8px;
                text-decoration: none;
                color: white;
                font-weight: bold;
                line-height: 40px;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header, .content, .footer {
                    padding: 20px 15px;
                }
                
                .credential-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .credential-value {
                    width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div style="padding: 20px 10px; background-color: #f8fafc; min-height: 100vh;">
            <div class="email-container">
                ${content}
                <div class="footer">
                    <div class="footer-content">
                        <p><strong>MBTI Personality Test Platform</strong></p>
                        <p>Discover your personality type and unlock your potential</p>
                        <div class="footer-links">
                            <a href="#" class="footer-link">Privacy Policy</a>
                            <a href="#" class="footer-link">Terms of Service</a>
                            <a href="#" class="footer-link">Contact Support</a>
                        </div>
                        <p style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                            This is an automated email. Please do not reply to this message.<br>
                            If you have questions, contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
exports.getWelcomeTemplate = (name, email, password) => {
  const content = `
    <div class="header">
        <h1>🎉 Welcome to MBTI App!</h1>
        <p>Your journey to self-discovery begins here</p>
    </div>
    
    <div class="content">
        <div class="greeting">Hello ${name}! 👋</div>
        
        <div class="message">
            Thank you for joining MBTI App! We're excited to have you on board. Your account has been successfully created using Google authentication.
        </div>
        
        <div class="info-box">
            <h3>🔐 Your Account Credentials</h3>
            <p>For your convenience, we've also created manual login credentials that you can use as an alternative to Google Sign-In:</p>
        </div>
        
        <div class="credentials">
            <div class="credential-item">
                <span class="credential-label">📧 Email Address:</span>
                <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">🔑 Temporary Password:</span>
                <span class="credential-value">${password}</span>
            </div>
        </div>
        
        <div class="warning">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
                <strong>Important Security Notice:</strong> For your account security, we strongly recommend changing this temporary password after your first login using manual credentials.
            </span>
        </div>
        
        <div class="features">
            <h3 style="margin-bottom: 15px; color: #1e293b;">🚀 What you can do now:</h3>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <span>Sign in using your Google account (recommended)</span>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <span>Use email and password for manual login</span>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <span>Take comprehensive MBTI personality tests</span>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <span>View detailed personality analysis and insights</span>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <span>Track your personality development journey</span>
            </div>
        </div>
        
        <div class="button-center">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/login" class="button">
                🚀 Start Your Journey
            </a>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
            <h4 style="color: #374151; margin-bottom: 10px;">💡 Getting Started Tips:</h4>
            <ul style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                <li>Complete your profile for personalized insights</li>
                <li>Take your time with the MBTI test for accurate results</li>
                <li>Explore different personality dimensions</li>
                <li>Join our community for discussions and growth</li>
            </ul>
        </div>
    </div>
  `;

  return exports.getBaseTemplate("Welcome to MBTI App", content, "#10b981");
};

exports.getPasswordResetTemplate = (name, resetToken) => {
  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/reset-password?token=${resetToken}`;

  const content = `
    <div class="header">
        <h1>🔐 Password Reset Request</h1>
        <p>Secure your account with a new password</p>
    </div>
    
    <div class="content">
        <div class="greeting">Hello ${name}! 👋</div>
        
        <div class="message">
            We received a request to reset your password for your MBTI App account. If you made this request, click the button below to create a new password.
        </div>
        
        <div class="button-center">
            <a href="${resetUrl}" class="button">
                🔑 Reset Your Password
            </a>
        </div>
        
        <div class="info-box">
            <h3>🛡️ Security Information</h3>
            <div style="font-size: 14px; line-height: 1.6;">
                <p><strong>Reset Link Expires:</strong> 1 hour from now</p>
                <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> Protected for your privacy</p>
            </div>
        </div>
        
        <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1;">
            <p style="font-size: 14px; color: #475569; margin: 0;">
                <strong>Alternative method:</strong> If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div style="margin-top: 10px; padding: 10px; background-color: #fff; border-radius: 6px; border: 1px solid #e2e8f0; word-break: break-all; font-family: monospace; font-size: 12px; color: #374151;">
                ${resetUrl}
            </div>
        </div>
        
        <div class="warning">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
                <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact our support team if you have security concerns.
            </span>
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
            <h4 style="color: #065f46; margin-bottom: 8px; font-size: 14px;">🔒 Password Security Tips:</h4>
            <ul style="color: #047857; font-size: 13px; line-height: 1.5; margin: 0; padding-left: 15px;">
                <li>Use at least 8 characters with mixed case letters</li>
                <li>Include numbers and special characters</li>
                <li>Avoid common words or personal information</li>
                <li>Don't reuse passwords from other accounts</li>
            </ul>
        </div>
    </div>
  `;

  return exports.getBaseTemplate(
    "Password Reset - MBTI App",
    content,
    "#ef4444"
  );
};

exports.getVerificationTemplate = (name, verificationToken) => {
  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/verify-email?token=${verificationToken}`;

  const content = `
    <div class="header">
        <h1>📧 Verify Your Email</h1>
        <p>Complete your account setup</p>
    </div>
    
    <div class="content">
        <div class="greeting">Welcome ${name}! 🎉</div>
        
        <div class="message">
            Thank you for creating your MBTI App account! To complete your registration and ensure account security, please verify your email address.
        </div>
        
        <div class="button-center">
            <a href="${verificationUrl}" class="button">
                ✅ Verify Email Address
            </a>
        </div>
        
        <div class="info-box">
            <h3>🎯 Why verify your email?</h3>
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">🔐</div>
                    <span>Secure your account and enable password recovery</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📱</div>
                    <span>Receive important account notifications</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎁</div>
                    <span>Unlock premium features and insights</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <span>Get personalized MBTI reports via email</span>
                </div>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 14px; color: #64748b; text-align: center;">
            <p>Verification link expires in 24 hours</p>
        </div>
    </div>
  `;

  return exports.getBaseTemplate(
    "Verify Your Email - MBTI App",
    content,
    "#8b5cf6"
  );
};
