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
.throne-room-game-shell{position:relative;min-height:100vh;overflow:hidden;background:#040608;--hud-width:min(44vw,720px);--hud-height:calc(var(--hud-width)*.1903);--hud-top:calc(50% + 338px)}
.hud-underlay{position:absolute;left:50%;top:var(--hud-top);width:var(--hud-width);transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 16px 24px rgba(0,0,0,.5))}
:global(.throne-room-game-shell .game-shell){background:transparent;min-height:100vh}
:global(.throne-room-game-shell .theme-backdrop){display:none}
:global(.throne-room-game-shell .game-stage){display:grid;place-items:center;padding:18px 24px 320px}
:global(.throne-room-game-shell .feature-banner){margin-inline:auto;width:min(640px,calc(100vw - 120px))}
:global(.throne-room-game-shell .board-frame){transform:translateY(-18px) scale(.98);transform-origin:center top}
:global(.throne-room-game-shell .board){padding:0;background:transparent;box-shadow:none}
:global(.throne-room-game-shell .board::before),:global(.throne-room-game-shell .board::after){display:none}
:global(.throne-room-game-shell .cell){border-width:2px;border-radius:10px;border-color:rgba(181,144,58,.96);box-shadow:inset 0 2px 6px rgba(0,0,0,.42),0 0 0 1px rgba(74,50,14,.92)}
:global(.throne-room-game-shell .board .cell:nth-child(5n+1)),:global(.throne-room-game-shell .board .cell:nth-child(5n+2)),:global(.throne-room-game-shell .board .cell:nth-child(5n+3)){background:radial-gradient(circle at 30% 24%,rgba(255,173,126,.16),transparent 32%),radial-gradient(circle at 72% 72%,rgba(87,20,11,.2),transparent 38%),linear-gradient(180deg,#7a2218 0%,#83291c 18%,#6f1d16 58%,#55140f 100%)}
:global(.throne-room-game-shell .board .cell:nth-child(5n+4)),:global(.throne-room-game-shell .board .cell:nth-child(5n+5)){background:radial-gradient(circle at 72% 24%,rgba(181,214,255,.16),transparent 32%),radial-gradient(circle at 28% 72%,rgba(18,32,74,.24),transparent 40%),linear-gradient(180deg,#314a82 0%,#2f4678 22%,#273a66 56%,#1a284a 100%)}
:global(.throne-room-game-shell .symbol-art),:global(.throne-room-game-shell .symbol-art-sheet),:global(.throne-room-game-shell .wheel-tile-art),:global(.throne-room-game-shell .scatter-symbol){width:78px;height:78px}
:global(.throne-room-game-shell .symbol-tile-shell),:global(.throne-room-game-shell .wheel-tile-shell),:global(.throne-room-game-shell .symbol-tile-shell-bonus){width:78px;height:78px}
:global(.throne-room-game-shell .top-bar){position:absolute;left:50%;top:var(--hud-top);width:var(--hud-width);height:var(--hud-height);transform:translateX(-50%);padding:0;border:0;background:transparent;backdrop-filter:none;pointer-events:none}
:global(.throne-room-game-shell .top-bar-brand){display:none}
:global(.throne-room-game-shell .top-bar-stats){position:absolute;inset:0;display:block}
:global(.throne-room-game-shell .stat-pill){position:absolute;padding:0;border:0;background:transparent;box-shadow:none;text-align:center}
:global(.throne-room-game-shell .stat-pill span){display:none}
:global(.throne-room-game-shell .stat-pill strong){display:grid;place-items:center;height:100%;font-size:clamp(10px,.9vw,16px);font-weight:800;color:#f2f2f2;text-shadow:0 1px 2px rgba(0,0,0,.75)}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(1)){left:5.8%;top:46%;width:23%;height:10%}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)){left:58.2%;top:45.5%;width:14.5%;height:10%}
:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)){left:55.8%;top:76%;width:22%;height:10%}
:global(.throne-room-game-shell .game-controls){position:absolute;left:50%;top:var(--hud-top);width:var(--hud-width);height:var(--hud-height);transform:translateX(-50%);padding:0;border:0;background:transparent;backdrop-filter:none;grid-template-columns:1fr;gap:0}
:global(.throne-room-game-shell .controls-left),:global(.throne-room-game-shell .controls-center),:global(.throne-room-game-shell .controls-right){position:absolute;gap:0}
:global(.throne-room-game-shell .controls-left){left:4.5%;top:23%;width:31%;height:54%}
:global(.throne-room-game-shell .controls-center){left:43.2%;top:4.6%;width:8.7%;height:38%;transform:translateX(-50%);justify-items:center;margin-top:0}
:global(.throne-room-game-shell .controls-right){right:2.2%;top:13%;width:18.8%;height:62%}
:global(.throne-room-game-shell .bet-stepper){position:absolute;right:11.8%;top:12%;width:38%;grid-template-columns:13% 74% 13%;gap:0}
:global(.throne-room-game-shell .bet-display){padding:0;border:0;background:transparent}
:global(.throne-room-game-shell .bet-display span){display:none}
:global(.throne-room-game-shell .bet-display strong){font-size:clamp(10px,.9vw,16px);line-height:1;color:#f2f2f2;text-shadow:0 1px 2px rgba(0,0,0,.75)}
:global(.throne-room-game-shell .ctrl-button){padding:0;border:0;background:transparent;font-size:0;box-shadow:none}
:global(.throne-room-game-shell .ctrl-button:hover:enabled){transform:none}
:global(.throne-room-game-shell .bonus-buy-row){display:none}
:global(.throne-room-game-shell .spin-button){width:100%;height:100%;margin-top:0;font-size:.82rem;box-shadow:none;border:0;background:radial-gradient(circle at 38% 28%,rgba(233,247,255,.96),rgba(171,222,255,.96) 34%,rgba(83,166,236,.98) 68%,rgba(33,99,174,.98) 100%)}
:global(.throne-room-game-shell .spin-button-stop){background:linear-gradient(180deg,#ffc484,#f98f54 56%,#e55a2f 100%)}
:global(.throne-room-game-shell .spin-button-skip){background:linear-gradient(180deg,#c2e8ff,#6fc4ff 56%,#37a2f5 100%)}
:global(.throne-room-game-shell .status-text){display:none}
:global(.throne-room-game-shell .toggle-row){position:absolute;right:0;top:8%;width:100%;grid-template-columns:1fr;gap:8px}
:global(.throne-room-game-shell .toggle-button){padding:0;background:transparent;border:0;border-radius:8px;font-size:0;color:transparent;line-height:0;min-height:22px;box-shadow:none}
:global(.throne-room-game-shell .toggle-button > * ){font-size:0!important;color:transparent!important}
:global(.throne-room-game-shell .toggle-row .toggle-button:last-child){margin-top:26px}
:global(.throne-room-game-shell .autoplay-select),:global(.throne-room-game-shell .autoplay-label),:global(.throne-room-game-shell .info-button){display:none}
@media (max-width:1200px){.throne-room-game-shell{--hud-width:min(56vw,680px);--hud-top:calc(50% + 305px)}:global(.throne-room-game-shell .board-frame){transform:translateY(-8px) scale(.91)}:global(.throne-room-game-shell .game-stage){padding-bottom:290px}}
@media (max-width:960px){.throne-room-game-shell{--hud-width:min(78vw,620px);--hud-top:calc(50% + 248px)}:global(.throne-room-game-shell .game-stage){padding-bottom:250px}:global(.throne-room-game-shell .board-frame){transform:translateY(0) scale(.8)}}
</style>
