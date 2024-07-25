/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';

interface Email {
    email: string;
    subject: string;
    text: string;
}

interface NodeMailer {
    createTransport: (options: any) => any;
}

export async function POST(req: Request) {

    const authHeader = req.headers.get("x-api-key");
    if (authHeader !== `${process.env.SERVER_PASSWORD}`) {
        console.error("Unauthorized");
        return new Response("Unauthorized", {
            status: 401,
        });
    }


    const { email, subject, text } = await req.json() as Email;

    if (!email || !subject || !text) {
        return new Response("Email, subject, and text are required", {
            status: 400,
        });
    }

    const nodeMailer = nodemailer as NodeMailer;
    const html = markdownToHtml(text);
    const transporter: any = nodeMailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASSWORD!
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions, function (error: unknown, info: { response: string; }) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        return new Response("Email sent");
    } catch (error) {
        console.error(error);
        return new Response("Error sending email", {
            status: 500,
        });
    }
}

function markdownToHtml(markdown: string) {
    markdown = markdown.replace(/^### (.*)$/gim, '<h3>$1</h3>');
    markdown = markdown.replace(/^## (.*)$/gim, '<h2>$1</h2>');
    markdown = markdown.replace(/^# (.*)$/gim, '<h1>$1</h1>');

    // Convert bold text
    markdown = markdown.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Convert links
    markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Convert unordered lists
    markdown = markdown.replace(/^\s*-\s+(.*)$/gim, '<ul><li>$1</li></ul>');
    markdown = markdown.replace(/<\/ul>\s*<ul>/gim, '');

    // Remove any remaining ##
    markdown = markdown.replace(/## /gim, '<h3>');

    // Convert line breaks

    return markdown.trim();
}