'use client'
import { XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { CalendarEvent } from "~/app/getCalendarEvents";
import { useCallback, useEffect, useRef } from "react";
import { format, isBefore, isEqual } from "date-fns";
import { CalendarListItem } from "./calenderListItem";

export const ShowMoreDialog = ({ events }: { events: CalendarEvent[] }) => {
  const ref = useRef<HTMLDialogElement>(null);

  const handleRefClick = useCallback(() => {
    if (!ref.current) {
      console.log('no ref connected for handleRefClick')
      return;
    }
    ref.current.showModal()
  }, [ref.current]);

  useEffect(() => {
    if (!ref.current) {
      console.log('no ref connected for outside click listener');
      return
    }
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (!ref.current || !ref.current.open) return;
      if (event.target instanceof Node && event.target === ref.current) {
        ref.current.close('dismiss')
      }
    }

    document.addEventListener('mouseup', handleOutsideClick);
    document.addEventListener('touchend', handleOutsideClick);


    return () => {
      document.removeEventListener('mouseup', handleOutsideClick);
      document.removeEventListener('touchend', handleOutsideClick);
    };
  }, [ref.current])

  return <>
    <dialog ref={ref} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg backdrop:bg-gray-900/25">
      <div className="p-3 flex flex-col rounded-xl">
        <div className="flex justify-between items-center mb-5 pb-1.5 border-b border-gray-900 border-dashed">
          <h3 className="text-xl font-bold">All events for {format(events[0].date, 'eeee, MMMM do yyyy')}</h3>
          <Button className="self-end ml-4" onClick={() => ref.current?.close()} variant="outline" size="icon">
            <XIcon size="small" />
            <span className="sr-only">
              Close dialog
            </span>
          </Button>
        </div>
        <ul className="space-y-0.5">
          {events.sort((a, b) => {
            if (!a.startDateTime) {
              return b.startDateTime ? 1 : 0
            }
            if (!b.startDateTime) {
              return -1;
            }
            if (isEqual(a.startDateTime, b.startDateTime)) return 0;
            return isBefore(a.startDateTime, b.startDateTime) ? -1 : 1
          }).map((event, index) => (
            <CalendarListItem startTime={event.startDateTime} url={event.url} title={event.title} key={`more-${index}`} />
          ))}
        </ul>
      </div>
    </dialog>
    <Button className="mt-auto" onClick={handleRefClick} variant="outline" size="sm">
      Show {events.length - 3} more event{events.length - 3 === 1 ? "" : "s"}
    </Button>
  </>
}
