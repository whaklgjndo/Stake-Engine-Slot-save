import { t as require_test } from "./test-DBrGOAVg.js";
//#region ../../node_modules/.pnpm/@storybook+sveltekit@10.3.4_c8959914d67dd41285a9677efe90e7b5/node_modules/@storybook/sveltekit/static/app-state-mock.svelte.js
var import_test = require_test();
/**
* @typedef {Object} App
* @property {Object} Error
* @property {string} Error.message
* @property {Object} Locals
* @property {Object} PageData
* @property {Object} PageState
* @property {Object} Platform
*/
/**
* @typedef {Object} Page
* @property {URL} url
* @property {Record<string, string>} params
* @property {Object} route
* @property {string | null} route.id
* @property {number} status
* @property {App.Error | null} error
* @property {App.PageData & Record<string, any>} data
* @property {App.PageState} state
* @property {any} form
*/
var defaultStatePageValues = {
	data: {},
	form: null,
	error: null,
	params: {},
	route: { id: null },
	state: {},
	status: -1,
	url: new URL(location.origin)
};
/** @type {Page['data']} */
var pageData = $state.raw(defaultStatePageValues.data);
/** @type {Page['form']} */
var pageForm = $state.raw(defaultStatePageValues.form);
/** @type {Page['error']} */
var pageError = $state.raw(defaultStatePageValues.error);
/** @type {Page['params']} */
var pageParams = $state.raw(defaultStatePageValues.params);
/** @type {Page['route']} */
var pageRoute = $state.raw(defaultStatePageValues.route);
/** @type {Page['state']} */
var pageState = $state.raw(defaultStatePageValues.state);
/** @type {Page['status']} */
var pageStatus = $state.raw(defaultStatePageValues.status);
/** @type {Page['url']} */
var pageUrl = $state.raw(defaultStatePageValues.url);
/** @type {Page} */
var page = {
	get data() {
		return pageData;
	},
	set data(newPageData) {
		pageData = newPageData;
	},
	get form() {
		return pageForm;
	},
	set form(newPageForm) {
		pageForm = newPageForm;
	},
	get error() {
		return pageError;
	},
	set error(newPageError) {
		pageError = newPageError;
	},
	get params() {
		return pageParams;
	},
	set params(newPageParams) {
		pageParams = newPageParams;
	},
	get route() {
		return pageRoute;
	},
	set route(newPageRoute) {
		pageRoute = newPageRoute;
	},
	get state() {
		return pageState;
	},
	set state(newPageState) {
		pageState = newPageState;
	},
	get status() {
		return pageStatus;
	},
	set status(newPageStatus) {
		pageStatus = newPageStatus;
	},
	get url() {
		return pageUrl;
	},
	set url(newPageUrl) {
		pageUrl = newPageUrl;
	}
};
function setAppStatePage(params = {}) {
	page.data = params.data ?? defaultStatePageValues.data;
	page.form = params.form ?? defaultStatePageValues.form;
	page.error = params.error ?? defaultStatePageValues.error;
	page.params = params.params ?? defaultStatePageValues.params;
	page.route = params.route ?? defaultStatePageValues.route;
	page.state = params.state ?? defaultStatePageValues.state;
	page.status = params.status ?? defaultStatePageValues.status;
	page.url = params.url ?? defaultStatePageValues.url;
}
/**
* @typedef {Object} NavigationTarget
* @property {Record<string, string> | null} params
* @property {Object} route
* @property {string | null} route.id
* @property {URL} url
*/
/** @typedef {'enter' | 'form' | 'leave' | 'link' | 'goto' | 'popstate'} NavigationType */
/**
* @typedef {Object} Navigation
* @property {NavigationTarget | null} from
* @property {NavigationTarget | null} to
* @property {Exclude<NavigationType, 'enter'>} type
* @property {boolean} willUnload
* @property {number} [delta]
* @property {Promise<void>} complete
*/
var defaultStateNavigatingValues = {
	from: null,
	to: null,
	type: null,
	willUnload: null,
	delta: null,
	complete: null
};
/** @type {Navigation['from'] | null} */
var navigatingFrom = $state.raw(defaultStateNavigatingValues.from);
/** @type {Navigation['to'] | null} */
var navigatingTo = $state.raw(defaultStateNavigatingValues.to);
/** @type {Navigation['type'] | null} */
var navigatingType = $state.raw(defaultStateNavigatingValues.type);
/** @type {Navigation['willUnload'] | null} */
var navigatingWillUnload = $state.raw(defaultStateNavigatingValues.willUnload);
/** @type {Navigation['delta'] | null} */
var navigatingDelta = $state.raw(defaultStateNavigatingValues.delta);
/** @type {Navigation['complete'] | null} */
var navigatingComplete = $state.raw(defaultStateNavigatingValues.complete);
/** @type {Navigation} */
var navigating = {
	get from() {
		return navigatingFrom;
	},
	set from(newNavigatingFrom) {
		navigatingFrom = newNavigatingFrom;
	},
	get to() {
		return navigatingTo;
	},
	set to(newNavigatingTo) {
		navigatingTo = newNavigatingTo;
	},
	get type() {
		return navigatingType;
	},
	set type(newNavigatingType) {
		navigatingType = newNavigatingType;
	},
	get willUnload() {
		return navigatingWillUnload;
	},
	set willUnload(newNavigatingWillUnload) {
		navigatingWillUnload = newNavigatingWillUnload;
	},
	get delta() {
		return navigatingDelta;
	},
	set delta(newNavigatingDelta) {
		navigatingDelta = newNavigatingDelta;
	},
	get complete() {
		return navigatingComplete;
	},
	set complete(newNavigatingComplete) {
		navigatingComplete = newNavigatingComplete;
	}
};
function setAppStateNavigating(params = {}) {
	navigating.from = params.from ?? defaultStateNavigatingValues.from;
	navigating.to = params.to ?? defaultStateNavigatingValues.to;
	navigating.type = params.type ?? defaultStateNavigatingValues.type;
	navigating.willUnload = params.willUnload ?? defaultStateNavigatingValues.willUnload;
	navigating.delta = params.delta ?? defaultStateNavigatingValues.delta;
	navigating.complete = params.complete ?? defaultStateNavigatingValues.complete;
}
/** @type {boolean} */
var updatedCurrent = $state.raw(false);
var updated = {
	get current() {
		return updatedCurrent;
	},
	set current(newCurrent) {
		updatedCurrent = newCurrent;
	},
	check: (0, import_test.fn)(() => Promise.resolve(updatedCurrent))
};
function setAppStateUpdated(params = {}) {
	updated.current = params.current ?? false;
}
//#endregion
export { navigating, page, setAppStateNavigating, setAppStatePage, setAppStateUpdated, updated };

//# sourceMappingURL=@storybook_sveltekit_internal_mocks_app_state__svelte__js.js.map