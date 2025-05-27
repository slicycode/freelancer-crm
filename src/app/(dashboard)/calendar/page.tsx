import { getCalendarEvents } from "@/app/actions/calendar";
import { CalendarView } from "@/components/calendar-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar - FreelancerCRM",
  description: "Manage your schedule and appointments",
};

export default async function CalendarPage() {
  const events = await getCalendarEvents();

  return (
    <div className="flex flex-col h-full">
      <CalendarView events={events} />
    </div>
  );
} 