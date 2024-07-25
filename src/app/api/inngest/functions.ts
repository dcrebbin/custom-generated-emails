/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

                const aiData = await step.run("open-ai/query", async () => {
                    return process.env.USE_OPEN_AI ? await openAi(customEmail.topic) : await perplexity(customEmail.topic);
                });

                const emailData = await step.run("send-custom-email", async () => {
                    return await sendEmail(customEmail.sendTo, customEmail.subject, aiData);
                });
                console.log(emailData);
            }
        }
        return { event, body: "Notification Ended" };
    },
);

async function sendEmail(email: string, subject: string, data: string): Promise<string> {
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
    return await emailSent.text();
}


async function perplexity(query: string): Promise<string> {
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
    return await perplexity.text();
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
    return await res.text();
}

