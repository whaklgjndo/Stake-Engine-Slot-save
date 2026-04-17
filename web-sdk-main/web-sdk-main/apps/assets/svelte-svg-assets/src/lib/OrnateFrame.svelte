<script>
  import RasterSvg from '../components/RasterSvg.svelte';
  import src from './assets/png/ornate-frame.png';

  export let width = 313;
  export let height = 408;
  export let title = 'Ornate frame';
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
  viewWidth={313}
  viewHeight={408}
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
