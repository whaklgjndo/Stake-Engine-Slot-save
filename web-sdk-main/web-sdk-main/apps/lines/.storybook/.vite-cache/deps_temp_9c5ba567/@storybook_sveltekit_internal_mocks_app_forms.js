//#region ../../node_modules/.pnpm/@storybook+sveltekit@10.3.4_c8959914d67dd41285a9677efe90e7b5/node_modules/@storybook/sveltekit/dist/mocks/app/forms.js
function enhance(form) {
	let listener = (...args) => {
		args[0].preventDefault();
		let event = new CustomEvent("storybook:enhance", { detail: args });
		window.dispatchEvent(event);
	};
	return form.addEventListener("submit", listener), { destroy() {
		form.removeEventListener("submit", listener);
	} };
}
function applyAction() {}
function deserialize() {}
//#endregion
export { applyAction, deserialize, enhance };

//# sourceMappingURL=@storybook_sveltekit_internal_mocks_app_forms.js.map