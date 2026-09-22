import type { RailwayNotice } from "@/types";
import { dateOffset } from "@/lib/format";
export function sampleNotices(): RailwayNotice[] {
  return [
    {
      id: "notice-1",
      title: "Allow a little extra time for your journey",
      date: dateOffset(-1),
      category: "Service update",
      description:
        "Sample service notice: maintenance work may affect selected hill-country services. Arrive at your station 30 minutes before departure and check your platform at the station.",
      published: true,
    },
    {
      id: "notice-2",
      title: "Weekend journeys to the hill country",
      date: dateOffset(-2),
      category: "Special service",
      description:
        "Sample announcement: additional weekend services are shown in this demonstration. All departure times, seat counts and fares are illustrative.",
      published: true,
    },
    {
      id: "notice-3",
      title: "Keep your e-ticket ready before boarding",
      date: dateOffset(-4),
      category: "Announcement",
      description:
        "For this demo, you can download or print a sample e-ticket after completing a mock booking. Demo tickets and QR placeholders are not valid for travel.",
      published: true,
    },
    {
      id: "notice-4",
      title: "Coastal line timetable update",
      date: dateOffset(-5),
      category: "Schedule change",
      description:
        "Sample schedule change: selected coastal departures have been updated in the demonstration timetable. Check the journey search for available sample services.",
      published: true,
    },
  ];
}
