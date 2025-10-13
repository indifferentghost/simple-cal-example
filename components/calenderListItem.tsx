export const CalendarListItem = ({ title, url }: { title: string, url?: string }) => {
  return <li className="hover:bg-gray-200/50 transition delay-50 duration-200 ease-in p-1">
    {url ? (
      <a href={url} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
        {title}
      </a>
    ) : title}

  </li>
};