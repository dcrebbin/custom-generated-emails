import { type CustomEmail } from "../constants/config";

export default function EmailTemplate({ customEmail }: { customEmail: CustomEmail }) {

    function indexToDay(index: number) {
        return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",][index];
    }

    return <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2">
            <div>
                <h3 className="text-lg font-bold">Subject</h3>
                <input defaultValue={customEmail.subject} className="text-black px-2 rounded-md w-[25rem]" type="text" placeholder="e.g. 'AI'" />
            </div>
            <div>
                <h3 className="text-lg font-bold">Topic</h3>
                <textarea defaultValue={customEmail.topic} className="text-black px-2 rounded-md w-[25rem] h-[10rem]" placeholder="e.g. 'AI'" />
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <div>
                <h3 className="text-lg font-bold">Send to</h3>
                <input defaultValue={customEmail.sendTo} className="text-black px-2 rounded-md" type="text" placeholder="email@example.com" />
            </div>
            <div>
                <h3 className="text-lg font-bold">Schedule</h3>
                {customEmail.schedule.map((day, index) => (
                    <div key={index} className="flex flex-row gap-8">
                        <p className="w-16">{indexToDay(index)}</p>
                        <input defaultChecked={day === 1} className="text-black px-2 rounded-md" type="checkbox" />
                    </div>
                ))}
            </div>
        </div>
    </div>;
}