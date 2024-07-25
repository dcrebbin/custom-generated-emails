import { CUSTOM_EMAILS } from "~/app/constants/config";
import { inngest } from "~/innjest/client";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { event, body: "Hello, World!" };
    },
);

export const notification = inngest.createFunction(
    { id: "notification" },
    { event: "notification/send-custom-emails" },
    async ({ event, step }) => {
        console.log("Notification Starting");
        for (const customEmail of CUSTOM_EMAILS) {
            const today = new Date();
            const dayOfWeek = today.getDay();
            if (customEmail.schedule[dayOfWeek] === 1) {
                await step.run("send-custom-email", async () => {
                    await sendCustomEmail(customEmail.topic, customEmail.sendTo, customEmail.subject);
                });
            }
        }
        console.log("Notification Ending");
        return { event, body: "Notification Ended" };
    },
);


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