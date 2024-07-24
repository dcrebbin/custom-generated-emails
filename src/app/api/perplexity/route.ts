import { PROMPT_RULES, SONAR_LARGE } from "~/app/constants/config";

interface SearchRequest {
    query: string;
}

interface PerplexityResponse {
    choices: {
        message: {
            content: string;
        }
    }[];
}

export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SERVER_PASSWORD}`) {
        console.error("Unauthorized");
        return new Response("Unauthorized", {
            status: 401,
        });
    }

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${process.env.PERPLEXITY_API_KEY}`);
    headers.set("Content-Type", 'application/json; charset=utf-8');

    try {
        const response = await req.json() as SearchRequest;

        const perplexityResponse = await fetch(
            'https://api.perplexity.ai/chat/completions',
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    model: SONAR_LARGE,
                    messages: [{ role: 'user', content: response.query + PROMPT_RULES }],
                })
            }
        );

        const responseContent = (await perplexityResponse.json()) as PerplexityResponse;
        const content = getPerplexityResponse(responseContent);
        if (!content) {
            return new Response("No content", {
                status: 400,
            });
        }
        return new Response(content);
    } catch (error) {
        console.error(error);
        return new Response("Internal Server Error", {
            status: 500,
        });
    }
}

function getPerplexityResponse(response: PerplexityResponse) {
    return response?.choices[0]?.message?.content;
}