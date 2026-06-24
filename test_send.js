import sendEmail from './utils/sendEmail.js';

async function testEmail() {
    try {
        console.log("Sending test email...");
        await sendEmail({
            email: 'choudharymustafa2007@gmail.com',
            subject: 'MediAI - Test Email',
            message: 'This is a test email.',
            html: '<b>This is a test email.</b>'
        });
        console.log("Test email sent successfully!");
    } catch (error) {
        console.error("Test email failed:", error);
    }
}

testEmail();
