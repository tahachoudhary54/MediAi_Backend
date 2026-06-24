import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function testEmail() {
    try {
        console.log("Testing SMTP connection...");
        await transporter.verify();
        console.log("SMTP connection verified successfully!");
    } catch (error) {
        console.error("SMTP Error:", error);
    }
}

testEmail();
