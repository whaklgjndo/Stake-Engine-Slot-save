<script lang="ts">
import DualWheelGame from './DualWheelGame.svelte';
import ThroneRoomBackdrop from '../../components/art/ThroneRoomBackdrop.svelte';
const backgroundArt=new URL('../assets/bg-throne-room.png',import.meta.url).href;
const hudControlsArt=new URL('../assets/hud-controls-bar.png',import.meta.url).href;
</script>
<div class="throne-room-game-shell">
<ThroneRoomBackdrop src={backgroundArt}/>
<img class="hud-underlay" src={hudControlsArt} alt="" draggable="false"/>
<DualWheelGame/>
</div>
<style>
.throne-room-game-shell{
position:relative;min-height:100vh;overflow:hidden;background:#040608;
--scene-width:min(100vw,calc(100vh * 1.777));
--scene-height:calc(var(--scene-width) / 1.777);
--hud-width:calc(var(--scene-width) * 0.4418);
--hud-height:calc(var(--scene-height) * 0.1667);
--hud-left:50%;
--hud-top:calc((100vh - var(--scene-height)) * .5 + var(--scene-height) * 0.8333);
}
.hud-underlay{position:absolute;left:var(--hud-left);top:var(--hud-top);width:var(--hud-width);height:auto;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 16px 24px rgba(0,0,0,.5))}
:global(.throne-room-game-shell .game-shell){background:transparent;min-height:100vh}
:global(.throne-room-game-shell .theme-backdrop){display:none}
:global(.throne-room-game-shell .game-stage){display:grid;place-items:center;padding:calc((100vh - var(--scene-height)) * .5 + 8px) 24px calc((100vh - var(--scene-height)) * .5 + var(--scene-height) * 0.22)}
:global(.throne-room-game-shell .feature-banner){margin-inline:auto;width:min(640px,calc(100vw - 120px))}
:global(.throne-room-game-shell .board-frame){transform:translateY(-18px) scale(.98);transform-origin:center top}
:global(.throne-room-game-shell .board){padding:0;background:transparent;box-shadow:none}
:global(.throne-room-game-shell .board::before),:global(.throne-room-game-shell .board::after){display:none}
:global(.throne-room-game-shell .cell){border-width:2px;border-radius:10px;border-color:rgba(181,144,58,.96);box-shadow:inset 0 2px 6px rgba(0,0,0,.42),0 0 0 1px rgba(74,50,14,.92)}
:global(.throne-room-game-shell .board .cell:nth-child(5n+1)),:global(.throne-room-game-shell .board .cell:nth-child(5n+2)),:global(.throne-room-game-shell .board .cell:nth-child(5n+3)){background:radial-gradient(circle at 30% 24%,rgba(255,173,126,.16),transparent 32%),radial-gradient(circle at 72% 72%,rgba(87,20,11,.2),transparent 38%),linear-gradient(180deg,#7a2218 0%,#83291c 18%,#6f1d16 58%,#55140f 100%)}
:global(.throne-room-game-shell .board .cell:nth-child(5n+4)),:global(.throne-room-game-shell .board .cell:nth-child(5n+5)){background:radial-gradient(circle at 72% 24%,rgba(181,214,255,.16),transparent 32%),radial-gradient(circle at 28% 72%,rgba(18,32,74,.24),transparent 40%),linear-gradient(180deg,#314a82 0%,#2f4678 22%,#273a66 56%,#1a284a 100%)}
:global(.throne-room-game-shell .symbol-art),:global(.throne-room-game-shell .symbol-art-sheet),:global(.throne-room-game-shell .wheel-tile-art),:global(.throne-room-game-shell .scatter-symbol){width:78px;height:78px}
:global(.throne-room-game-shell .symbol-tile-shell),:global(.throne-room-game-shell .wheel-tile-shell),:global(.throne-room-game-shell .symbol-tile-shell-bonus){width:78px;height:78px}
:global(.throne-room-game-shell .top-bar){position:absolute;left:var(--hud-left);top:var(--hud-top);width:var(--hud-width);height:var(--hud-height);transform:translateX(-50%);padding:0;border:0;background:transparent;backdrop-filter:none;pointer-events:none}
:global(.throne-room-game-shell .top-bar-brand){display:none}
:global(.throne-room-game-shell .top-bar-stats){position:absolute;inset:0;display:block}
:global(.throne-room-game-shell .stat-pill){position:absolute;padding:0;border:0;background:transparent;box-shadow:none;text-align:center}
:global(.throne-room-game-shell .stat-pill span){display:none}
:global(.throne-room-game-shell .stat-pill strong){display:grid;place-items:center;height:100%;font-size:clamp(10px,.9vw,16px);font-weight:800;color:#f2f2f2;text-shadow:0 1px 2px rgba(0,0,0,.75)}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(1)){left:5.48%;top:25%;width:32.53%;height:25%}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)){left:55.14%;top:12.1%;width:18.84%;height:25%}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)){left:55.14%;top:62.9%;width:18.84%;height:25%}
:global(.throne-room-game-shell .game-controls){position:absolute;left:var(--hud-left);top:var(--hud-top);width:var(--hud-width);height:var(--hud-height);transform:translateX(-50%);padding:0;border:0;background:transparent;backdrop-filter:none;grid-template-columns:1fr;gap:0}
:global(.throne-room-game-shell .controls-left),:global(.throne-room-game-shell .controls-center),:global(.throne-room-game-shell .controls-right){position:absolute;gap:0}
:global(.throne-room-game-shell .controls-left){left:76.6%;top:21%;width:8.4%;height:21.4%}
:global(.throne-room-game-shell .controls-center){left:41.55%;top:5.65%;width:7.65%;height:33.2%;transform:none;justify-items:center;margin-top:0}
:global(.throne-room-game-shell .controls-right){left:87.3%;top:14.7%;width:11.1%;height:57.7%}
:global(.throne-room-game-shell .bet-stepper){position:absolute;inset:0;display:grid;grid-template-columns:1fr 0 1fr;gap:.2%}
:global(.throne-room-game-shell .bet-display){display:none}
:global(.throne-room-game-shell .ctrl-button){padding:0;border:0;background:transparent;font-size:0;box-shadow:none;border-radius:999px}
:global(.throne-room-game-shell .ctrl-button:hover:enabled){transform:none}
:global(.throne-room-game-shell .bonus-buy-row){display:none}
:global(.throne-room-game-shell .spin-button){width:100%;height:100%;margin-top:0;font-size:.82rem;box-shadow:none;border:0;background:radial-gradient(circle at 38% 28%,rgba(233,247,255,.96),rgba(171,222,255,.96) 34%,rgba(83,166,236,.98) 68%,rgba(33,99,174,.98) 100%)}
:global(.throne-room-game-shell .spin-button-stop){background:linear-gradient(180deg,#ffc484,#f98f54 56%,#e55a2f 100%)}
:global(.throne-room-game-shell .spin-button-skip){background:linear-gradient(180deg,#c2e8ff,#6fc4ff 56%,#37a2f5 100%)}
:global(.throne-room-game-shell .status-text){display:none}
:global(.throne-room-game-shell .toggle-row){position:absolute;inset:0;display:block}
:global(.throne-room-game-shell .toggle-button){position:absolute;padding:0;background:transparent;border:0;border-radius:8px;font-size:0;color:transparent;line-height:0;box-shadow:none}
:global(.throne-room-game-shell .toggle-button > * ){font-size:0!important;color:transparent!important}
:global(.throne-room-game-shell .toggle-row .toggle-button:first-child){left:22.5%;top:0;width:67.6%;height:49%}
:global(.throne-room-game-shell .toggle-row .toggle-button:last-child){left:0;top:66.7%;width:100%;height:33.3%;margin-top:0}
:global(.throne-room-game-shell .autoplay-select),:global(.throne-room-game-shell .autoplay-label),:global(.throne-room-game-shell .info-button){display:none}
@media (max-width:1200px){.throne-room-game-shell{--scene-width:min(100vw,calc(100vh * 1.72));}}
@media (max-width:960px){.throne-room-game-shell{--scene-width:min(100vw,calc(100vh * 1.58));}:global(.throne-room-game-shell .board-frame){transform:translateY(0) scale(.8)}}
</style>
