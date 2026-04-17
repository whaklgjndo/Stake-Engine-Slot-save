<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/bonus-badge.png';

  export let width = 32;
  export let height = 26;
  export let title = 'Bonus badge';
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
  viewWidth={32}
  viewHeight={26}
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
