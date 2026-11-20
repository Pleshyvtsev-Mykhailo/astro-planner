import { matchPath } from 'react-router-dom';

const TITLES: [string, string][] = [
  ['/login', 'Вхід'],
  ['/objects', 'Каталог'],
  ['/objects/:id', 'Картка об’єкта'],
  ['/objects/:id/visibility', 'Видимість об’єкта'],
  ['/journal', 'Журнал'],
  ['/journal/new', 'Новий запис'],
  ['/journal/:id', 'Запис журналу'],
];

export function getPageTitle(pathname: string): string {
  const hit = TITLES.find(([pattern]) => matchPath({ path: pattern, end: true }, pathname));
  return `${hit ? hit[1] : 'Сторінку не знайдено'} · AstroPlanner`;
}