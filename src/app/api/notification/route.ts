import { type NextRequest } from "next/server";
import { inngest } from "~/innjest/client";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    console.log("All headers:", Object.fromEntries(request.headers));

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    console.log("Authorized");
    await inngest.send({
        name: "notification/send-custom-emails",
    });

    return new Response("OK", {
        status: 200,

    });
}