import MarkdownIt from 'markdown-it';
import { useLocation } from '../../..';
import readme from '../../../README.md?raw';
import readmeZh from '../../../README-zh.md?raw';
import './usage.scss';

export default () => {
  const md = new MarkdownIt();
  const location = useLocation();
  return (
    <div class="usage-ctn">
      <div class="content" innerHTML={md.render(location.base() === '/zh' ? readmeZh : readme)}></div>
    </div>
  );
};
