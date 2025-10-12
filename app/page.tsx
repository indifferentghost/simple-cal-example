import { eachDayOfInterval, endOfMonth, endOfWeek, format, getMonth, isSameDay, isToday, startOfMonth, startOfWeek } from "date-fns";
import { getCalendarEvents } from "./getCalendarEvents";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { ChevronRightIcon, MapPin } from "lucide-react";
import { scrapeCalendar } from "./sierraVistaCalendarEvents";
import { Item, ItemActions, ItemContent, ItemTitle } from "~/components/ui/item";
import { fetchAndParseICS } from "./getHeraldEvents";
// import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Badge } from "lucide-react"



const useCal = (date = new Date()) => {
  return {
    days: eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) }),
    month: format(date, 'MMMM'),
    year: format(date, 'RRRR')
  } as const;
};


// Array of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const dayNames = ((date = new Date()) => eachDayOfInterval({ start: startOfWeek(date), end: endOfWeek(date) }).map((date) => format(date, 'EEEE')))()

const DaysOfWeek = () => <div className="grid grid-cols-1 gap-px border-b border-border bg-border md:grid-cols-7">
  {dayNames.map(day => {
    return <div key={day} className="bg-muted px-4 py-4 text-center font-semibold text-muted-foreground md:py-6">
      <span className="text-base md:text-lg lg:text-xl" aria-label={day}>
        {day}
      </span>
    </div>
  })}
</div>

export default async function Home() {
  const { days, month, year } = useCal();
  const events = await getCalendarEvents();
  const events4 = await getCalendarEvents('bisbee');
  const events2 = await scrapeCalendar();
  const events3 = await fetchAndParseICS('https://timelyapp.time.ly/api/calendars/54738062/export?format=ics&target=copy')

  console.log(events3)

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg">
      <DaysOfWeek />
      <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = [
            ...events.filter(event => isSameDay(event.date, day)),
            ...events2.filter(event => isSameDay(event.date, day)),
            ...events3.filter(event => isSameDay(event.date, day)),
                        ...events4.filter(event => isSameDay(event.date, day)),
          ];
          return (
            <div
              key={index}
              className={`min-h-[120px] bg-card p-3 md:min-h-[160px] lg:min-h-[200px] lg:p-4 ${!day ? "bg-muted/30" : ""
                }`}
              role={day ? "gridcell" : "presentation"}
              aria-label={day ? `${[month]} ${day}, ${year}` : undefined}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold md:h-12 md:w-12 md:text-2xl ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>


              <div className="space-y-2">
                  {dayEvents.map((event) => (
                          <div>{event.title}</div>
                  ))}
              </div>




            </div>
          )
        })}

      </div>
    </div>)
}
