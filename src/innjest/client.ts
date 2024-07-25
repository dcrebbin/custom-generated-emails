import { Inngest } from "inngest";
export const inngest = new Inngest({ id: "gimmie", signingKey: process.env.INNGEST_EVENT_KEY });