<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/bolt-gold.png';

  export let width = 23;
  export let height = 34;
  export let title = 'Gold bolt';
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
  viewWidth={23}
  viewHeight={34}
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
