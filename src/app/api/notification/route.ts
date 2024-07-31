import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    console.log("All headers:", Object.fromEntries(request.headers));

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    const headers = new Headers();
    headers.set("x-api-key", process.env.SERVER_API_KEY ?? "");

    console.log("Authorized");
    void fetch(`${process.env.SERVER_URL}/api/notification`, {
        method: "POST",
        headers: headers,
    });

    return new Response("OK", {
        status: 200,
    });
}