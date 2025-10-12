/**
 * RSS Feed to Calendar Events Converter
 * For Next.js with TypeScript and date-fns
 * Supports multiple Arizona county/city calendar RSS feeds
 */

import { parseStringPromise } from 'xml2js';
import { parse, setHours, setMinutes } from 'date-fns';

// Available RSS feeds
export const RSS_FEEDS = {
  cochise: 'https://www.cochise.az.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml',
  bisbee: 'https://www.bisbeeaz.gov/RSSFeed.aspx?ModID=1&CID=All-calendar.xml',
} as const;

export type FeedSource = keyof typeof RSS_FEEDS;

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  date: string | Date;
  startTime: string | null;
  endTime: string | null;
  startDateTime: Date | null;
  endDateTime: Date | null;
  url: string;
  source?: string; // Which feed this came from
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
 * Fetches the RSS feed from the given URL
 */
export async function fetchRSSFeed(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: 'force-cache',
  });
  
  if (!response.ok) {
    console.error({ url, statusText: response.statusText, v: await response.text() })
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
export async function parseRSSToEvents(
  xmlText: string,
  source: string
): Promise<CalendarEvent[]> {
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
      date: eventDate,
      startTime: times.start,
      endTime: times.end,
      startDateTime: createDateTime(eventDate, times.start),
      endDateTime: createDateTime(eventDate, times.end),
      url: link,
      source,
    };
    
    events.push(event);
  });
  
  return events;
}

/**
 * Get calendar events from a specific feed source
 */
export async function getCalendarEvents(
  feedSource: FeedSource | string = 'cochise'
): Promise<CalendarEvent[]> {
  const url = typeof feedSource === 'string' && feedSource in RSS_FEEDS
    ? RSS_FEEDS[feedSource as FeedSource]
    : feedSource;
  
  const source = typeof feedSource === 'string' && feedSource in RSS_FEEDS
    ? feedSource
    : new URL(url).hostname;
  
  const xmlText = await fetchRSSFeed(url);
  const events = await parseRSSToEvents(xmlText, source);
  return events;
}

/**
 * Get calendar events from all configured feeds
 */
export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  const feedPromises = Object.entries(RSS_FEEDS).map(([source, url]) =>
    fetchRSSFeed(url)
      .then(xmlText => parseRSSToEvents(xmlText, source))
      .catch(error => {
        console.error(`Error fetching ${source} feed:`, error);
        return [];
      })
  );
  
  const allEvents = await Promise.all(feedPromises);
  return allEvents.flat().sort((a, b) => {
    if (!a.startDateTime || !b.startDateTime) return 0;
    return a.startDateTime.getTime() - b.startDateTime.getTime();
  });
}