import * as cheerio from "cheerio";
import { parse, set } from "date-fns";
import { CalendarEvent } from "./getCalendarEvents";

// export const dynamic = 'force-status'
// export const revalidate = false
// export const fetchCache = 'force-cache'

// async function fetchEventDetails(url: string): Promise<CalendarEvent> {
//   const response = await fetch(url);
//   const html = await response.text();
//   const $ = cheerio.load(html);

//   const description = $('div.detail-content span[itemprop="description"]')
//     .text().trim();

//   const locationName = $('span[itemprop="location"] span[itemprop="name"]')
//     .text().trim();
//   const locationAddress = $('span[itemprop="address"]').text().trim().replace(
//     /\s+/g,
//     " ",
//   );
//   const location = locationAddress
//     ? `${locationName}, ${locationAddress}`
//     : locationName;

//   // Extract date and time from detail page
//   const dateTimeText = $(".detail-list-value").first().text().trim();
//   const dateTimeMatch = dateTimeText.match(
//     /(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/,
//   );

//   let startDateTime: Date | null = null;

//   if (!dateTimeMatch) {
//     throw new Error("Unable to find date and time");
//   }
//   const [, dateStr, startTime] = dateTimeMatch;
//   const date = parse(dateStr, "MM/dd/yyyy", new Date());
//   startDateTime = parse(
//     `${dateStr} ${startTime}`,
//     "MM/dd/yyyy h:mm a",
//     new Date(),
//   );

//   return {
//     description,
//     location,
//     date,
//     startTime,
//     endTime: null,
//     title: "",
//     endDateTime: null,
//     url,
//     startDateTime,
//     source: "none",
//   };
// }

export async function scrapeCalendar(): Promise<CalendarEvent[]> {
  const baseUrl = "https://www.sierravistaaz.gov";
  const calendarUrl = "/our-city/calendar";

  const response = await fetch(new URL(calendarUrl, baseUrl), { cache: 'force-cache' });
  const html = await response.text();
  const $ = cheerio.load(html);
  const events: CalendarEvent[] = [];

  // Extract month and year from calendar header
  const calendarHeader = $(".current_month_title")
    .text().trim();

  const [currentMonth, currentYear] = calendarHeader.split(" ");

  // Find all calendar day cells with events
  $(".calendar_day_with_items").each((_, dayCell) => {
    const $dayCell = $(dayCell);

    const dayNumber = parseInt($dayCell.contents().first().text().trim());
    if (isNaN(dayNumber)) return;

    const date = parse(
      `${currentYear} ${currentMonth} ${dayNumber}`,
      "yyyy MMMM d",
      new Date(),
    );

    // Process each event in this day
    $dayCell.find(".calendar_item").each((_, item) => {
      const $item = $(item);

      const startTime = $item.find(".calendar_eventtime").text().trim();
      const $link = $item.find(".calendar_eventlink");
      const title = $link.attr("title") ?? $link.text().trim();
      const relativeUrl = $link.attr("href");

      if (!title || !relativeUrl) return;

      const url = relativeUrl.startsWith("http")
        ? relativeUrl
        : new URL(relativeUrl, baseUrl).toString();

      events.push({
        title,
        description: "",
        location: "",
        date,
        startTime,
        endTime: null,
        startDateTime: parse(startTime, 'p', date),
        endDateTime: null,
        url,
      });
    });
  });

  console.log('total events found for sierra vista calendar:', events.length);

  return events;
}
