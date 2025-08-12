// Professional email templates with anti-spam optimizations and custom color palette
exports.getBaseTemplate = (title, content, primaryColor = "#35063E") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <!--[if mso]>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
        <style>
            /* Import fonts */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            /* CSS Variables for color palette */
            :root {
                --primary: #35063E;
                --primary-light: #4E2460;
                --primary-dark: #230229;
                --secondary: #AA4DC1;
                --accent: #FFB84C;
                --background: #ffffff;
                --text-dark: #000000;
                --text-light: #F5F5F5;
                --gray-light: #E0E0E0;
                --gray-dark: #333333;
            }
            
            /* Reset styles */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            /* Body styles for better email client compatibility */
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                background-color: var(--background);
                color: var(--text-dark);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                margin: 0;
                padding: 0;
                width: 100%;
            }
            
            /* Main container */
            .email-wrapper {
                background-color: #f8f9fa;
                padding: 20px 0;
                width: 100%;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: var(--background);
                border: 1px solid var(--gray-light);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* Header styles */
            .header {
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
                color: var(--text-light);
                padding: 32px 24px;
                text-align: center;
                border-bottom: 1px solid var(--gray-light);
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0;
                letter-spacing: -0.02em;
                line-height: 1.2;
            }
            
            .header p {
                font-size: 14px;
                margin-top: 8px;
                opacity: 0.9;
                font-weight: 400;
            }
            
            /* Content styles */
            .content {
                padding: 32px 24px;
                background-color: var(--background);
            }
            
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-dark);
                margin-bottom: 16px;
                line-height: 1.3;
            }
            
            .message {
                font-size: 16px;
                line-height: 1.6;
                color: var(--gray-dark);
                margin-bottom: 24px;
            }
            
            /* Info box styles */
            .info-box {
                background-color: #f8f9fa;
                border: 1px solid var(--gray-light);
                border-left: 4px solid var(--primary);
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
            }
            
            .info-box h3 {
                color: var(--text-dark);
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                line-height: 1.3;
            }
            
            .info-box p {
                color: var(--gray-dark);
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
            }
            
            /* Credentials display */
            .credentials {
                background-color: #f8f9fa;
                border: 1px solid var(--gray-light);
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .credential-item {
                display: table;
                width: 100%;
                padding: 8px 0;
                border-bottom: 1px solid var(--gray-light);
            }
            
            .credential-item:last-child {
                border-bottom: none;
            }
            
            .credential-label {
                display: table-cell;
                font-weight: 600;
                color: var(--text-dark);
                font-size: 14px;
                width: 30%;
                vertical-align: top;
                padding-right: 12px;
            }
            
            .credential-value {
                display: table-cell;
                font-family: 'Courier New', Consolas, monospace;
                background-color: var(--background);
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--gray-light);
                font-size: 14px;
                color: var(--text-dark);
                word-break: break-all;
                vertical-align: top;
            }
            
            /* Button styles */
            .button {
                display: inline-block;
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
                color: var(--text-light);
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                line-height: 1.2;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .button:hover {
                background: var(--primary-dark);
                text-decoration: none;
                color: var(--text-light);
            }
            
            .button-center {
                text-align: center;
                margin: 24px 0;
            }
            
            /* Warning styles */
            .warning {
                background-color: #fff8e1;
                border: 1px solid #ffcc02;
                border-left: 4px solid var(--accent);
                padding: 16px;
                border-radius: 6px;
                margin: 20px 0;
            }
            
            .warning-text {
                color: #8b4513;
                font-weight: 500;
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
            }
            
            /* Features list */
            .features {
                margin: 20px 0;
            }
            
            .feature-item {
                display: table;
                width: 100%;
                margin: 8px 0;
                padding: 4px 0;
            }
            
            .feature-icon {
                display: table-cell;
                width: 24px;
                height: 24px;
                background-color: var(--primary);
                border-radius: 50%;
                text-align: center;
                line-height: 24px;
                margin-right: 12px;
                color: var(--text-light);
                font-size: 12px;
                font-weight: bold;
                vertical-align: top;
            }
            
            .feature-text {
                display: table-cell;
                font-size: 14px;
                line-height: 1.5;
                color: var(--gray-dark);
                vertical-align: top;
                padding-left: 12px;
            }
            
            /* Footer styles */
            .footer {
                background-color: #f8f9fa;
                padding: 24px;
                text-align: center;
                border-top: 1px solid var(--gray-light);
            }
            
            .footer-content {
                color: var(--gray-dark);
                font-size: 14px;
                line-height: 1.5;
            }
            
            .footer-content strong {
                color: var(--text-dark);
                font-weight: 600;
            }
            
            .footer-links {
                margin-top: 16px;
            }
            
            .footer-link {
                color: var(--primary);
                text-decoration: none;
                margin: 0 8px;
                font-weight: 500;
                font-size: 14px;
            }
            
            .footer-link:hover {
                text-decoration: underline;
            }
            
            .footer-disclaimer {
                margin-top: 16px;
                font-size: 12px;
                color: #6b7280;
                line-height: 1.4;
            }
            
            /* Responsive design */
            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 10px;
                }
                
                .email-container {
                    border-radius: 0;
                    border-left: none;
                    border-right: none;
                }
                
                .header, .content, .footer {
                    padding: 20px 16px;
                }
                
                .credential-item {
                    display: block;
                }
                
                .credential-label {
                    display: block;
                    width: 100%;
                    margin-bottom: 4px;
                }
                
                .credential-value {
                    display: block;
                    width: 100%;
                }
                
                .feature-item {
                    display: block;
                }
                
                .feature-icon {
                    display: inline-block;
                    margin-right: 8px;
                    margin-bottom: 4px;
                }
                
                .feature-text {
                    display: block;
                    padding-left: 0;
                }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .email-container {
                    background-color: var(--background);
                }
            }
            
            /* Outlook specific styles */
            <!--[if mso]>
            .button {
                mso-style-priority: 99;
            }
            <![endif]-->
        </style>
    </head>
    <body>
        <div class="email-wrapper">
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
                        <p class="footer-disclaimer">
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

// Professional welcome email template for Google OAuth users
exports.getWelcomeTemplate = (name, email, password) => {
  const content = `
    <div class="header">
        <h1>Welcome to MBTI Platform</h1>
        <p>Your personality discovery journey starts here</p>
    </div>
    
    <div class="content">
        <div class="greeting">Hello ${name},</div>
        
        <div class="message">
            Thank you for joining our MBTI Personality Test Platform. Your account has been successfully created using Google authentication, and we're excited to help you discover your unique personality type.
        </div>
        
        <div class="info-box">
            <h3>Account Setup Complete</h3>
            <p>We have created manual login credentials for your convenience. You can use these credentials as an alternative to Google Sign-In:</p>
        </div>
        
        <div class="credentials">
            <div class="credential-item">
                <span class="credential-label">Email Address:</span>
                <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${password}</span>
            </div>
        </div>
        
        <div class="warning">
            <p class="warning-text">
                <strong>Security Notice:</strong> For your account security, we strongly recommend changing this temporary password after your first manual login. You can update your password in your account settings.
            </p>
        </div>
        
        <div class="features">
            <h3 style="margin-bottom: 12px; color: var(--text-dark); font-size: 16px;">What you can do now:</h3>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Sign in using your Google account (recommended)</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Use email and password for manual login</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Take comprehensive MBTI personality assessments</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Access detailed personality analysis and insights</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">✓</div>
                <div class="feature-text">Track your personality development over time</div>
            </div>
        </div>
        
        <div class="button-center">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/login" class="button">
                Access Your Account
            </a>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid var(--gray-light);">
            <h4 style="color: var(--text-dark); margin-bottom: 8px; font-size: 14px; font-weight: 600;">Getting Started:</h4>
            <ul style="color: var(--gray-dark); font-size: 14px; line-height: 1.5; margin: 0; padding-left: 16px;">
                <li>Complete your profile for personalized insights</li>
                <li>Take your time with assessments for accurate results</li>
                <li>Explore different personality dimensions and traits</li>
                <li>Review your results and development recommendations</li>
            </ul>
        </div>
    </div>
  `;

  return exports.getBaseTemplate("Welcome to MBTI Platform", content);
};

// Professional password reset email template
exports.getPasswordResetTemplate = (name, resetToken) => {
  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/reset-password?token=${resetToken}`;

  const content = `
    <div class="header">
        <h1>Password Reset Request</h1>
        <p>Secure your account with a new password</p>
    </div>
    
    <div class="content">
        <div class="greeting">Hello ${name},</div>
        
        <div class="message">
            We received a request to reset your password for your MBTI Platform account. If you made this request, please click the button below to create a new password.
        </div>
        
        <div class="button-center">
            <a href="${resetUrl}" class="button">
                Reset Your Password
            </a>
        </div>
        
        <div class="info-box">
            <h3>Security Information</h3>
            <div style="font-size: 14px; line-height: 1.5;">
                <p><strong>Reset Link Expires:</strong> 1 hour from request time</p>
                <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Security:</strong> This link can only be used once</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid var(--gray-light);">
            <p style="font-size: 14px; color: var(--gray-dark); margin: 0;">
                <strong>Alternative method:</strong> If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div style="margin-top: 8px; padding: 8px; background-color: var(--background); border-radius: 4px; border: 1px solid var(--gray-light); word-break: break-all; font-family: monospace; font-size: 12px; color: var(--text-dark);">
                ${resetUrl}
            </div>
        </div>
        
        <div class="warning">
            <p class="warning-text">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and contact our support team if you have security concerns. Your account remains secure.
            </p>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background-color: #f0f9ff; border-radius: 6px; border: 1px solid #bfdbfe;">
            <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px; font-weight: 600;">Password Security Best Practices:</h4>
            <ul style="color: #1e40af; font-size: 13px; line-height: 1.4; margin: 0; padding-left: 16px;">
                <li>Use at least 8 characters with mixed case letters</li>
                <li>Include numbers and special characters</li>
                <li>Avoid common words or personal information</li>
                <li>Don't reuse passwords from other accounts</li>
            </ul>
        </div>
    </div>
  `;

  return exports.getBaseTemplate("Password Reset - MBTI Platform", content);
};

// Professional account verification email template
exports.getVerificationTemplate = (name, verificationToken) => {
  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/verify-email?token=${verificationToken}`;

  const content = `
    <div class="header">
        <h1>Verify Your Email Address</h1>
        <p>Complete your account setup</p>
    </div>
    
    <div class="content">
        <div class="greeting">Welcome ${name},</div>
        
        <div class="message">
            Thank you for creating your MBTI Platform account. To complete your registration and ensure account security, please verify your email address by clicking the button below.
        </div>
        
        <div class="button-center">
            <a href="${verificationUrl}" class="button">
                Verify Email Address
            </a>
        </div>
        
        <div class="info-box">
            <h3>Why verify your email?</h3>
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">Secure your account and enable password recovery</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">Receive important account notifications</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">Access premium features and detailed insights</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">Get personalized MBTI reports via email</div>
                </div>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 14px; color: var(--gray-dark); text-align: center;">
            <p>This verification link expires in 24 hours for security purposes.</p>
        </div>
    </div>
  `;

  return exports.getBaseTemplate("Verify Your Email - MBTI Platform", content);
};
