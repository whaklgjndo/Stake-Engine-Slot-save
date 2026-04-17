export type ReelAnimationUpdate = {
	offsetPx: number;
	blurPx: number;
	velocity: number;
	progress: number;
};

export type ReelAnimationOptions = {
	duration: number;
	distancePx: number;
	initialVelocity?: number;
	onUpdate: (frame: ReelAnimationUpdate) => void;
	onComplete?: () => void;
};

export type WinSequenceOptions = {
	duration?: number;
	onSweep?: (progress: number) => void;
	onPulse?: (progress: number) => void;
	onComplete?: () => void;
};

const now = (): number =>
	typeof performance !== 'undefined' && typeof performance.now === 'function'
		? performance.now()
		: Date.now();

export const easeOutExpo = (t: number): number =>
	t >= 1 ? 1 : 1 - 2 ** (-10 * Math.max(0, Math.min(1, t)));

export const easeOutBack = (t: number): number => {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

export const clamp = (value: number, min = 0, max = 1): number =>
	Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, progress: number): number =>
	start + (end - start) * progress;

export const animateNumber = (
	from: number,
	to: number,
	duration: number,
	onUpdate: (value: number) => void,
): Promise<void> =>
	new Promise((resolve) => {
		const start = now();

		const tick = (): void => {
			const progress = clamp((now() - start) / Math.max(1, duration));
			onUpdate(lerp(from, to, easeOutExpo(progress)));

			if (progress < 1) {
				requestAnimationFrame(tick);
				return;
			}

			resolve();
		};

		requestAnimationFrame(tick);
	});

export const spinReel = ({
	duration,
	distancePx,
	initialVelocity = 1,
	onUpdate,
	onComplete,
}: ReelAnimationOptions): Promise<void> =>
	new Promise((resolve) => {
		const start = now();

		const tick = (): void => {
			const progress = clamp((now() - start) / Math.max(1, duration));
			const eased = easeOutExpo(progress);
			const velocity = lerp(initialVelocity, 0, eased);
			const blurPx = lerp(6, 0, eased);
			onUpdate({
				offsetPx: lerp(0, distancePx, eased),
				blurPx,
				velocity,
				progress,
			});

			if (progress < 1) {
				requestAnimationFrame(tick);
				return;
			}

			onComplete?.();
			resolve();
		};

		requestAnimationFrame(tick);
	});

export const stopReel = (
	distancePx: number,
	duration: number,
	onUpdate: (frame: ReelAnimationUpdate) => void,
): Promise<void> =>
	spinReel({
		duration,
		distancePx,
		initialVelocity: 0.92,
		onUpdate: (frame) =>
			onUpdate({
				...frame,
				offsetPx: lerp(0, distancePx, easeOutBack(frame.progress)),
			}),
	});

export const playWinSequence = ({
	duration = 1400,
	onSweep,
	onPulse,
	onComplete,
}: WinSequenceOptions = {}): Promise<void> =>
	new Promise((resolve) => {
		const start = now();

		const tick = (): void => {
			const progress = clamp((now() - start) / duration);
			onSweep?.(easeOutExpo(progress));
			onPulse?.((Math.sin(progress * Math.PI * 3) + 1) / 2);

			if (progress < 1) {
				requestAnimationFrame(tick);
				return;
			}

			onComplete?.();
			resolve();
		};

		requestAnimationFrame(tick);
	});
