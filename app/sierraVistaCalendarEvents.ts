import * as cheerio from "cheerio";
import { parse, set } from "date-fns";
import { CalendarEvent } from "./getCalendarEvents";

// export const dynamic = 'force-status'
// export const revalidate = false
// export const fetchCache = 'force-cache'

async function fetchEventDetails(url: string): Promise<CalendarEvent> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const description = $('div.detail-content span[itemprop="description"]')
    .text().trim();

  const locationName = $('span[itemprop="location"] span[itemprop="name"]')
    .text().trim();
  const locationAddress = $('span[itemprop="address"]').text().trim().replace(
    /\s+/g,
    " ",
  );
  const location = locationAddress
    ? `${locationName}, ${locationAddress}`
    : locationName;

  // Extract date and time from detail page
  const dateTimeText = $(".detail-list-value").first().text().trim();
  const dateTimeMatch = dateTimeText.match(
    /(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/,
  );

  let startDateTime: Date | null = null;

  if (!dateTimeMatch) {
    throw new Error("Unable to find date and time");
  }
  const [, dateStr, startTime] = dateTimeMatch;
  const date = parse(dateStr, "MM/dd/yyyy", new Date());
  startDateTime = parse(
    `${dateStr} ${startTime}`,
    "MM/dd/yyyy h:mm a",
    new Date(),
  );

  return {
    description,
    location,
    date,
    startTime,
    endTime: null,
    title: "",
    endDateTime: null,
    url,
    startDateTime,
    source: 'none'
  };
}

export async function scrapeCalendar(): Promise<CalendarEvent[]> {
  return [];
  // const baseUrl = "https://www.sierravistaaz.gov";
  // const calendarUrl = `${baseUrl}/our-city/calendar`;

  // try {
  //   const response = await fetch(calendarUrl);
  //   const html = await response.text();
  //   const $ = cheerio.load(html);
  //   const events: CalendarEvent[] = [];

  //   // Extract month and year from calendar header
  //   const calendarHeader = $(".calendar_month, .calendar_header, h2, h1")
  //     .text();
  //   const monthYearMatch = calendarHeader.match(/(\w+)\s+(\d{4})/);
  //   const currentYear = monthYearMatch
  //     ? parseInt(monthYearMatch[2])
  //     : new Date().getFullYear();
  //   const currentMonth = monthYearMatch
  //     ? parse(monthYearMatch[1], "MMMM", new Date()).getMonth()
  //     : new Date().getMonth();

  //   // Find all calendar day cells with events
  //   $(".calendar_day_with_items").each((_, dayCell) => {
  //     const $dayCell = $(dayCell);

  //     const dayNumber = parseInt($dayCell.contents().first().text().trim());
  //     if (isNaN(dayNumber)) return;

  //     const date = new Date(currentYear, currentMonth, dayNumber);

  //     // Process each event in this day
  //     $dayCell.find(".calendar_item").each((_, item) => {
  //       const $item = $(item);

  //       const startTime = $item.find(".calendar_eventtime").text().trim();
  //       const $link = $item.find(".calendar_eventlink");
  //       const title = $link.attr("title") || $link.text().trim();
  //       const relativeUrl = $link.attr("href");

  //       if (!title || !relativeUrl) return;

  //       const url = relativeUrl.startsWith("http")
  //         ? relativeUrl
  //         : `${baseUrl}${relativeUrl}`;

  //       events.push({
  //         title,
  //         description: "",
  //         location: "",
  //         date,
  //         startTime: startTime || null,
  //         endTime: null,
  //         startDateTime: null,
  //         endDateTime: null,
  //         url,
  //       });
  //     });
  //   });

  //   // Fetch details for each event
  //   for (const event of events) {
  //     try {
  //       const details = await fetchEventDetails(event.url);
  //       event.description = details.description || "";
  //       event.location = details.location || "";

  //       // Override with more accurate date/time from detail page
  //       if (details.date) event.date = details.date;
  //       if (details.startTime) event.startTime = details.startTime;
  //       if (details.startDateTime) event.startDateTime = details.startDateTime;
  //     } catch (e) {
  //       console.log(`couldn't parse ${event.url} ${event.title}`, (e as Error).message);
  //       continue;
  //     }
  //   }

  //   return events;
  // } catch (error) {
  //   console.error("Error scraping calendar:", error);
  //   throw error;
  // }
}
