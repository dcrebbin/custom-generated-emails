export const SONAR_SMALL = "llama-3-sonar-small-32k-online";
export const SONAR_LARGE = "llama-3-sonar-large-32k-online";

export const PROMPT_RULES = 'Add the url in markdown to each result.';

export const CUSTOM_EMAILS: CustomEmail[] = [
    {
        topic: "Retrieve the latest funding/grant programs for anything related to non-profit AI, Indigenous/Endangered languages or Australian Indigenous funding.",
        subject: "Ourland: New potential funding opportunities",
        schedule: [1, 0, 1, 0, 1, 0, 0],
        sendTo: "devon@land.org.au"
    },
]

export interface CustomEmail {
    topic: string; // The research topic
    subject: string; // The email subject
    schedule: number[]; // The days of the week to send the email (0 = Sunday, 1 = Monday, etc.)
    sendTo: string; // The email address to send the email to
}