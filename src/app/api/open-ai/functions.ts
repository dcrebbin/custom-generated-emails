/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PROMPT_RULES } from "~/app/constants/config";
import { inngest } from "~/innjest/client";

interface SearchResult {
  name: string;
  url: string;
  information: string;
  deepLinks?: unknown;
}

export const openAi = inngest.createFunction(
  { id: "open-ai" },
  { event: "open-ai/query" },
  async ({ event, step }) => {
    console.log("Notification Starting");

    const { query } = event.data as { query: string };
    const optimisedSearchQuery = await step.run("optimise-query", async () => {
      return await openAiRequest(`Optimise this natural language query to show the best and latest results in a search engine. Only return the updated query. If the query contains more than 1 request then split it into multiple queries using semi-colons ;. Query: ${query}`);
    });

    const splitQueries = optimisedSearchQuery.split(";");
    const results: string[] = [];
    for (const query of splitQueries) {
      const retrievedWebSearch = await step.run("search", async () => {
        return await search(query.replace(/^\s+|\s+$/g, ""));
      });

      const openAiResponse = await step.run("open-ai-request", async () => {
        return await openAiRequest(`Find the most relevent information todo with this query: ${query} and: ${PROMPT_RULES}. Using this data: ${JSON.stringify(retrievedWebSearch)}. Only return the relevent information`);
      });

      results.push(openAiResponse as string);
    }
    const finalData = await step.run("final-data", async () => {
      return await openAiRequest(`Convert this data into well formatted markdown that includes all elements (headers, bold, italic, links, lists, paragraphs, etc):
  
    Data:${JSON.stringify(results)}
  
    Ensure that all sections are appropriately titled, and lists are properly formatted. ONLY return the markdown. Do not include any other text or code marks i.e: \`\`\` or \`\`\`.`);
    });
    console.log(finalData);
    return { event, body: finalData };
  })


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

async function search(query: string): Promise<unknown> {
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

async function openAiRequest(prompt: string, model = "gpt-4o-mini"): Promise<any> {
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