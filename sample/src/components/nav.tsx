import { Link, useLocation, useNavigator } from '../../..';
import { t } from '../util';
import './nav.scss';

export const Nav = () => {
  const location = useLocation();
  const changeBase = () => {
    const navigator = useNavigator();
    navigator.newBase(location.base() === '/zh' ? '/en' : '/zh');
  };

  return (
    <nav class="nav-ctn">
      <Link href="/" activeClass="active">
        {t('home')}
      </Link>
      <Link href="/usage" activeClass="active">
        {t('usage')}
      </Link>
      <a href="https://github.com/solidjs-sense/solidjs-sense-router/tree/main/sample" target="_blank">
        {t('sample')}
      </a>
      <a href="https://github.com/solidjs-sense/solidjs-sense-router" target="_blank">
        Github
      </a>
      <div class="right">
        <button onclick={changeBase}>{location.base() === '/zh' ? '中文/English' : 'English/中文'}</button>
      </div>
    </nav>
  );
};
