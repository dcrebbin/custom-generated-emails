import { HydrateClient } from "~/trpc/server";
import EmailTemplate from "./_components/email-template";
import { CUSTOM_EMAILS } from "./constants/config";

export default async function Home() {
    return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center pt-10 bg-black text-white">
        <h1 className="text-4xl font-bold">Gimmie.me</h1>
        <p className="text-lg text-center">Get the latest info on what you need<br></br> Sent straight to your inbox ✈️</p>
        <div className="flex flex-col gap-4">
          <hr className="w-full" />
          <p className="text-xs italic text-center">Custom Emails are editable via `./src/app/constants/config.ts`</p>
          {CUSTOM_EMAILS.map((customEmail) => (
            <div className="flex flex-col gap-2 mt-4" key={customEmail.topic.replace(/\s+/g, '-')}>
              <EmailTemplate customEmail={customEmail} />
              <hr className="w-full" />
            </div>
          ))}
        </div>
      </main>
    </HydrateClient >
  );
}
