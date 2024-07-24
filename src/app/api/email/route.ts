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

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SERVER_PASSWORD}`) {
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
    const html = convertMarkdownToHtml(text);

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

function convertMarkdownToHtml(markdown: string) {
    // Convert headers
    markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Convert bold and italic
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert links
    markdown = markdown.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Convert unordered lists
    markdown = markdown.replace(/^\* (.*$)/gm, '<ul>\n<li>$1</li>\n</ul>');
    markdown = markdown.replace(/<\/ul>\n<ul>/g, '');

    // Convert ordered lists
    markdown = markdown.replace(/^\d+\. (.*$)/gm, '<ol>\n<li>$1</li>\n</ol>');
    markdown = markdown.replace(/<\/ol>\n<ol>/g, '');

    // Convert paragraphs
    markdown = markdown.replace(/^(?!<[uo]l|<h)\s*([^\n]+)/gm, '<p>$1</p>');

    return markdown;
}