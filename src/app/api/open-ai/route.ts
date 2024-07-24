import { PROMPT_RULES } from "~/app/constants/config";

interface SearchResult {
  name: string;
  url: string;
  information: string;
  deepLinks?: unknown;
}

export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SERVER_PASSWORD}`) {
    console.error("Unauthorized");
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const query = await req.json() as string;
  const retrievedWebSearch = await search(query);
  const llmData = await llm(retrievedWebSearch);
  return new Response(JSON.stringify(llmData), {
    status: 200,
  });
}

interface BingSearchResponse {
  webPages: {
    value: Array<{
      name: string;
      url: string;
      snippet: string;
      deepLinks?: unknown;
    }>;
  };
}

async function search(query: string): Promise<SearchResult[]> {
  const searchEndpoint = "https://api.bing.microsoft.com/v7.0/search?q=";
  const headers = new Headers();
  headers.set("Ocp-Apim-Subscription-Key", process.env.BING_API_KEY!);

  const searchResponse = await fetch(`${searchEndpoint}${query}${PROMPT_RULES}`, {
    headers: headers,
  });

  if (!searchResponse.ok) {
    throw new Error(`HTTP error! status: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json() as BingSearchResponse;

  if (!searchData.webPages?.value) {
    throw new Error('Invalid search data');
  }

  const transformedData: SearchResult[] = searchData.webPages.value.map((data) => ({
    name: data.name,
    url: data.url,
    information: data.snippet,
    deepLinks: data.deepLinks,
  }));

  const llmData = await llm(transformedData);
  return parseData(llmData);
}

function parseData(data: string): SearchResult[] {
  try {
    return JSON.parse(data) as SearchResult[];
  } catch (error) {
    console.error("Error parsing data:", error);
    return [];
  }
}

async function llm(searchResponse: unknown): Promise<string> {
  const completionsEndpoint = "https://api.openai.com/v1/chat/completions";
  const model = "gpt-4o-mini";
  const response = await fetch(completionsEndpoint, {
    method: "POST",
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: JSON.stringify(searchResponse) },
      ],
    }),
    headers: {
      Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const mostRelevantData = await response.json() as OpenAiResponse;
  if (!mostRelevantData.choices || mostRelevantData.choices.length === 0) {
    throw new Error('No choices returned from OpenAI');
  }

  const content = mostRelevantData.choices[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('Invalid response format from OpenAI');
  }

  return content;
}

interface OpenAiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}