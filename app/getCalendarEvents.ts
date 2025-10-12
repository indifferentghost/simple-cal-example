/**
 * RSS Feed to Calendar Events Converter
 * For Next.js with TypeScript and date-fns
 */

import { parseStringPromise } from 'xml2js';
import { parse, setHours, setMinutes } from 'date-fns';

const RSS_FEED_URL = 'https://www.cochise.az.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  startDateTime: Date | null;
  endDateTime: Date | null;
  url: string;
}

interface TimeRange {
  start: string | null;
  end: string | null;
}

interface RSSItem {
  title?: string[];
  link?: string[];
  description?: string[];
  'calendarEvent:EventDates'?: string[];
  'calendarEvent:EventTimes'?: string[];
  'calendarEvent:Location'?: string[];
}

interface RSSFeed {
  rss: {
    channel: Array<{
      item?: RSSItem[];
    }>;
  };
}

/**
 * Fetches the RSS feed
 */
export async function fetchRSSFeed(): Promise<string> {
  const response = await fetch(RSS_FEED_URL, {
    cache: 'no-store', // For Next.js dynamic data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }
  
  return response.text();
}

/**
 * Parses time string like "02:00 PM - 11:59 PM"
 */
function parseTime(timeStr: string | undefined): TimeRange {
  if (!timeStr) return { start: null, end: null };
  
  const times = timeStr.split(' - ');
  return {
    start: times[0]?.trim() || null,
    end: times[1]?.trim() || null,
  };
}

/**
 * Creates Date object from date string and time string
 */
function createDateTime(dateStr: string, timeStr: string | null): Date | null {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Parse the date (e.g., "October 11, 2025")
    const baseDate = parse(dateStr, 'MMMM dd, yyyy', new Date());
    
    // Parse the time (e.g., "02:00 PM")
    const timeDate = parse(timeStr, 'hh:mm a', new Date());
    
    // Combine date and time
    const result = setHours(baseDate, timeDate.getHours());
    return setMinutes(result, timeDate.getMinutes());
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return null;
  }
}

/**
 * Parses XML and extracts calendar events
 */
export async function parseRSSToEvents(xmlText: string): Promise<CalendarEvent[]> {
  const result = await parseStringPromise(xmlText) as RSSFeed;
  
  const items = result.rss.channel[0].item || [];
  const events: CalendarEvent[] = [];
  
  items.forEach((item) => {
    const title = item.title?.[0] || '';
    const link = item.link?.[0] || '';
    const description = item.description?.[0] || '';
    const eventDate = item['calendarEvent:EventDates']?.[0]?.trim() || '';
    const eventTimes = item['calendarEvent:EventTimes']?.[0]?.trim() || '';
    const location = item['calendarEvent:Location']?.[0]?.trim() || '';
    
    const times = parseTime(eventTimes);
    
    const event: CalendarEvent = {
      title,
      description: description.replace(/<[^>]*>/g, ''), // Strip HTML tags
      location: location.replace(/<br>/g, ', '),
      date: new Date(eventDate),
      startTime: times.start,
      endTime: times.end,
      startDateTime: createDateTime(eventDate, times.start),
      endDateTime: createDateTime(eventDate, times.end),
      url: link,
    };
    
    events.push(event);
  });
  
  return events;
}

/**
 * Main function to get calendar events
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const xmlText = await fetchRSSFeed();
  return await parseRSSToEvents(xmlText);
}