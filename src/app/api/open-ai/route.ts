import { PROMPT_RULES } from "~/app/constants/config";

interface SearchResult {
  name: string;
  url: string;
  information: string;
  deepLinks?: unknown;
}

export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get("x-api-key");
  if (authHeader !== `${process.env.SERVER_PASSWORD}`) {
    console.error("Unauthorized");
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const { query } = await req.json() as { query: string };
  const optimisedSearchQuery = await openAiRequest(`Optimise this natural language query to show the best and latest results in a search engine. Only return the updated query. If the query contains more than 1 request then split it into multiple queries using semi-colons ;. Query: ${query}`);
  const splitQueries = optimisedSearchQuery.split(";");
  const results = [];
  for (const query of splitQueries) {
    const retrievedWebSearch = await search(query.replace(/^\s+|\s+$/g, ""));
    const openAiRequestData = await openAiRequest(`Find the most relevent information todo with this query: ${query} and: ${PROMPT_RULES}. Using this data: ${JSON.stringify(retrievedWebSearch)}. Only return the relevent information`);
    results.push(openAiRequestData);
  }
  const finalData = await openAiRequest(`Convert this data into well formatted markdown that includes all elements (headers, bold, italic, links, lists, paragraphs, etc):

  Data:${JSON.stringify(results)}

  Ensure that all sections are appropriately titled, and lists are properly formatted. ONLY return the markdown. Do not include any other text or code marks i.e: \`\`\` or \`\`\`.`);
  console.log(finalData);

  return new Response(finalData, {
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

  const searchResponse = await fetch(`${searchEndpoint}${query}`, {
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

  return parseData(JSON.stringify(transformedData));
}

function parseData(data: string): SearchResult[] {
  try {
    return JSON.parse(data) as SearchResult[];
  } catch (error) {
    console.error("Error parsing data:", error);
    return [];
  }
}

async function openAiRequest(prompt: string, model = "gpt-4o-mini"): Promise<string> {
  const completionsEndpoint = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(completionsEndpoint, {
    method: "POST",
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: '',
        },
        { role: "user", content: prompt },
      ],
    }),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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