'use server'
import { parse } from 'date-fns';

// export const dynamic = 'force-status'
// export const revalidate = false
// export const fetchCache = 'force-cache'

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

function parseICSDate(dateStr: string): Date {
  // Format: YYYYMMDD (all-day events)
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

function unescapeText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export async function parseICS(icsContent: string): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r?\n/);
  
  let inEvent = false;
  let currentEvent: {
    title?: string;
    description?: string;
    location?: string;
    dtstart?: string;
  } = {};
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations (lines starting with space)
    while (i + 1 < lines.length && /^ /.test(lines[i + 1])) {
      i++;
      line += lines[i].substring(1); // Remove leading space
    }
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent.dtstart) {
        const date = parseICSDate(currentEvent.dtstart);
        
        events.push({
          title: currentEvent.title || '',
          description: currentEvent.description || '',
          location: currentEvent.location || '',
          date,
          startTime: null, // All-day events
          endTime: null,
          startDateTime: null,
          endDateTime: null,
          url: ''
        });
      }
      
      inEvent = false;
      currentEvent = {};
    } else if (inEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const fieldPart = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      
      // Get the field name (before any semicolon)
      const fieldName = fieldPart.split(';')[0];
      
      switch (fieldName) {
        case 'SUMMARY':
          currentEvent.title = unescapeText(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = unescapeText(value);
          break;
        case 'LOCATION':
          currentEvent.location = unescapeText(value);
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
      }
    }
  }
  
  return events;
}

export async function fetchAndParseICS(url: string): Promise<CalendarEvent[]> {
  const response = await fetch(url);
  const icsContent = await response.text();
  return parseICS(icsContent);
}