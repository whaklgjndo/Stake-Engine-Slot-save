<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/stage-scene.png';

  export let width = 922;
  export let height = 505;
  export let title = 'Stage scene';
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
  viewWidth={922}
  viewHeight={505}
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
