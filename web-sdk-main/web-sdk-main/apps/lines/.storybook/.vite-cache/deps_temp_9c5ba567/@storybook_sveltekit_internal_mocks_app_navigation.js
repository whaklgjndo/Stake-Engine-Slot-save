import { n as getContext, r as setContext, t as onMount } from "./index-client-DVbkJgjW.js";
//#region ../../node_modules/.pnpm/@storybook+sveltekit@10.3.4_c8959914d67dd41285a9677efe90e7b5/node_modules/@storybook/sveltekit/dist/mocks/app/navigation.js
async function goto(...args) {
	let event = new CustomEvent("storybook:goto", { detail: args });
	window.dispatchEvent(event);
}
function setAfterNavigateArgument(afterNavigateArgs) {
	setContext("after-navigate-args", afterNavigateArgs);
}
function afterNavigate(cb) {
	let argument = getContext("after-navigate-args");
	onMount(() => {
		cb && cb instanceof Function && cb(argument);
	});
}
function onNavigate() {}
function beforeNavigate() {}
function disableScrollHandling() {}
async function invalidate(...args) {
	let event = new CustomEvent("storybook:invalidate", { detail: args });
	window.dispatchEvent(event);
}
async function invalidateAll() {
	let event = new CustomEvent("storybook:invalidateAll");
	window.dispatchEvent(event);
}
function preloadCode() {}
function preloadData() {}
async function pushState(...args) {
	let event = new CustomEvent("storybook:pushState", { detail: args });
	window.dispatchEvent(event);
}
async function replaceState(...args) {
	let event = new CustomEvent("storybook:replaceState", { detail: args });
	window.dispatchEvent(event);
}
//#endregion
export { afterNavigate, beforeNavigate, disableScrollHandling, goto, invalidate, invalidateAll, onNavigate, preloadCode, preloadData, pushState, replaceState, setAfterNavigateArgument };

//# sourceMappingURL=@storybook_sveltekit_internal_mocks_app_navigation.js.map