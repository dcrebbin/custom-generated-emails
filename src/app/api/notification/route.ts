import { CUSTOM_EMAILS } from "~/app/constants/config";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("Unauthorized");
        return new Response("Unauthorized", {
            status: 401,
        });
    }

    for (const customEmail of CUSTOM_EMAILS) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        if (customEmail.schedule[dayOfWeek] === 1) {
            await sendCustomEmail(customEmail.topic, customEmail.sendTo, customEmail.subject);
        }
    }
    return new Response("OK", {
        status: 200,
    });
}

async function sendCustomEmail(query: string, email: string, subject: string) {

    const perplexity = await fetch(`${process.env.SERVER_URL}/api/perplexity`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SERVER_PASSWORD}`,
        },
        body: JSON.stringify({
            query: query,
        }),
    });
    const perplexityData = await perplexity.text();
    const emailSent = await fetch(`${process.env.SERVER_URL}/api/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SERVER_PASSWORD}`,
        },
        body: JSON.stringify({
            email: email,
            subject: subject,
            text: perplexityData,
        }),
    });
    const emailSentData = await emailSent.text();
    console.log(emailSentData);
    return new Response(emailSentData, {
        status: 200,
    });
}