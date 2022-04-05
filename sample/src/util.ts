import { useLocation } from '../..';
import { bases } from './constant';
import en from './locale/en';
import zh from './locale/zh';

const locales: Record<string, Record<string, string>> = {
  [bases[0]]: zh,
  [bases[1]]: en,
};

export const t = (text: string) => {
  const location = useLocation();
  const base = location.base();
  const locale = locales[base];
  return locale[text] ?? text;
};
