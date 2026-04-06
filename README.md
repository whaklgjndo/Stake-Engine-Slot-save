# Stake Engine Workspace

This workspace is now centered on the Stake Engine `lines` app inside the web SDK. The old standalone Vite slot shell has been retired so there is one clear front end to work in.

## Primary Preview

Use Storybook in `apps/lines` as the live reel and mechanics sandbox.

From the workspace root:

```powershell
cd "C:\Users\Tyler\OneDrive\Desktop\Stake Engine"
npm run storybook
```

Or directly:

```powershell
cd "C:\Users\Tyler\OneDrive\Desktop\Stake Engine\web-sdk-main\web-sdk-main\apps\lines"
C:\Users\Tyler\AppData\Roaming\npm\pnpm.cmd run storybook
```

Open `http://127.0.0.1:6001`.

Windows shortcut:

```bat
C:\Users\Tyler\OneDrive\Desktop\Stake Engine\start-lines-storybook.cmd
```

## Build The Active App

From the workspace root:

```powershell
cd "C:\Users\Tyler\OneDrive\Desktop\Stake Engine"
npm run build
```

That builds `web-sdk-main/web-sdk-main/apps/lines`.

## Install Dependencies

```powershell
cd "C:\Users\Tyler\OneDrive\Desktop\Stake Engine"
npm run install:web-sdk
```

Current toolchain baseline:

- Node `>=22.16.0`
- pnpm `10.33.0`

## VS Code Tasks

- `Terminal > Run Task > Install web-sdk dependencies`
- `Terminal > Run Task > Build lines app`
- `Terminal > Run Task > Start lines Storybook`
- `Run and Debug > Open lines Storybook in Edge`

## Repos In This Workspace

- `web-sdk-main/web-sdk-main`
- `math-sdk-main/math-sdk-main`
- `ts-client-main/ts-client-main`
- `docs-main/docs-main`
- `convex-optimizer-main/convex-optimizer-main`

## Active Slot Surface

The current slot prototype lives in:

- `web-sdk-main/web-sdk-main/apps/lines/src/stories/components/DualWheelWorkshop.svelte`
- `web-sdk-main/web-sdk-main/apps/lines/src/stories/components/DualWheelBoard.svelte`
- `web-sdk-main/web-sdk-main/apps/lines/src/stories/PrototypeDualWheelWorkshop.stories.js`
