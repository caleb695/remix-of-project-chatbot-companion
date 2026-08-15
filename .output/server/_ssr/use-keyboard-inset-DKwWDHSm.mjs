import { i as __toESM } from "../_runtime.mjs";
import { c as require_react } from "../_libs/@ai-sdk/react+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-keyboard-inset-DKwWDHSm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Height (px) currently covered by the on-screen keyboard.
* iOS Safari keeps `position: fixed` glued to the layout viewport, so anything
* pinned to the bottom must be translated up by this amount to stay visible.
*/
function useKeyboardInset() {
	const [inset, setInset] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const vv = typeof window !== "undefined" ? window.visualViewport : null;
		if (!vv) return;
		const update = () => {
			const covered = window.innerHeight - vv.height - vv.offsetTop;
			setInset(covered > 40 ? Math.round(covered) : 0);
		};
		update();
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
		};
	}, []);
	return inset;
}
//#endregion
export { useKeyboardInset as t };
