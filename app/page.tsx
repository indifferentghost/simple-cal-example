import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isToday, startOfMonth, startOfWeek } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { remember } from "@epic-web/remember";
import { ShowMoreDialog } from "~/components/showMoreDialog";

import { getCalendarEvents } from "./getCalendarEvents";
import { fetchAndParseICS } from "./getHeraldEvents";
import { cn } from "~/lib/utils";
import { CalendarListItem } from "~/components/calenderListItem";

const useCal = (date = new Date()) => {
  return {
    days: eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) }),
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
    ])

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
  <div className="grid grid-cols-1 gap-px border-b border-border bg-border md:grid-cols-7">
    {dayNames.map(day => (
      <div key={day} className="bg-muted px-4 py-4 text-center font-semibold text-muted-foreground md:py-6">
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
        {days.map((day, index) => <Calendar day={day} index={index} />)}
      </div>
    </div>)
}

const Calendar = async ({ day, index }: { day: Date, index: number }) => {
  const dayEvents = await useDailyEvents(day);
  const { month, year } = useCal(day)
  return (
    <div
      key={`day-${index}`}
      className={cn('min-h-[120px] bg-card p-3 md:min-h-[160px] lg:min-h-[200px] lg:p-4 flex flex-col', { "bg-muted/30": !day })}
      role={day ? "gridcell" : "presentation"}
      aria-label={day ? `${[month]} ${day}, ${year}` : undefined}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold md:h-12 md:w-12 md:text-2xl',
            isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
          )}
        >
          {format(day, 'd')}
        </span>
        {dayEvents.length > 0 ? (
          <Badge variant="secondary" className="text-sm font-semibold">
            {dayEvents.length}
          </Badge>
        ) : null}
      </div>


      <ul className="space-y-1 list-none">
        {dayEvents.slice(0, 3).map((event, index) => (
          <CalendarListItem title={event.title} key={`event-${index}`} />
        ))}
      </ul>
      {dayEvents.length > 4 ? (
        <ShowMoreDialog events={dayEvents} />
      ) : null}
    </div>
  )
}