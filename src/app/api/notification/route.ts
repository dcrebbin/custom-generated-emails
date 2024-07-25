import { type NextRequest } from "next/server";
import { CUSTOM_EMAILS } from "~/app/constants/config";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    console.log("All headers:", Object.fromEntries(request.headers));

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }
    console.log("Authorized");

    for (const customEmail of CUSTOM_EMAILS) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        if (customEmail.schedule[dayOfWeek] === 1) {
            void sendCustomEmail(customEmail.topic, customEmail.sendTo, customEmail.subject);
        }
    }
    return new Response("OK", {
        status: 200,
    });
}

async function perplexity(query: string) {
    console.log("Perplexity Request Starting");
    const perplexity = await fetch(`${process.env.SERVER_URL}/api/perplexity`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": `${process.env.SERVER_PASSWORD}`,
        },
        body: JSON.stringify({
            query: query,
        }),
    });
    console.log("Perplexity Request Ending");
    return perplexity;
}

async function openAi(query: string) {
    console.log("OpenAI Request Starting");
    const res = await fetch(`${process.env.SERVER_URL}/api/open-ai`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": `${process.env.SERVER_PASSWORD}`,
        },
        body: JSON.stringify({
            query: query,
        }),
    });
    console.log("OpenAI Request Ending");
    return res;
}

async function sendCustomEmail(query: string, email: string, subject: string) {
    console.log("Send Custom Email Starting");
    const res = process.env.USE_OPEN_AI == "true" ? await openAi(query) : await perplexity(query);
    const data = await res.text();
    const emailSent = await fetch(`${process.env.SERVER_URL}/api/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": `${process.env.SERVER_PASSWORD}`,
        },
        body: JSON.stringify({
            email: email,
            subject: subject,
            text: data,
        }),
    });
    const emailSentData = await emailSent.text();
    console.log("Send Custom Email Ending");
    console.log(emailSentData);
    return new Response(data, {
        status: 200,
    });
}