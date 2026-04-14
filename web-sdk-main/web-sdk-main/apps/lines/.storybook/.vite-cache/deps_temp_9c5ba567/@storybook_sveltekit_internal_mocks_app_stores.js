import { n as getContext, r as setContext } from "./index-client-DVbkJgjW.js";
//#region ../../node_modules/.pnpm/@storybook+sveltekit@10.3.4_c8959914d67dd41285a9677efe90e7b5/node_modules/@storybook/sveltekit/dist/mocks/app/stores.js
function createMockedStore(contextName) {
	return [{ subscribe(runner) {
		return runner(getContext(contextName)), () => {};
	} }, (value) => {
		setContext(contextName, value);
	}];
}
var [page, setAppStoresPage] = createMockedStore("page-ctx"), [navigating, setAppStoresNavigating] = createMockedStore("navigating-ctx"), [updated, setAppStoresUpdated] = createMockedStore("updated-ctx");
updated.check = () => {};
function getStores() {
	return {
		page,
		navigating,
		updated
	};
}
//#endregion
export { getStores, navigating, page, setAppStoresNavigating, setAppStoresPage, setAppStoresUpdated, updated };

//# sourceMappingURL=@storybook_sveltekit_internal_mocks_app_stores.js.map