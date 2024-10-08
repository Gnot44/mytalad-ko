/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

// ตั้งค่า API Key ของ SendGrid
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

// สร้างฟังก์ชันส่งอีเมล์
exports.sendEmail = functions.https.onRequest(async(req, res) => {
    const { nameOrder, deliveryLocation, phoneNumber, trackingNumber } = req.body;

    const msg = {
        to: 'recipient@example.com', // เปลี่ยนเป็นอีเมล์ของผู้รับ
        from: 'sender@example.com', // เปลี่ยนเป็นอีเมล์ของคุณ
        subject: 'New Payment Confirmation',
        html: `
            <h1>Payment Confirmation</h1>
            <p><strong>Name Order:</strong> ${nameOrder}</p>
            <p><strong>Delivery Location:</strong> ${deliveryLocation}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        `,
    };

    try {
        await sgMail.send(msg);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });