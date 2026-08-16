import { i as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/@ai-sdk/react+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as listRepoSelections, u as listKaggleNotebooks, y as useServerFn } from "./kaggle.functions-B_7yxI00.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { S as Github, f as NotebookPen, m as MessageSquarePlus, v as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as listThreads, t as createThread } from "./threads.functions-DKC9bzHH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat.index-BV0qDhi-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChatIndex() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const listFn = useServerFn(listThreads);
	const reposFn = useServerFn(listRepoSelections);
	const createFn = useServerFn(createThread);
	const threads = useQuery({
		queryKey: ["threads"],
		queryFn: () => listFn()
	});
	const repos = useQuery({
		queryKey: ["repo_selections"],
		queryFn: () => reposFn()
	});
	const notebooksFn = useServerFn(listKaggleNotebooks);
	const notebooks = useQuery({
		queryKey: ["kaggle_notebooks"],
		queryFn: () => notebooksFn().catch(() => [])
	});
	const createMut = useMutation({
		mutationFn: (target) => createFn({ data: target }),
		onSuccess: (t) => {
			qc.invalidateQueries({ queryKey: ["threads"] });
			navigate({
				to: "/chat/$threadId",
				params: { threadId: t.id }
			});
		}
	});
	(0, import_react.useEffect)(() => {
		if (threads.data && threads.data.length > 0) navigate({
			to: "/chat/$threadId",
			params: { threadId: threads.data[0].id },
			replace: true
		});
	}, [threads.data, navigate]);
	if (threads.isLoading || repos.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-full place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin" })
	});
	const hasRepo = (repos.data ?? []).length > 0;
	const hasNotebook = (notebooks.data ?? []).length > 0;
	if (!hasRepo && !hasNotebook) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-full place-items-center p-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "mx-auto h-8 w-8 text-muted-foreground" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 font-medium",
					children: "Pick something to code on"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Head to the Account tab to connect GitHub and pick a repo, or connect Kaggle and add a notebook."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-full place-items-center p-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "No chats yet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Start a conversation about your code."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2",
					children: [hasRepo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						disabled: createMut.isPending,
						onClick: () => createMut.mutate({ repoId: repos.data[0].id }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, { className: "mr-2 h-4 w-4" }),
							" New chat · ",
							repos.data[0].name
						]
					}), hasNotebook && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "w-full",
						disabled: createMut.isPending,
						onClick: () => createMut.mutate({ kaggleNotebookId: notebooks.data[0].id }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookPen, { className: "mr-2 h-4 w-4" }),
							" New chat · ",
							notebooks.data[0].slug
						]
					})]
				})
			]
		})
	});
}
//#endregion
export { ChatIndex as component };
