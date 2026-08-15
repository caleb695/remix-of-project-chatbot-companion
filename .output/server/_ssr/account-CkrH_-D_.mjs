import { s as require_jsx_runtime } from "../_libs/@ai-sdk/react+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-CkrH_-D_.js
var import_jsx_runtime = require_jsx_runtime();
var SplitErrorComponent = ({ error, reset }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "mx-auto max-w-md p-6 text-center text-sm",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-destructive",
		children: error.message
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		className: "mt-3",
		size: "sm",
		variant: "outline",
		onClick: reset,
		children: "Try again"
	})]
});
//#endregion
export { SplitErrorComponent as errorComponent };
