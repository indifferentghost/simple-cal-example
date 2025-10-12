'use client'
import { XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { CalendarEvent } from "~/app/getCalendarEvents";
import { useRef } from "react";
import { format } from "date-fns";

export const ShowMoreDialog = ({ events }: { events: CalendarEvent[] }) => {

  const ref = useRef<HTMLDialogElement>(null);

  return <>
    <dialog ref={ref} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg backdrop:bg-gray-900/25">
      <div className="p-3 flex flex-col rounded-xl">
        <div className="flex justify-between items-center mb-5 pb-1.5 border-b border-gray-900 border-dashed">
          <h3 className="text-xl font-bold">All events for {format(events[0].date, 'eeee, MMMM do yyyy')}</h3>
          <Button className="self-end" onClick={() => ref.current?.close()} variant="outline" size="icon">
            <XIcon size="small" />
            <span className="sr-only">
              Close dialog
            </span>
          </Button>
        </div>
        <ul className="space-y-0.5">
          {events.map((event, index) => <li
          className="hover:bg-gray-200/50 transition delay-50 duration-200 ease-in p-1"
          key={`more-${index}`}>{event.title}</li>)}
        </ul>
      </div>
    </dialog>
    <Button className="mt-auto" onClick={ref.current?.showModal.bind(ref.current)} variant="ghost" size="sm">
      Show more
    </Button>
  </>
}
