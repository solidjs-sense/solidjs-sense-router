import { onCleanup, onMount } from 'solid-js';
import { t } from '../util';
import './home.scss';

export default () => {
  onMount(() => {
    console.log('home mount');
  });

  onCleanup(() => {
    console.log('home cleanup');
  });
  return (
    <div class="home-ctn">
      <div class="content">
        <h1>{t('SolidJS Router')}</h1>
        <p>{t('That make sense')}</p>
      </div>
    </div>
  );
};
