import { s as require_jsx_runtime } from "../_libs/@ai-sdk/react+[...].mjs";
import { d as useRouterState, m as Outlet, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as User, p as MessageSquare } from "../_libs/lucide-react.mjs";
import { t as useKeyboardInset } from "./use-keyboard-inset-DKwWDHSm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-Db3-ertr.js
var import_jsx_runtime = require_jsx_runtime();
function AuthedShell() {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const onChat = path.startsWith("/chat");
	const onAccount = path.startsWith("/account");
	const kb = useKeyboardInset();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[100dvh] flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom))]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		}), kb === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur",
			style: { paddingBottom: "env(safe-area-inset-bottom)" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-md grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabLink, {
					to: "/account",
					active: onAccount,
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5" }),
					label: "Account"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabLink, {
					to: "/chat",
					active: onChat,
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }),
					label: "Chat"
				})]
			})
		})]
	});
}
function TabLink({ to, active, icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: `flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`,
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
	});
}
//#endregion
export { AuthedShell as component };
