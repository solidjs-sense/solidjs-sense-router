import { useLocation } from '../..';
import en from './locale/en';
import zh from './locale/zh';

const locales: Record<string, Record<string, string>> = {
  '/zh': zh,
  '/en': en,
};

export const t = (text: string) => {
  const location = useLocation();
  const base = location.base();
  const locale = locales[base];
  return locale[text] ?? text;
};
