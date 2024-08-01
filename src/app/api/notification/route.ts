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

    try {
        const res = await fetch(`${process.env.SERVER_URL}/api/notification`, {
            method: "POST",
            headers: headers,
        });

        const data: unknown = await res.text();

        return new Response(JSON.stringify(data), {
            status: 200,
        });
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', {
            status: 500,
        });
    }
}