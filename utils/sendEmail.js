import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
    // Check if email config exists, else use Ethereal or just log
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        const smtpHost = process.env.SMTP_HOST.trim();
        const smtpPort = parseInt(process.env.SMTP_PORT, 10);
        const smtpUser = process.env.SMTP_USER.trim();
        const smtpPass = process.env.SMTP_PASS.trim();

        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
        });
    } else {
        // Fallback for demo: just log the email content
        console.log("--- EMAIL MOCK ---");
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log("------------------");
        return;
    }

    const message = {
        from: `${process.env.FROM_NAME || 'MediAI Healthcare'} <${process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@mediai.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        ...(options.html && { html: options.html })
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
