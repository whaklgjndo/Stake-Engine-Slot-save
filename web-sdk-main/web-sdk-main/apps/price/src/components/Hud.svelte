<script lang="ts">
	import {
		stateBet,
		stateBetDerived,
		stateConfig,
		stateUi,
		AUTO_SPINS_TEXT_OPTION_MAP,
		AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP,
		AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP,
	} from 'state-shared';
	import { numberToCurrencyString, bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';

	const context = getContext();

	let stopDisabled = $state(false);

	const isIdle = $derived.by(() => context.stateXstateDerived.isIdle());
	const canAffordBet = $derived.by(() => stateBetDerived.isBetCostAvailable());
	const headerText = $derived(context.stateGame.gameType === 'basegame' ? 'PRICE GAME' : 'FREE SPINS');
	const balanceText = $derived(numberToCurrencyString(stateBet.balanceAmount));
	const winText = $derived(bookEventAmountToCurrencyString(stateBet.winBookEventAmount));
	const betText = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	const quickSpinDisabled = $derived(
		stateConfig.jurisdiction.disabledTurbo || stateBet.isSpaceHold,
	);
	const canDecreaseBet = $derived.by(() =>
		isIdle && stateConfig.betAmountOptions.some((option) => option < stateBet.betAmount),
	);
	const canIncreaseBet = $derived.by(() =>
		isIdle && stateConfig.betAmountOptions.some((option) => option > stateBet.betAmount),
	);
	const spinLabel = $derived(isIdle ? 'SPIN' : 'STOP');
	const spinDisabled = $derived.by(() => {
		if (isIdle) return !canAffordBet;
		if (stateBet.autoSpinsCounter !== 0) return false;
		if (stateBet.isTurbo) return true;
		return stopDisabled;
	});
	const autoSpinLabel = $derived.by(() => {
		if (stateBet.autoSpinsCounter > 0) {
			return stateBet.autoSpinsCounter === Infinity
				? 'AUTO ∞'
				: `AUTO ${stateBet.autoSpinsCounter}`;
		}

		const planned = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		return planned === Infinity ? 'AUTO ∞' : `AUTO ${planned}`;
	});

	const getSortedBetOptions = () => [...stateConfig.betAmountOptions].sort((a, b) => a - b);

	const pressGeneral = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};

	const pressSpin = () => {
		context.eventEmitter.broadcast({ type: 'soundPressBet' });
	};

	const decreaseBet = () => {
		if (!canDecreaseBet) return;

		pressGeneral();

		const previous = getSortedBetOptions()
			.slice()
			.reverse()
			.find((option) => option < stateBet.betAmount);

		if (previous !== undefined) {
			stateBetDerived.setBetAmount(previous);
		}
	};

	const increaseBet = () => {
		if (!canIncreaseBet) return;

		pressGeneral();

		const next = getSortedBetOptions().find((option) => option > stateBet.betAmount);

		if (next !== undefined) {
			stateBetDerived.setBetAmount(next);
		}
	};

	const spinOrStop = () => {
		if (spinDisabled) return;

		pressSpin();

		if (isIdle) {
			if (stateBetDerived.activeBetMode()?.type === 'buy') {
				stateBet.activeBetModeKey = 'BASE';
			}

			context.eventEmitter.broadcast({ type: 'bet' });
			return;
		}

		if (stateBetDerived.hasAutoBetCounter()) {
			stateBet.autoSpinsCounter = 0;
		}

		context.eventEmitter.broadcast({ type: 'stopButtonClick' });
	};

	const toggleQuickSpin = () => {
		if (quickSpinDisabled) return;

		pressGeneral();
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};

	const toggleAutoSpin = () => {
		if (stateConfig.jurisdiction.disabledAutoplay) return;

		if (stateBet.autoSpinsCounter > 0) {
			pressGeneral();
			stateBet.autoSpinsCounter = 0;
			return;
		}

		if (!isIdle || !canAffordBet) return;

		stateBet.autoSpinsCounter = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		stateBet.autoSpinsLossLimitAmount =
			stateBet.betAmount * AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsLossLimitText];
		stateBet.autoSpinsSingleWinLimitAmount =
			stateBet.betAmount *
			AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsSingleWinLimitText];

		if (stateBetDerived.activeBetMode()?.type === 'buy') {
			stateBet.activeBetModeKey = 'BASE';
		}

		pressGeneral();
		context.eventEmitter.broadcast({ type: 'autoBet' });
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => {
			stopDisabled = true;
			stateBetDerived.updateIsTurbo(true, { persistent: false });
		},
		stopButtonEnable: () => {
			stopDisabled = false;
			stateBetDerived.updateIsTurbo(false, { persistent: false });
		},
	});
</script>

<div class="hud-root">
	<div class="ambient ambient-left"></div>
	<div class="ambient ambient-right"></div>

	<div class="top-banner">
		<div class="top-banner__crest"></div>
		<div class="top-banner__text">{headerText}</div>
		<div class="top-banner__subtitle">Custom front-end shell</div>
	</div>

	<div class="bottom-shell">
		<div class="panel panel-balance">
			<div class="panel-label">BALANCE</div>
			<div class="panel-value">{balanceText}</div>
		</div>

		<div class="center-stack">
			<button
				class:disabled={spinDisabled}
				class:spinning={!isIdle}
				class="spin-button"
				type="button"
				disabled={spinDisabled}
				onclick={spinOrStop}
			>
				<span class="spin-button__ring"></span>
				<span class="spin-button__core">{spinLabel}</span>
			</button>

			<div class="panel panel-win">
				<div class="panel-label">WIN</div>
				<div class="panel-value">{winText}</div>
			</div>
		</div>

		<div class="control-stack">
			<div class="control-card">
				<div class="control-title">BET SIZE</div>
				<div class="bet-control">
					<button
						class="bet-adjust"
						type="button"
						disabled={!canDecreaseBet}
						onclick={decreaseBet}
					>
						−
					</button>
					<div class="bet-value">{betText}</div>
					<button
						class="bet-adjust"
						type="button"
						disabled={!canIncreaseBet}
						onclick={increaseBet}
					>
						+
					</button>
				</div>
			</div>

			<div class="toggle-row">
				<button
					class:active={stateBet.isTurbo}
					class="toggle-card"
					type="button"
					disabled={quickSpinDisabled}
					onclick={toggleQuickSpin}
				>
					<span class="toggle-card__label">QUICK SPIN</span>
					<span class="toggle-switch">
						<span class="toggle-switch__knob"></span>
					</span>
				</button>

				<button class:active={stateBet.autoSpinsCounter > 0} class="auto-card" type="button" onclick={toggleAutoSpin}>
					<span class="auto-card__label">AUTO SPIN</span>
					<span class="auto-card__value">{autoSpinLabel}</span>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.hud-root {
		position: fixed;
		inset: 0;
		z-index: 25;
		pointer-events: none;
		font-family:
			proxima-nova,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		color: #f3e6c2;
	}

	.ambient {
		position: absolute;
		inset: 0;
		opacity: 0.35;
	}

	.ambient-left {
		background:
			radial-gradient(circle at 12% 45%, rgb(255 124 51 / 0.26), transparent 24%),
			linear-gradient(90deg, rgb(155 62 11 / 0.16), transparent 28%);
	}

	.ambient-right {
		background:
			radial-gradient(circle at 88% 45%, rgb(63 145 255 / 0.24), transparent 24%),
			linear-gradient(270deg, rgb(28 72 140 / 0.16), transparent 28%);
	}

	.top-banner {
		position: absolute;
		top: clamp(1rem, 2vw, 1.6rem);
		left: 50%;
		transform: translateX(-50%);
		display: grid;
		justify-items: center;
		gap: 0.2rem;
		padding: 0.95rem 1.4rem 1.15rem;
		min-width: min(32rem, 62vw);
		border: 1px solid rgb(235 197 119 / 0.32);
		border-radius: 0 0 1.35rem 1.35rem;
		background:
			linear-gradient(180deg, rgb(27 41 66 / 0.94), rgb(11 18 32 / 0.92)),
			linear-gradient(90deg, rgb(188 126 35 / 0.14), transparent, rgb(188 126 35 / 0.14));
		box-shadow:
			0 1.2rem 2.4rem rgb(0 0 0 / 0.32),
			inset 0 1px 0 rgb(255 255 255 / 0.08);
	}

	.top-banner__crest {
		width: 3.75rem;
		height: 0.4rem;
		border-radius: 999px;
		background: linear-gradient(90deg, #6f4c13, #e9c36b, #6f4c13);
		box-shadow: 0 0 1rem rgb(233 195 107 / 0.4);
	}

	.top-banner__text {
		font-size: clamp(1rem, 1vw + 0.7rem, 1.45rem);
		font-weight: 800;
		letter-spacing: 0.25rem;
		color: #f3d58f;
		text-shadow: 0 0 1rem rgb(243 213 143 / 0.18);
	}

	.top-banner__subtitle {
		font-size: 0.72rem;
		letter-spacing: 0.24rem;
		color: rgb(204 217 255 / 0.7);
	}

	.bottom-shell {
		position: absolute;
		left: 50%;
		bottom: clamp(0.65rem, 1.4vw, 1.2rem);
		transform: translateX(-50%);
		display: grid;
		grid-template-columns: minmax(13rem, 18rem) minmax(11rem, 15rem) minmax(18rem, 24rem);
		align-items: end;
		gap: clamp(0.85rem, 1.3vw, 1.4rem);
		width: min(92vw, 78rem);
		padding: clamp(1rem, 1.5vw, 1.35rem);
		padding-top: clamp(2rem, 2.6vw, 2.8rem);
		border: 1px solid rgb(233 195 107 / 0.3);
		border-radius: 1.6rem;
		background:
			linear-gradient(90deg, rgb(48 22 13 / 0.9), rgb(17 27 53 / 0.92) 50%, rgb(12 23 44 / 0.95)),
			linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 30%);
		box-shadow:
			0 1.8rem 4rem rgb(0 0 0 / 0.46),
			inset 0 1px 0 rgb(255 255 255 / 0.08),
			inset 0 0 0 0.1rem rgb(241 208 129 / 0.08);
		pointer-events: none;
	}

	.bottom-shell::before {
		content: '';
		position: absolute;
		inset: 0.4rem;
		border-radius: 1.3rem;
		border: 1px solid rgb(241 208 129 / 0.14);
		pointer-events: none;
	}

	.panel,
	.control-card,
	.toggle-card,
	.auto-card,
	.spin-button {
		pointer-events: auto;
	}

	.panel {
		display: grid;
		gap: 0.55rem;
		padding: 0.95rem 1rem;
		border: 1px solid rgb(235 197 119 / 0.22);
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgb(16 25 44 / 0.92), rgb(8 14 26 / 0.95)),
			linear-gradient(90deg, rgb(198 137 33 / 0.08), transparent, rgb(198 137 33 / 0.08));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.08),
			0 0.8rem 1.6rem rgb(0 0 0 / 0.22);
		min-height: 5.4rem;
	}

	.panel-balance {
		align-self: center;
	}

	.panel-win {
		min-width: 10rem;
	}

	.panel-label,
	.control-title,
	.toggle-card__label,
	.auto-card__label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.18rem;
		color: rgb(233 195 107 / 0.86);
	}

	.panel-value,
	.bet-value,
	.auto-card__value {
		font-size: clamp(1.05rem, 1vw + 0.7rem, 1.45rem);
		font-weight: 800;
		letter-spacing: 0.04rem;
		color: #f7f5ee;
	}

	.center-stack {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 0.85rem;
		margin-top: -3.25rem;
	}

	.spin-button {
		position: relative;
		display: grid;
		place-items: center;
		width: clamp(7.6rem, 9vw, 9.3rem);
		height: clamp(7.6rem, 9vw, 9.3rem);
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		filter: drop-shadow(0 1rem 1.7rem rgb(0 0 0 / 0.42));
		transition:
			transform 140ms ease,
			filter 140ms ease,
			opacity 140ms ease;
	}

	.spin-button:hover:not(.disabled) {
		transform: translateY(-0.15rem) scale(1.02);
		filter: drop-shadow(0 1.2rem 1.9rem rgb(0 0 0 / 0.5));
	}

	.spin-button.disabled {
		opacity: 0.48;
		cursor: not-allowed;
	}

	.spin-button__ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background:
			radial-gradient(circle at 30% 28%, rgb(255 255 255 / 0.36), transparent 24%),
			linear-gradient(180deg, #deb85d, #936114 55%, #f0d382);
		box-shadow:
			inset 0 0.2rem 0.2rem rgb(255 255 255 / 0.22),
			inset 0 -0.45rem 0.75rem rgb(75 42 3 / 0.5),
			0 0 0 0.22rem rgb(42 23 4 / 0.86);
	}

	.spin-button__ring::before {
		content: '';
		position: absolute;
		inset: 0.7rem;
		border-radius: 50%;
		background:
			radial-gradient(circle at 35% 30%, rgb(182 241 255 / 0.8), rgb(102 172 255 / 0.95) 52%, rgb(31 84 160 / 1) 100%);
		box-shadow:
			inset 0 0.15rem 0.25rem rgb(255 255 255 / 0.46),
			inset 0 -0.45rem 0.8rem rgb(7 26 66 / 0.45),
			0 0 1.4rem rgb(80 159 255 / 0.34);
	}

	.spin-button__core {
		position: relative;
		z-index: 1;
		font-size: clamp(1.15rem, 1vw + 0.8rem, 1.7rem);
		font-weight: 900;
		letter-spacing: 0.08rem;
		color: #10213b;
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.55);
	}

	.spin-button:not(.disabled):not(.spinning) {
		animation: pulse 2.1s ease-in-out infinite;
	}

	.control-stack {
		display: grid;
		gap: 0.75rem;
	}

	.control-card {
		display: grid;
		gap: 0.65rem;
		padding: 0.95rem 1rem;
		border: 1px solid rgb(235 197 119 / 0.22);
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgb(16 25 44 / 0.92), rgb(8 14 26 / 0.95)),
			linear-gradient(90deg, rgb(198 137 33 / 0.08), transparent, rgb(198 137 33 / 0.08));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.08),
			0 0.8rem 1.6rem rgb(0 0 0 / 0.22);
	}

	.bet-control {
		display: grid;
		grid-template-columns: 2.6rem 1fr 2.6rem;
		align-items: center;
		gap: 0.6rem;
	}

	.bet-adjust {
		height: 2.6rem;
		border: 1px solid rgb(235 197 119 / 0.28);
		border-radius: 999px;
		background:
			linear-gradient(180deg, rgb(168 122 37 / 0.9), rgb(90 58 13 / 0.95)),
			linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent);
		color: #fff3d2;
		font-size: 1.4rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform 120ms ease,
			opacity 120ms ease;
	}

	.bet-adjust:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.bet-adjust:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}

	.bet-value {
		display: grid;
		place-items: center;
		height: 2.95rem;
		padding: 0 0.9rem;
		border: 1px solid rgb(235 197 119 / 0.18);
		border-radius: 0.8rem;
		background: rgb(5 10 21 / 0.92);
		box-shadow: inset 0 0.2rem 0.45rem rgb(0 0 0 / 0.45);
	}

	.toggle-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.toggle-card,
	.auto-card {
		display: grid;
		gap: 0.5rem;
		align-content: center;
		padding: 0.85rem 0.95rem;
		border: 1px solid rgb(235 197 119 / 0.2);
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgb(14 23 40 / 0.9), rgb(6 12 24 / 0.95)),
			linear-gradient(90deg, rgb(198 137 33 / 0.06), transparent, rgb(198 137 33 / 0.06));
		color: inherit;
		cursor: pointer;
		transition:
			transform 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease,
			opacity 120ms ease;
		text-align: left;
	}

	.toggle-card:hover:not(:disabled),
	.auto-card:hover:not(:disabled) {
		transform: translateY(-1px);
		border-color: rgb(241 208 129 / 0.34);
		box-shadow: 0 0.6rem 1.25rem rgb(0 0 0 / 0.22);
	}

	.toggle-card:disabled,
	.auto-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toggle-card.active,
	.auto-card.active {
		border-color: rgb(116 190 255 / 0.46);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.08),
			0 0 1.1rem rgb(74 146 255 / 0.18);
	}

	.toggle-switch {
		position: relative;
		width: 3.2rem;
		height: 1.55rem;
		border-radius: 999px;
		background: rgb(32 45 71 / 0.95);
		box-shadow: inset 0 0.2rem 0.4rem rgb(0 0 0 / 0.35);
		transition: background 120ms ease;
	}

	.toggle-switch__knob {
		position: absolute;
		top: 0.17rem;
		left: 0.2rem;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background:
			radial-gradient(circle at 35% 35%, rgb(255 255 255 / 0.95), rgb(182 207 255 / 0.88));
		box-shadow:
			0 0.2rem 0.35rem rgb(0 0 0 / 0.24),
			inset 0 -0.08rem 0.16rem rgb(35 63 117 / 0.26);
		transition: transform 120ms ease;
	}

	.toggle-card.active .toggle-switch {
		background: linear-gradient(90deg, #365c99, #63baff);
	}

	.toggle-card.active .toggle-switch__knob {
		transform: translateX(1.62rem);
	}

	@media (width <= 980px) {
		.bottom-shell {
			grid-template-columns: 1fr;
			gap: 0.9rem;
			width: min(94vw, 34rem);
			padding-top: 1rem;
		}

		.center-stack {
			order: -1;
			margin-top: -4.2rem;
		}

		.panel-balance,
		.panel-win,
		.control-stack {
			width: 100%;
		}

		.toggle-row {
			grid-template-columns: 1fr;
		}
	}

	@media (height <= 760px) {
		.top-banner {
			top: 0.55rem;
			padding: 0.7rem 1rem 0.85rem;
		}

		.bottom-shell {
			bottom: 0.45rem;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.035);
		}
	}
</style>
