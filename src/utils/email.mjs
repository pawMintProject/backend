// Import required packages
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'; // in local, run `npm install dotenv` if needed
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Load environment variables from .env file
dotenv.config();

// Create reusable transporter object using the SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    },

});




export const SendEmail = async (body, email, id) => {



    // Email options
    const mailOptions = {
        from: `<${process.env.MAIL_FROM}>`, // Sender address
        to: email, // List of receivers
        subject: 'پشتیبانی سوت پی', // Subject line
        //         text: `
        //         سلام ${id} عزیز،

        //         ${body}

        // اگر این درخواست را شما ارسال نکرده‌اید، لطفاً فوراً با پشتیبانی ما تماس بگیرید.  

        // با احترام،  
        // تیم سوت‌پی  
        // sootpay.com
        //          `, // Plain text body
        html: `<p dir='rtl'>
        کاربر عزیز یه شماره همراه ${id}
        <br>

        ${body}
<br>

اگر این درخواست را شما ارسال نکرده‌اید، لطفاً فوراً با پشتیبانی ما تماس بگیرید.  
<br>

با احترام،  <br>

تیم سوت‌پی  <br>

sootpay.com
         </p>`, // HTML body
        headers: {
            "x-liara-tag": "real_email", // Tags 
        },
    };

    // Send email
    await transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            return console.log('Error occurred: ' + error.message);
        }
        try {
            // await prisma.userEmailsSended.create({ data: { content: mailOptions.html, email: email, userId: id } })
        } catch (error) {
            console.log(error, "--------------------- error create log of email")
        }
        console.log('Email sent: ' + info.response);
    });




}