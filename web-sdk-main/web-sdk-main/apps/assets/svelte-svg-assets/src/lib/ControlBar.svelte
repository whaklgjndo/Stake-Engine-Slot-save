<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/control-bar.png';

  export let width = 348;
  export let height = 57;
  export let title = 'Control bar';
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
  viewWidth={348}
  viewHeight={57}
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
