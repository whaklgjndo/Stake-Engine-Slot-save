<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/status-gem.png';

  export let width = 9;
  export let height = 18;
  export let title = 'Status gem';
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
  viewWidth={9}
  viewHeight={18}
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
