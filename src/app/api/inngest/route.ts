import { serve } from "inngest/next";
import { inngest } from "~/innjest/client";
import { helloWorld, notification } from "./functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        helloWorld,
        notification,
    ],
});