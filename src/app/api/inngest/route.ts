import { serve } from "inngest/next";
import { inngest } from "~/innjest/client";
import { helloWorld, notification } from "./functions";
import { openAi } from "../open-ai/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    streaming: "allow",
    signingKey: process.env.INNGEST_SIGNING_KEY,
    functions: [
        helloWorld,
        notification,
        openAi
    ],
});