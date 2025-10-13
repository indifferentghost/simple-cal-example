import { format } from "date-fns";

export const CalendarListItem = ({ title, url, startTime }: { title: string, url?: string, startTime?: Date | string | null }) => {
  return <li className="hover:bg-gray-200/50 transition delay-50 duration-200 ease-in p-1 text-sm text-foreground truncate">
    <time className="pr-1">{startTime ? format(startTime, 'p') : null}</time>
    {url ? (
      <a href={url} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
        {title}
      </a>
    ) : title}
  </li>
};