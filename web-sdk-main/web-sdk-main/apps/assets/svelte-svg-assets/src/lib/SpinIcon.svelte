<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/spin-icon.png';

  export let width = 54;
  export let height = 48;
  export let title = 'Spin icon';
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
  viewWidth={54}
  viewHeight={48}
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
