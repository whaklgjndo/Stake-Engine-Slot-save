import { n as __export } from "./chunk-SL3VIQZ3-qUWKcnSj.js";
import { st as definePreviewAddon10 } from "./components-Nag1iNbt.js";
import { t as DocsRenderer } from "./chunk-OATZR77O-DoR8UDp8.js";
//#region ../../node_modules/.pnpm/@storybook+addon-docs@10.3._939e4271db4ffb15d8783948ad5350fc/node_modules/@storybook/addon-docs/dist/_browser-chunks/chunk-S4QKU6I5.js
var preview_exports = {};
__export(preview_exports, { parameters: () => parameters });
var excludeTags = Object.entries(globalThis.TAGS_OPTIONS ?? {}).reduce((acc, entry) => {
	let [tag, option] = entry;
	return option.excludeFromDocsStories && (acc[tag] = !0), acc;
}, {}), parameters = { docs: {
	renderer: async () => {
		let { DocsRenderer } = await import("./DocsRenderer-LL677BLK-DXWervJB.js");
		return new DocsRenderer();
	},
	stories: { filter: (story) => (story.tags || []).filter((tag) => excludeTags[tag]).length === 0 && !story.parameters.docs?.disable }
} };
//#endregion
//#region ../../node_modules/.pnpm/@storybook+addon-docs@10.3._939e4271db4ffb15d8783948ad5350fc/node_modules/@storybook/addon-docs/dist/index.js
var index_default = () => definePreviewAddon10(preview_exports);
//#endregion
export { DocsRenderer, index_default as default };

//# sourceMappingURL=@storybook_addon-docs.js.map