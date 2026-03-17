import App from '@/app/App.svelte';
import '@/app/styles/index.scss';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
