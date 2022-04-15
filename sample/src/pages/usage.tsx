import MarkdownIt from 'markdown-it';
import { useLocation } from '../../../src';
import readme from '../../../README.md?raw';
import readmeZh from '../../../README-zh.md?raw';
import './usage.scss';
import { bases } from '../constant';

export default () => {
  const md = new MarkdownIt();
  const location = useLocation();
  return (
    <div class="usage-ctn">
      <div class="content" innerHTML={md.render(location.base() === bases[0] ? readmeZh : readme)}></div>
    </div>
  );
};
