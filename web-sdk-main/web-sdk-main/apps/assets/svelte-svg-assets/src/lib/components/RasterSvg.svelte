<script>
  export let src = '';
  export let viewWidth = 100;
  export let viewHeight = 100;
  export let width = viewWidth;
  export let height = viewHeight;
  export let title = '';
  export let desc = '';
  export let className = '';
  export let animation = 'none';
  export let duration = 1.8;
  export let delay = 0;
  export let style = '';
  export let preserveAspectRatio = 'xMidYMid meet';
  export let imageRendering = 'auto';

  $: animationClass = animation !== 'none' ? `is-${animation}` : '';
  $: svgStyle = `--asset-duration:${duration}s;--asset-delay:${delay}s;${style}`;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox={`0 0 ${viewWidth} ${viewHeight}`}
  width={width}
  height={height}
  role={title ? 'img' : 'presentation'}
  aria-label={title || undefined}
  aria-hidden={title ? undefined : 'true'}
  class={`raster-svg ${className} ${animationClass}`.trim()}
  style={svgStyle}
>
  {#if title}
    <title>{title}</title>
  {/if}
  {#if desc}
    <desc>{desc}</desc>
  {/if}

  <image
    href={src}
    width={viewWidth}
    height={viewHeight}
    preserveAspectRatio={preserveAspectRatio}
    style={`image-rendering:${imageRendering};transform-origin:center;transform-box:fill-box;`}
  />
</svg>

<style>
  .raster-svg {
    display: block;
    overflow: visible;
    transform-origin: center;
    transform-box: fill-box;
    will-change: transform, filter, opacity;
  }

  .raster-svg.is-spin {
    animation: asset-spin var(--asset-duration, 1.8s) linear infinite;
    animation-delay: var(--asset-delay, 0s);
  }

  .raster-svg.is-pulse {
    animation: asset-pulse var(--asset-duration, 1.8s) ease-in-out infinite;
    animation-delay: var(--asset-delay, 0s);
  }

  .raster-svg.is-float {
    animation: asset-float var(--asset-duration, 2.6s) ease-in-out infinite;
    animation-delay: var(--asset-delay, 0s);
  }

  .raster-svg.is-wiggle {
    animation: asset-wiggle var(--asset-duration, 1.6s) ease-in-out infinite;
    animation-delay: var(--asset-delay, 0s);
  }

  .raster-svg.is-bob {
    animation: asset-bob var(--asset-duration, 2.1s) ease-in-out infinite;
    animation-delay: var(--asset-delay, 0s);
  }

  @keyframes asset-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes asset-pulse {
    0%,
    100% {
      transform: scale(1);
      filter: brightness(1);
    }

    50% {
      transform: scale(1.04);
      filter: brightness(1.08);
    }
  }

  @keyframes asset-float {
    0%,
    100% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-6px);
    }
  }

  @keyframes asset-wiggle {
    0%,
    100% {
      transform: rotate(0deg);
    }

    25% {
      transform: rotate(-4deg);
    }

    75% {
      transform: rotate(4deg);
    }
  }

  @keyframes asset-bob {
    0%,
    100% {
      transform: translateY(0px) scale(1);
    }

    50% {
      transform: translateY(-3px) scale(1.02);
    }
  }
</style>
