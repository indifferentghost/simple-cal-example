import { eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameDay, isSameMonth, isThisMonth, isToday, isWeekend, startOfMonth, startOfWeek } from "date-fns";
import { remember } from "@epic-web/remember";
import { ShowMoreDialog } from "~/components/showMoreDialog";

import { getCalendarEvents } from "./getCalendarEvents";
import { fetchAndParseICS } from "./getHeraldEvents";
import { cn } from "~/lib/utils";
import { CalendarListItem } from "~/components/calenderListItem";

const useCal = (date = new Date()) => {
  return {
    days: eachDayOfInterval({ start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date)) }),
    month: format(date, 'MMMM'),
    year: format(date, 'RRRR')
  } as const;
};

const getEvents = async () => {
  return await remember('events', async () => {
    const [...events] = await Promise.all([
      getCalendarEvents(),
      getCalendarEvents('bisbee'),
      fetchAndParseICS('https://timelyapp.time.ly/api/calendars/54738062/export?format=ics&target=copy')
    ]);

    return events.flat();
  });
};

const useDailyEvents = async (day: Date) => {
  const events = await getEvents();
  return events.filter(event => isSameDay(event.date, day))
}

// Array of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const dayNames = ((date = new Date()) => eachDayOfInterval({ start: startOfWeek(date), end: endOfWeek(date) }).map((date) => format(date, 'EEEE')))()

const DaysOfWeek = () => (
  <div className="grid grid-cols-1 gap-px border-b-2 border-ring bg-border md:grid-cols-7">
    {dayNames.map(day => (
      <div key={day} className={cn("px-4 py-4 text-center font-semibold md:py-6", ['Sunday', 'Saturday'].includes(day) ? 'bg-blue-200 text-secondary-foreground' : 'bg-muted text-muted-foreground')}>
        <span className="text-base md:text-lg lg:text-xl" aria-label={day}>
          {day}
        </span>
      </div>
    ))}
  </div>
);


export default async function Home() {
  const { days } = useCal();

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg">
      <DaysOfWeek />
      <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-7">
        {/* {Array.from({ length: getDay(days[0]) }, (_, index) => (
          <div key={`placeholder-${index}`} className="p-3 md:min-h-[160px] lg:min-h-[200px] lg:p-4 flex flex-col"></div>
        ))} */}
        {days.map((day, index) => <Calendar day={day} index={index} />)}
      </div>
    </div>
  );
}

const Calendar = async ({ day, index }: { day: Date, index: number }) => {
  const dayEvents = isThisMonth(day) ? await useDailyEvents(day) : [];
  const { month, year } = useCal(day)
  return (
    <div
      key={`day-${index}`}
      className={cn('min-h-[120px] bg-card p-3 md:min-h-[160px] lg:min-h-[200px] lg:p-4 flex flex-col',{ "bg-muted": !isThisMonth(day) })}
      role={day ? "gridcell" : "presentation"}
      aria-label={day ? `${[month]} ${day}, ${year}` : undefined}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold md:h-12 md:w-12 md:text-2xl',
            isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground",
            { 
              'text-muted-foreground': !isThisMonth(day),
              'text-secondary-foreground': isWeekend(day)
            }
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      <ul className="space-y-1 list-none">
        {dayEvents.slice(0, 3).map((event, index) => (
          <CalendarListItem url={event.url} title={event.title} key={`event-${index}`} />
        ))}
      </ul>
      {dayEvents.length > 3 ? (
        <ShowMoreDialog events={dayEvents} />
      ) : null}
    </div>
  )
}