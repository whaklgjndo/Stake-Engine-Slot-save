<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/menu-toggle.png';

  export let width = 13;
  export let height = 13;
  export let title = 'Menu toggle';
  export let desc = '';
  export let className = '';
  export let animation = 'none';
  export let duration = 1.8;
  export let delay = 0;
  export let style = '';
  export let preserveAspectRatio = 'xMidYMid meet';
  export let imageRendering = 'auto';
</script>

<RasterSvg
  {src}
  viewWidth={13}
  viewHeight={13}
  {width}
  {height}
  {title}
  {desc}
  {className}
  {animation}
  {duration}
  {delay}
  {style}
  {preserveAspectRatio}
  {imageRendering}
/>
