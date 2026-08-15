import { i as __toESM } from "../_runtime.mjs";
import { _ as useNavigate, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { c as require_react, n as useChat, r as DefaultChatTransport, s as require_jsx_runtime, t as Chat } from "../_libs/@ai-sdk/react+[...].mjs";
import { At as arrayType, Ft as stringType, Mt as enumType, Nt as numberType, Pt as objectType, jt as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { d as listRepoSelections, i as createSsrRpc, p as pushKaggleNotebook, r as commitAndPush, s as getKaggleStaged, u as listKaggleNotebooks, y as useServerFn } from "./kaggle.functions-Dk7H3ttr.mjs";
import { t as supabase } from "./client--F9kIJS3.mjs";
import { d as listJobsForThread, f as listOpenrouterModels, i as enqueueCodingJob, l as getOpenrouterSettings, n as cancelJob, o as getJob, r as discardJob, s as getJobDiff, t as approveJob } from "./openrouter.functions-ClYN9AkW.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { t as Input } from "./input-DicJzR9-.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as ExternalLink, D as FileDiff, E as FileText, F as Check, I as Bug, L as Brain, N as ChevronRight, O as Eye, P as ChevronDown, R as ArrowUpRight, S as Github, T as Folder, a as Trash2, b as HardDrive, c as Search, d as Paperclip, f as NotebookPen, g as Menu, k as EyeOff, n as X, o as Sparkles, p as MessageSquare, r as Users, s as Send, t as Zap, u as Plus, v as LoaderCircle, w as GitBranch, x as Hammer } from "../_libs/lucide-react.mjs";
import { a as listThreads, i as getThreadMessages, n as deleteThread, o as updateThread, r as getThread, t as createThread } from "./threads.functions-P7s0tOMs.mjs";
import { t as useKeyboardInset } from "./use-keyboard-inset-DKwWDHSm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat._threadId-DcZ-TDJd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listAgentEvents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	taskId: stringType().optional()
}).parse(i)).handler(createSsrRpc("288462ad7884126a87debca8b31147e6110d6668283b715e981a8d95e0a8abb7"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(createSsrRpc("9430de960e752747d7c46ee43b77efae47a49be180f0d36295eec8a54e8eaea6"));
var getStagedChanges = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(createSsrRpc("4983867db0247d965a872534a133288c6795a860553192332c3bf5a0051a13e8"));
var setThreadMode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	id: stringType().uuid(),
	mode: enumType([
		"plan",
		"build",
		"debug",
		"improve"
	])
}).parse(i)).handler(createSsrRpc("48ed0446c7ce24bd908309dad1d50cb7bd9508f10d4dce9ea2f819a7e4c94632"));
/** Summarise a thread and open a fresh thread seeded with that summary. */
var branchThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(createSsrRpc("38e5bc3845ba7eda197af9334fee81f5bc253908490f5562593d780d1c132ad4"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("b38d2d9290280abca8fcca1eb47b72c55ab03ff4bc85c0955e05018d97676861"));
var subAgentSchema = objectType({
	id: stringType().min(1).max(40),
	label: stringType().min(1).max(60),
	model: stringType().min(1).max(200),
	instructions: stringType().max(2e3).optional()
});
var getSubAgents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(createSsrRpc("cc134a8451f0397fce9275c29f3e295ea3f90b68b1b1606ec0c3bd93fe4d1297"));
var setSubAgents = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	subAgents: arrayType(subAgentSchema).max(20)
}).parse(i)).handler(createSsrRpc("59c25b85be7f4346a759731421f4296670280620b664549f3205fd33d068993b"));
var listAttachments = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(createSsrRpc("817a626ecc4b3a6ce25414eb31421835d5432bb5a2846e67921ea783d600e1c7"));
/** Record an upload the client already pushed into the private `attachments` bucket. */
var registerAttachment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	name: stringType().min(1).max(200),
	mimeType: stringType().max(200).optional(),
	sizeBytes: numberType().int().nonnegative().optional(),
	storagePath: stringType().min(1).max(400)
}).parse(i)).handler(createSsrRpc("2d56b64b961fd1ec50056da409115389cc513d1c46949d4765c871e418f81dfe"));
/** code_only = the agent may use the file from code but never reads its contents. */
var setAttachmentCodeOnly = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	id: stringType().uuid(),
	codeOnly: booleanType()
}).parse(i)).handler(createSsrRpc("11458bebf5cace5dd9074d9f98cd6de15041edcfa313739fde3e45dff2be0441"));
var deleteAttachment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("db2812fd35bc89a2c1a545b8baa27e4404b7d56206cebd296793d9ae262ac2f3"));
/**
* Chat instances live outside React so an in-flight run keeps streaming when the
* user navigates away from the chat tab (e.g. to Account) and back.
*/
var chats = /* @__PURE__ */ new Map();
function getThreadChat(threadId, repoId, initial) {
	const key = `${threadId}:${repoId}`;
	let chat = chats.get(key);
	if (!chat) {
		chat = new Chat({
			id: threadId,
			messages: initial,
			transport: new DefaultChatTransport({
				api: "/api/chat",
				fetch: async (input, init) => {
					const { data } = await supabase.auth.getSession();
					const headers = new Headers(init?.headers);
					if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
					return fetch(input, {
						...init,
						headers
					});
				},
				body: {
					threadId,
					repoId
				}
			})
		});
		chats.set(key, chat);
	}
	return chat;
}
/** Run bookkeeping (active job / task id) that must also survive tab switches. */
var runState = /* @__PURE__ */ new Map();
function getRunState(threadId) {
	return runState.get(threadId) ?? {
		taskId: null,
		jobId: null
	};
}
function setRunState(threadId, patch) {
	const current = getRunState(threadId);
	runState.set(threadId, {
		...current,
		...patch
	});
}
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
/** Google-native docs need an export mime type; everything else downloads as-is. */
/** Browse a Drive folder (or search across the whole Drive when `query` is set). */
var listDrive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	folderId: stringType().default("root"),
	query: stringType().max(200).optional()
}).parse(i)).handler(createSsrRpc("ca454c81504de2fdb676dc6f7288b373e3db0750e14236c041fb2f4c09fbfe95"));
/**
* Import Drive files (and whole folders, recursively) into the thread's
* attachments so the agent can use them exactly like a manual upload.
*/
var importFromDrive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	items: arrayType(objectType({
		id: stringType(),
		name: stringType(),
		isFolder: booleanType()
	})).min(1).max(50)
}).parse(i)).handler(createSsrRpc("d8670f9193f53af4c6ffa94b49ff6ce9a612f2f976783855b1532e4810137447"));
function DrivePicker({ open, onOpenChange, threadId, onImported }) {
	const listFn = useServerFn(listDrive);
	const importFn = useServerFn(importFromDrive);
	const [crumbs, setCrumbs] = (0, import_react.useState)([{
		id: "root",
		name: "My Drive"
	}]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [term, setTerm] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)({});
	const current = crumbs[crumbs.length - 1];
	const entries = useQuery({
		queryKey: [
			"drive",
			current.id,
			term
		],
		queryFn: () => listFn({ data: {
			folderId: current.id,
			query: term || void 0
		} }),
		enabled: open
	});
	const doImport = useMutation({
		mutationFn: () => importFn({ data: {
			threadId,
			items: Object.values(selected).map((e) => ({
				id: e.id,
				name: e.name,
				isFolder: e.isFolder
			}))
		} }),
		onSuccess: (res) => {
			if (res.imported.length) toast.success(`Imported ${res.imported.length} file${res.imported.length === 1 ? "" : "s"}`);
			if (res.skipped.length) toast.error(`Skipped ${res.skipped.length}: ${res.skipped[0]?.reason ?? ""}`);
			setSelected({});
			onImported();
			onOpenChange(false);
		},
		onError: (e) => toast.error(e.message)
	});
	const selectedCount = Object.keys(selected).length;
	const openFolder = (entry) => {
		setSearch("");
		setTerm("");
		setCrumbs((prev) => [...prev, {
			id: entry.id,
			name: entry.name
		}]);
	};
	const toggle = (e) => setSelected((prev) => {
		const next = { ...prev };
		if (next[e.id]) delete next[e.id];
		else next[e.id] = e;
		return next;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex max-h-[85vh] flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "h-4 w-4" }), " Google Drive"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Pick files or whole folders. Folders import every file inside them (up to 100)."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 border-b border-border/60 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: search,
						placeholder: "Search your Drive",
						onChange: (e) => setSearch(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter") setTerm(search.trim());
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "secondary",
						onClick: () => setTerm(search.trim()),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4" })
					})]
				}),
				!term && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap items-center gap-1 px-4 py-2 text-xs text-muted-foreground",
					children: crumbs.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: i === crumbs.length - 1 ? "text-foreground" : "hover:text-foreground",
							onClick: () => setCrumbs((p) => p.slice(0, i + 1)),
							children: c.name
						})]
					}, c.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-1 overflow-y-auto p-3",
					children: [
						entries.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center py-8",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
						}),
						entries.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-3 text-sm text-destructive",
							children: entries.error.message
						}),
						entries.data?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-3 text-sm text-muted-foreground",
							children: "Nothing here."
						}),
						(entries.data ?? []).map((e) => {
							const isSelected = Boolean(selected[e.id]);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `flex items-center gap-2 rounded-lg border p-2.5 ${isSelected ? "border-primary/60 bg-primary/5" : "border-border/60"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flex min-w-0 flex-1 items-center gap-2 text-left",
									onClick: () => {
										if (e.isFolder) openFolder(e);
										else toggle(e);
									},
									children: [e.isFolder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-4 w-4 shrink-0 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-sm",
											children: e.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-[10px] text-muted-foreground",
											children: [e.isFolder ? "Folder" : e.mimeType.replace("application/vnd.google-apps.", "Google "), e.size ? ` · ${Math.max(1, Math.round(e.size / 1024))} KB` : ""]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: isSelected ? "default" : "secondary",
									className: "h-8 shrink-0 px-2 text-xs",
									onClick: () => toggle(e),
									children: isSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }) : "Select"
								})]
							}, e.id);
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border/60 p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						disabled: selectedCount === 0 || doImport.isPending,
						onClick: () => doImport.mutate(),
						children: [
							doImport.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1 h-4 w-4 animate-spin" }) : null,
							"Import ",
							selectedCount > 0 ? `${selectedCount} item${selectedCount === 1 ? "" : "s"}` : ""
						]
					})
				})
			]
		})
	});
}
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var MODES = [
	{
		id: "plan",
		label: "Plan",
		icon: Brain,
		hint: "Brainstorm and ask questions. No files are changed."
	},
	{
		id: "build",
		label: "Build",
		icon: Hammer,
		hint: "Agentic coding — edits your working copy."
	},
	{
		id: "debug",
		label: "Debug",
		icon: Bug,
		hint: "Finds and fixes real problems."
	},
	{
		id: "improve",
		label: "Improve",
		icon: Sparkles,
		hint: "Adds features and improves existing code."
	}
];
var PHASE_LABEL = {
	waiting: "Waiting",
	planning: "Planning",
	coding: "Coding",
	checking: "Checking code",
	debugging: "Debugging",
	done: "Done"
};
function ChatThreadPage() {
	const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
	const getMsgs = useServerFn(getThreadMessages);
	const getThreadFn = useServerFn(getThread);
	const initial = useQuery({
		queryKey: ["messages", threadId],
		queryFn: () => getMsgs({ data: { threadId } }),
		refetchInterval: 3e3,
		refetchIntervalInBackground: true
	});
	const thread = useQuery({
		queryKey: ["thread", threadId],
		queryFn: () => getThreadFn({ data: { id: threadId } })
	});
	if (initial.isLoading || thread.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-full place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin" })
	});
	if (!thread.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-6 text-sm text-muted-foreground",
		children: "Thread not found."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatView, {
		threadId,
		initial: initial.data ?? [],
		thread: thread.data
	}, threadId);
}
function ChatView({ threadId, initial, thread }) {
	const qc = useQueryClient();
	const updateFn = useServerFn(updateThread);
	const modeFn = useServerFn(setThreadMode);
	const model = thread.model ?? "";
	const isKaggle = thread.target === "kaggle" && Boolean(thread.kaggle_notebook_id);
	const repoId = thread.repo_selection_id ?? "";
	const notebookId = thread.kaggle_notebook_id ?? "";
	const [mode, setMode] = (0, import_react.useState)(thread.mode ?? "build");
	const [taskId, setTaskIdState] = (0, import_react.useState)(() => getRunState(threadId).taskId);
	const setTaskId = (0, import_react.useCallback)((id) => {
		setTaskIdState(id);
		setRunState(threadId, { taskId: id });
	}, [threadId]);
	const [activityOpen, setActivityOpen] = (0, import_react.useState)(false);
	const kb = useKeyboardInset();
	const { messages, sendMessage, setMessages, status, error, stop } = useChat({ chat: (0, import_react.useMemo)(() => getThreadChat(threadId, repoId, initial), [
		threadId,
		repoId,
		initial
	]) });
	(0, import_react.useEffect)(() => {
		if (initial.length > messages.length) setMessages(initial);
	}, [
		initial,
		messages.length,
		setMessages
	]);
	const [input, setInput] = (0, import_react.useState)("");
	const scrollerRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const composerRef = (0, import_react.useRef)(null);
	const [composerH, setComposerH] = (0, import_react.useState)(120);
	const busy = (status === "submitted" || status === "streaming") && !durable;
	const durable = !isKaggle && mode !== "plan" && Boolean(thread.repo_selections?.workflow_installed_at);
	(0, import_react.useLayoutEffect)(() => {
		if (!composerRef.current) return;
		const el = composerRef.current;
		const ro = new ResizeObserver(() => setComposerH(el.offsetHeight));
		ro.observe(el);
		setComposerH(el.offsetHeight);
		return () => ro.disconnect();
	}, []);
	const autoGrow = (0, import_react.useCallback)(() => {
		const el = inputRef.current;
		if (!el) return;
		el.style.height = "auto";
		const max = Math.round(window.innerHeight * .45);
		el.style.height = `${Math.min(el.scrollHeight, max)}px`;
	}, []);
	(0, import_react.useEffect)(() => {
		autoGrow();
	}, [input, autoGrow]);
	(0, import_react.useEffect)(() => {
		scrollerRef.current?.scrollTo({
			top: scrollerRef.current.scrollHeight,
			behavior: "smooth"
		});
	}, [
		messages,
		status,
		composerH
	]);
	(0, import_react.useEffect)(() => {
		inputRef.current?.focus();
	}, [threadId]);
	const eventsFn = useServerFn(listAgentEvents);
	const enqueueFn = useServerFn(enqueueCodingJob);
	const listJobsFn = useServerFn(listJobsForThread);
	const [activeJobId, setActiveJobIdState] = (0, import_react.useState)(() => getRunState(threadId).jobId);
	const setActiveJobId = (0, import_react.useCallback)((id) => {
		setActiveJobIdState(id);
		setRunState(threadId, { jobId: id });
	}, [threadId]);
	const durableJobs = useQuery({
		queryKey: ["jobs", threadId],
		queryFn: () => listJobsFn({ data: { threadId } }),
		refetchInterval: 3e3,
		refetchIntervalInBackground: true
	});
	(0, import_react.useEffect)(() => {
		const jobs = durableJobs.data ?? [];
		const active = jobs.find((candidate) => ["queued", "running"].includes(candidate.status));
		const target = active ?? jobs[0];
		if (!target) return;
		if (active && activeJobId !== active.id) setActiveJobId(active.id);
		if (target.task_id && taskId !== target.task_id) setTaskId(target.task_id);
	}, [
		activeJobId,
		durableJobs.data,
		setActiveJobId,
		setTaskId,
		taskId
	]);
	const runMut = useMutation({
		mutationFn: (prompt) => enqueueFn({ data: {
			threadId,
			prompt,
			mode,
			taskId: crypto.randomUUID()
		} }),
		onSuccess: (r) => {
			setActiveJobId(r.jobId);
			setTaskId(r.taskId);
			setInput("");
			qc.invalidateQueries({ queryKey: ["jobs", threadId] });
			qc.invalidateQueries({ queryKey: ["messages", threadId] });
			toast.success("Running on GitHub Actions — safe to close the tab");
		},
		onError: (e) => toast.error(e.message)
	});
	const submit = () => {
		const text = input.trim();
		if (!text || runMut.isPending) return;
		if (durable) {
			runMut.mutate(text);
			return;
		}
		const id = crypto.randomUUID();
		setTaskId(id);
		sendMessage({ text }, { body: {
			taskId: id,
			mode
		} });
		setInput("");
		requestAnimationFrame(autoGrow);
	};
	const jobFn = useServerFn(getJob);
	const cancelFn = useServerFn(cancelJob);
	const cancelMut = useMutation({
		mutationFn: (id) => cancelFn({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["job", activeJobId] });
			toast.success("Run cancelled");
		},
		onError: (e) => toast.error(e.message)
	});
	const job = useQuery({
		queryKey: ["job", activeJobId],
		queryFn: () => jobFn({ data: { id: activeJobId } }),
		enabled: Boolean(activeJobId),
		refetchInterval: 3e3
	});
	const jobRunning = job.data ? ["queued", "running"].includes(job.data.status) : false;
	const working = busy || runMut.isPending || jobRunning;
	const stoppedAtRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (working) stoppedAtRef.current = null;
		else if (stoppedAtRef.current === null) stoppedAtRef.current = Date.now();
	}, [working]);
	const withinGrace = stoppedAtRef.current !== null && Date.now() - stoppedAtRef.current < 1e4;
	const events = useQuery({
		queryKey: [
			"agent_events",
			threadId,
			taskId
		],
		queryFn: () => eventsFn({ data: {
			threadId,
			...taskId ? { taskId } : {}
		} }),
		enabled: Boolean(taskId),
		refetchInterval: (query) => {
			if (activityOpen) return 1500;
			const rows = query.state.data;
			if ((Array.isArray(rows) ? rows[rows.length - 1] : void 0)?.phase === "done") return false;
			if (working || withinGrace) return 1500;
			return false;
		}
	});
	const lastEvent = events.data?.[events.data.length - 1];
	const lastPhase = lastEvent?.phase;
	const phase = working && !lastEvent ? "waiting" : !working && Boolean(error) && lastPhase !== "done" ? "done" : lastPhase ?? (working ? "planning" : "done");
	const limitError = events.data?.filter((e) => e.kind === "error").slice(-1)[0]?.text ?? null;
	const prevRunning = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (prevRunning.current && !jobRunning) {
			qc.invalidateQueries({ queryKey: ["messages", threadId] });
			qc.invalidateQueries({ queryKey: ["staged", repoId] });
		}
		prevRunning.current = jobRunning;
	}, [
		jobRunning,
		qc,
		threadId,
		repoId
	]);
	const setModel = useMutation({
		mutationFn: (m) => updateFn({ data: {
			id: threadId,
			model: m
		} }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] })
	});
	const setRepo = useMutation({
		mutationFn: (id) => updateFn({ data: {
			id: threadId,
			repo_selection_id: id
		} }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] })
	});
	const setNotebook = useMutation({
		mutationFn: (id) => updateFn({ data: {
			id: threadId,
			kaggle_notebook_id: id
		} }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] })
	});
	const changeMode = (m) => {
		setMode(m);
		modeFn({ data: {
			id: threadId,
			mode: m
		} }).catch(() => {});
	};
	const navigate = useNavigate();
	const branchFn = useServerFn(branchThread);
	const branchMut = useMutation({
		mutationFn: () => branchFn({ data: { threadId } }),
		onSuccess: (r) => {
			qc.invalidateQueries({ queryKey: ["threads"] });
			toast.success("Summarised — continuing in a new chat");
			navigate({
				to: "/chat/$threadId",
				params: { threadId: r.threadId }
			});
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-2 border-b border-border/60 px-2 py-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThreadsSidebarTrigger, { activeId: threadId }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate text-[13px] font-medium",
							children: thread.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RepoPill, {
							thread,
							onChange: (id) => setRepo.mutate(id),
							onChangeNotebook: (id) => setNotebook.mutate(id)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						className: "h-8 w-8 shrink-0",
						title: "Branch into a new chat with a summary of this one",
						disabled: branchMut.isPending || messages.length === 0,
						onClick: () => branchMut.mutate(),
						children: branchMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-4 w-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: scrollerRef,
				className: "h-[calc(100%-2.5rem)] overflow-y-auto overscroll-contain",
				style: { paddingBottom: composerH + 12 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl px-3 py-3 space-y-4",
					children: [
						messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-10 text-center text-sm text-muted-foreground",
							children: isKaggle && thread.kaggle_notebooks ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"Working on the Kaggle notebook ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono",
									children: [
										thread.kaggle_notebooks.owner,
										"/",
										thread.kaggle_notebooks.slug
									]
								}),
								"."
							] }) : thread.repo_selections ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"Working on ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono",
									children: [
										thread.repo_selections.owner,
										"/",
										thread.repo_selections.name
									]
								}),
								"."
							] }) : "Pick a repo or Kaggle notebook to get started."
						}),
						messages.map((m, i) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
								message: m,
								threadId,
								liveRun: isKaggle && busy && !durable && m.role === "assistant" && i === messages.length - 1 && Boolean(taskId) ? {
									taskId,
									kaggle: isKaggle
								} : null
							}, m.id);
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: /load failed|failed to fetch|networkerror|network request/i.test(error.message) ? "The connection to the model was interrupted. Check your network and try again." : error.message
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobsPanel, {
							threadId,
							activeJobId,
							onClear: () => setActiveJobId(null),
							repo: thread.repo_selections
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: composerRef,
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background",
				style: {
					transform: `translateY(-${kb}px)`,
					paddingBottom: kb > 0 ? 6 : "calc(3.75rem + env(safe-area-inset-bottom))"
				},
				children: [
					isKaggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KaggleCommitBar, {
						notebookId,
						busy: working
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommitBar, {
						repoId,
						busy: working,
						branch: thread.repo_selections?.working_branch ?? "main"
					}),
					(taskId || working) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							if (phase !== "waiting") setActivityOpen(true);
						},
						className: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-muted-foreground",
						children: [
							working ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: PHASE_LABEL[phase] ?? phase
							}),
							lastEvent && phase !== "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "truncate",
								children: ["· ", lastEvent.text]
							}),
							phase !== "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "ml-auto h-3 w-3 shrink-0" })
						]
					}),
					limitError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-3 pb-1 text-[11px] text-destructive",
						children: limitError
					}),
					job.data?.status === "failed" && job.data.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "px-3 pb-1 text-[11px] text-destructive",
						children: ["Run failed: ", job.data.error]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1.5 flex items-center gap-1.5 overflow-x-auto",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModePicker, {
									mode,
									onChange: changeMode
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelPicker, {
									current: model,
									onSelect: (m) => setModel.mutate(m)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubAgentsPicker, { threadId }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-3 w-3 text-primary" }), durable ? "Runs on GitHub Actions" : isKaggle ? "Kaggle notebook" : mode === "plan" ? "Live chat" : "Install the workflow first"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttachButton, { threadId }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									ref: inputRef,
									rows: 1,
									value: input,
									onChange: (e) => setInput(e.target.value),
									onKeyDown: (e) => {
										if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
											e.preventDefault();
											submit();
										}
									},
									placeholder: mode === "plan" ? "Plan or ask anything…" : "Describe the change…",
									className: "min-h-[44px] flex-1 resize-none text-base leading-snug"
								}),
								busy || jobRunning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "icon",
									variant: "secondary",
									className: "h-11 w-11 shrink-0",
									onClick: () => {
										if (jobRunning && activeJobId) cancelMut.mutate(activeJobId);
										else stop();
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "icon",
									className: "h-11 w-11 shrink-0",
									disabled: !input.trim() || runMut.isPending,
									onClick: submit,
									children: runMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySheet, {
				open: activityOpen,
				onOpenChange: setActivityOpen,
				events: events.data ?? [],
				phase,
				busy: working
			})
		]
	});
}
function ModePicker({ mode, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const current = MODES.find((m) => m.id === mode) ?? MODES[1];
	const Icon = current.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[11px] font-medium",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5 text-primary" }),
					current.label,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3 w-3 text-muted-foreground" })
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Agent mode" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 space-y-1",
				children: MODES.map((m) => {
					const I = m.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onChange(m.id);
							setOpen(false);
						},
						className: `flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent ${m.id === mode ? "bg-accent" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(I, { className: "mt-0.5 h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: m.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: m.hint
						})] })]
					}, m.id);
				})
			})]
		})]
	});
}
function SubAgentsPicker({ threadId }) {
	const listFn = useServerFn(getSubAgents);
	const saveFn = useServerFn(setSubAgents);
	const modelsFn = useServerFn(listOpenrouterModels);
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const agents = useQuery({
		queryKey: ["sub-agents", threadId],
		queryFn: () => listFn({ data: { threadId } })
	});
	const models = useQuery({
		queryKey: ["or-models"],
		queryFn: () => modelsFn({}),
		enabled: open,
		staleTime: 600 * 1e3
	});
	const save = useMutation({
		mutationFn: (subAgents) => saveFn({ data: {
			threadId,
			subAgents
		} }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["sub-agents", threadId] }),
		onError: (e) => toast.error(e.message)
	});
	const list = agents.data ?? [];
	const update = (next) => save.mutate(next);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[11px] font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5 text-primary" }), list.length ? `${list.length} sub-agent${list.length === 1 ? "" : "s"}` : "Sub-agents"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex h-[85vh] flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Sub-agents" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "The main agent splits the task and delegates parts to these agents so they work in parallel on the same checkout."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-3 overflow-y-auto p-4",
					children: [list.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No sub-agents yet."
					}), list.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 rounded-lg border border-border/60 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: a.label,
									onChange: (e) => update(list.map((x, j) => j === i ? {
										...x,
										label: e.target.value
									} : x)),
									className: "h-8 text-sm",
									placeholder: "Name (e.g. Frontend)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									className: "h-8 w-8 shrink-0",
									onClick: () => update(list.filter((_, j) => j !== i)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5 text-destructive" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: a.model,
								onChange: (e) => update(list.map((x, j) => j === i ? {
									...x,
									model: e.target.value
								} : x)),
								className: "h-8 w-full rounded-md border border-input bg-background px-2 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: a.model,
									children: a.model
								}), (models.data ?? []).filter((m) => m.id !== a.model).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: m.id,
									children: m.name
								}, m.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 2,
								value: a.instructions ?? "",
								onChange: (e) => update(list.map((x, j) => j === i ? {
									...x,
									instructions: e.target.value
								} : x)),
								placeholder: "What this agent owns (e.g. UI components under src/components)",
								className: "resize-none text-xs"
							})
						]
					}, a.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border/60 p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						disabled: save.isPending || list.length >= 20,
						onClick: () => update([...list, {
							id: `agent-${Date.now().toString(36)}`,
							label: `Agent ${list.length + 1}`,
							model: (models.data ?? [])[0]?.id ?? "",
							instructions: ""
						}]),
						children: save.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add sub-agent"] })
					})
				})
			]
		})]
	});
}
function AttachButton({ threadId }) {
	const listFn = useServerFn(listAttachments);
	const registerFn = useServerFn(registerAttachment);
	const toggleFn = useServerFn(setAttachmentCodeOnly);
	const removeFn = useServerFn(deleteAttachment);
	const qc = useQueryClient();
	const fileRef = (0, import_react.useRef)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [driveOpen, setDriveOpen] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const files = useQuery({
		queryKey: ["attachments", threadId],
		queryFn: () => listFn({ data: { threadId } })
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: ["attachments", threadId] });
	const toggle = useMutation({
		mutationFn: (v) => toggleFn({ data: v }),
		onSuccess: invalidate,
		onError: (e) => toast.error(e.message)
	});
	const remove = useMutation({
		mutationFn: (id) => removeFn({ data: { id } }),
		onSuccess: invalidate,
		onError: (e) => toast.error(e.message)
	});
	const upload = async (picked) => {
		setUploading(true);
		try {
			const { data: auth } = await supabase.auth.getUser();
			const uid = auth.user?.id;
			if (!uid) throw new Error("Not signed in");
			for (const file of Array.from(picked)) {
				const safe = file.name.replace(/[^\w.-]+/g, "_");
				const storagePath = `${uid}/${threadId}/${Date.now()}-${safe}`;
				const { error } = await supabase.storage.from("attachments").upload(storagePath, file);
				if (error) throw error;
				await registerFn({ data: {
					threadId,
					name: safe,
					mimeType: file.type || void 0,
					sizeBytes: file.size,
					storagePath
				} });
			}
			invalidate();
			toast.success("Uploaded");
			setOpen(true);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};
	const count = files.data?.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileRef,
			type: "file",
			multiple: true,
			className: "hidden",
			onChange: (e) => {
				if (e.target.files?.length) upload(e.target.files);
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative shrink-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "icon",
				variant: "secondary",
				className: "h-11 w-11",
				onClick: () => setOpen(true),
				children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "h-4 w-4" })
			}), count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
				children: count
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
				side: "bottom",
				className: "flex max-h-[80vh] flex-col p-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
						className: "border-b border-border/60 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Uploaded files" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Every file is placed in ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "uploads/" }),
								" so the agent's code can use it. Turn off “AI can read” to keep the contents private — the agent only knows the file exists."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-2 overflow-y-auto p-4",
						children: [count === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Nothing uploaded yet."
						}), (files.data ?? []).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-lg border border-border/60 p-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm",
										children: f.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] text-muted-foreground",
										children: [f.mime_type ?? "file", f.size_bytes ? ` · ${Math.max(1, Math.round(f.size_bytes / 1024))} KB` : ""]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => toggle.mutate({
										id: f.id,
										codeOnly: !f.code_only
									}),
									className: `flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] ${f.code_only ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`,
									children: [f.code_only ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }), f.code_only ? "Code only" : "AI can read"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									className: "h-8 w-8 shrink-0",
									onClick: () => remove.mutate(f.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5 text-destructive" })
								})
							]
						}, f.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 border-t border-border/60 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "flex-1",
							disabled: uploading,
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add files"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "flex-1",
							onClick: () => {
								setOpen(false);
								setDriveOpen(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "mr-1 h-4 w-4" }), " Google Drive"]
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrivePicker, {
			threadId,
			open: driveOpen,
			onOpenChange: setDriveOpen,
			onImported: invalidate
		})
	] });
}
function ActivitySheet({ open, onOpenChange, events, phase, busy }) {
	const agents = Array.from(new Set(events.map((e) => e.agent_id)));
	const [agent, setAgent] = (0, import_react.useState)("main");
	const shown = events.filter((e) => e.agent_id === (agents.includes(agent) ? agent : agents[0] ?? "main"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex h-[88vh] flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
						className: "flex items-center gap-2 text-base",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }), PHASE_LABEL[phase] ?? phase]
					})
				}),
				agents.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5 overflow-x-auto border-b border-border/60 p-2",
					children: agents.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setAgent(a),
						className: `shrink-0 rounded-full px-2.5 py-1 text-[11px] ${a === agent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`,
						children: events.find((e) => e.agent_id === a)?.agent_label ?? a
					}, a))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-3 overflow-y-auto p-4",
					children: [shown.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Nothing yet."
					}), shown.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${e.kind === "error" ? "bg-destructive" : e.kind === "action" ? "bg-primary" : "bg-muted-foreground/50"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm leading-snug ${e.kind === "thought" ? "italic text-muted-foreground" : e.kind === "error" ? "text-destructive" : "text-foreground"}`,
								children: e.text
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70",
								children: [
									PHASE_LABEL[e.phase] ?? e.phase,
									" · ",
									new Date(e.created_at).toLocaleTimeString()
								]
							})]
						})]
					}, e.id))]
				})
			]
		})
	});
}
function CommitBar({ repoId, busy, branch }) {
	const stagedFn = useServerFn(getStagedChanges);
	const commitFn = useServerFn(commitAndPush);
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)("");
	const staged = useQuery({
		queryKey: ["staged", repoId],
		queryFn: () => stagedFn({ data: { repoId } }),
		refetchInterval: busy ? 3e3 : 15e3
	});
	const commitMut = useMutation({
		mutationFn: (msg) => commitFn({ data: {
			repoId,
			message: msg
		} }),
		onSuccess: (r) => {
			toast.success(`Pushed ${r.count} file(s) to ${branch}`);
			setOpen(false);
			setMessage("");
			qc.invalidateQueries({ queryKey: ["staged", repoId] });
		},
		onError: (e) => toast.error(e.message)
	});
	const rows = staged.data ?? [];
	if (rows.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDiff, { className: "h-3.5 w-3.5 text-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[11px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: rows.length
					}),
					" staged change",
					rows.length === 1 ? "" : "s"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				className: "ml-auto h-7 px-2 text-[11px]",
				onClick: () => setOpen(true),
				children: "Review"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "h-7 px-2.5 text-[11px]",
				disabled: commitMut.isPending,
				onClick: () => commitMut.mutate(`Coderbot: update ${rows.length} file(s)`),
				children: commitMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : "Commit"
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex h-[80vh] flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, { children: ["Staged changes · ", branch] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto p-3",
					children: rows.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 border-b border-border/40 py-2 font-mono text-[11px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `w-14 shrink-0 uppercase ${f.status === "added" ? "text-emerald-500" : f.status === "deleted" ? "text-destructive" : "text-amber-500"}`,
							children: f.status
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: f.path
						})]
					}, f.path))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 border-t border-border/60 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: message,
						onChange: (e) => setMessage(e.target.value),
						placeholder: "Commit message (optional)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						disabled: commitMut.isPending,
						onClick: () => commitMut.mutate(message.trim() || `Coderbot: update ${rows.length} file(s)`),
						children: commitMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : `Commit & push to ${branch}`
					})]
				})
			]
		})
	})] });
}
function KaggleCommitBar({ notebookId, busy }) {
	const stagedFn = useServerFn(getKaggleStaged);
	const pushFn = useServerFn(pushKaggleNotebook);
	const qc = useQueryClient();
	const staged = useQuery({
		queryKey: ["kaggle_staged", notebookId],
		queryFn: () => stagedFn({ data: { id: notebookId } }),
		refetchInterval: busy ? 3e3 : 15e3
	});
	const pushMut = useMutation({
		mutationFn: () => pushFn({ data: { id: notebookId } }),
		onSuccess: () => {
			toast.success("Pushed a new notebook version to Kaggle");
			qc.invalidateQueries({ queryKey: ["kaggle_staged", notebookId] });
			qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (!staged.data?.dirty) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDiff, { className: "h-3.5 w-3.5 text-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "truncate text-[11px]",
				children: ["Staged notebook edits · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono",
					children: staged.data.ref
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "ml-auto h-7 px-2.5 text-[11px]",
				disabled: pushMut.isPending,
				onClick: () => pushMut.mutate(),
				children: pushMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : "Commit to Kaggle"
			})
		]
	});
}
function JobsPanel({ threadId, activeJobId, onClear, repo }) {
	const listFn = useServerFn(listJobsForThread);
	const getFn = useServerFn(getJob);
	const cancelFn = useServerFn(cancelJob);
	const qc = useQueryClient();
	const jobs = useQuery({
		queryKey: ["jobs", threadId],
		queryFn: () => listFn({ data: { threadId } }),
		refetchInterval: 4e3
	});
	const active = jobs.data?.find((j) => j.id === activeJobId) ?? jobs.data?.find((j) => ["running", "queued"].includes(j.status));
	const detail = useQuery({
		queryKey: ["job", active?.id],
		queryFn: () => getFn({ data: { id: active.id } }),
		enabled: !!active,
		refetchInterval: (q) => {
			const s = q.state.data?.status;
			return s === "completed" || s === "failed" ? false : 2500;
		}
	});
	const cancelMut = useMutation({
		mutationFn: (id) => cancelFn({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs", threadId] })
	});
	if (!active) return null;
	const d = detail.data ?? active;
	const running = ["queued", "running"].includes(d.status);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-3.5 w-3.5 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-medium",
						children: ["Actions job · ", d.status]
					}),
					repo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://github.com/${repo.owner}/${repo.name}/actions`,
						target: "_blank",
						rel: "noreferrer",
						className: "ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground",
						children: ["Actions ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 truncate text-muted-foreground",
				children: d.prompt
			}),
			d.logs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground",
				children: d.logs
			}) : null,
			d.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-destructive",
				children: d.error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [running && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => cancelMut.mutate(d.id),
					children: "Cancel"
				}), !running && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onClear,
					children: "Dismiss"
				})]
			})
		]
	});
}
var TOOL_VERB = {
	write_file: "Wrote",
	edit_file: "Edited",
	delete_file: "Deleted",
	read_file: "Read",
	list_files: "Listed files",
	search_code: "Searched",
	check_code: "Checked code",
	staged_changes: "Reviewed staged changes"
};
function MessageBubble({ message, threadId, liveRun }) {
	const isUser = message.role === "user";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `flex ${isUser ? "justify-end" : "justify-start"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: isUser ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground" : "max-w-full text-foreground",
			children: [liveRun && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunCard, {
				threadId,
				run: {
					taskId: liveRun.taskId,
					kaggle: liveRun.kaggle,
					status: "running"
				}
			}), (() => {
				const hasRunPart = message.parts.some((p) => p.type === "data-run");
				return message.parts.map((part, i) => {
					if (liveRun && part.type === "text") return null;
					if ((liveRun || hasRunPart) && part.type.startsWith("tool-call")) return null;
					if (part.type === "text") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "whitespace-pre-wrap text-sm leading-relaxed",
						children: part.text
					}, i);
					if (part.type === "data-run") {
						const data = part.data;
						if (!data?.jobId && !data?.taskId) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunCard, {
							threadId,
							run: data
						}, i);
					}
					if (part.type.startsWith("tool-")) {
						const p = part;
						const name = p.type.replace(/^tool-/, "");
						const path = p.input?.path ?? p.input?.query ?? "";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "my-1 inline-flex max-w-full items-center gap-1.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: TOOL_VERB[name] ?? name
							}), path && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: path
							})]
						}, i);
					}
					return null;
				});
			})()]
		})
	});
}
function RunCard({ threadId, run }) {
	const qc = useQueryClient();
	const jobFn = useServerFn(getJob);
	const diffFn = useServerFn(getJobDiff);
	const eventsFn = useServerFn(listAgentEvents);
	const approveFn = useServerFn(approveJob);
	const discardFn = useServerFn(discardJob);
	const [changesOpen, setChangesOpen] = (0, import_react.useState)(false);
	const [activityOpen, setActivityOpen] = (0, import_react.useState)(false);
	const job = useQuery({
		queryKey: ["job", run.jobId],
		queryFn: () => jobFn({ data: { id: run.jobId } }),
		enabled: Boolean(run.jobId)
	});
	const diff = useQuery({
		queryKey: ["job-diff", run.jobId],
		queryFn: () => diffFn({ data: { id: run.jobId } }),
		enabled: changesOpen && Boolean(run.jobId)
	});
	const events = useQuery({
		queryKey: [
			"agent_events",
			threadId,
			run.taskId
		],
		queryFn: () => eventsFn({ data: {
			threadId,
			...run.taskId ? { taskId: run.taskId } : {}
		} }),
		enabled: activityOpen && Boolean(run.taskId)
	});
	const done = () => {
		qc.invalidateQueries({ queryKey: ["job", run.jobId] });
		qc.invalidateQueries({ queryKey: ["jobs", threadId] });
	};
	const approve = useMutation({
		mutationFn: () => approveFn({ data: { id: run.jobId } }),
		onSuccess: (r) => {
			toast.success(`Merged into ${r.base}`);
			done();
		},
		onError: (e) => toast.error(e.message)
	});
	const discard = useMutation({
		mutationFn: () => discardFn({ data: { id: run.jobId } }),
		onSuccess: () => {
			toast.success("Changes discarded");
			done();
		},
		onError: (e) => toast.error(e.message)
	});
	const status = job.data?.status ?? run.status ?? "completed";
	const files = (job.data?.changed_files)?.length ? job.data.changed_files : run.files ?? [];
	const pending = Boolean(run.jobId) && status === "awaiting_review";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 rounded-lg border border-border bg-card p-3 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDiff, { className: "h-3.5 w-3.5 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: run.kaggle ? status === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }), " Working on the notebook…"]
						}) : "Changes staged in the notebook" : pending ? "Waiting for your approval" : status === "discarded" ? "Changes discarded" : "Changes merged"
					}),
					!run.kaggle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-auto text-muted-foreground",
						children: [
							files.length,
							" file",
							files.length === 1 ? "" : "s"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [
					!run.kaggle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "h-7 px-2 text-[11px]",
						onClick: () => setChangesOpen(true),
						children: "View changes"
					}),
					run.taskId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						className: "h-7 px-2 text-[11px]",
						onClick: () => setActivityOpen(true),
						children: ["What it did ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "ml-1 h-3 w-3" })]
					}),
					pending && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "h-7 px-2.5 text-[11px]",
						disabled: approve.isPending || discard.isPending,
						onClick: () => approve.mutate(),
						children: approve.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-1 h-3 w-3" }), " Approve & commit"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						className: "h-7 px-2 text-[11px] text-destructive",
						disabled: approve.isPending || discard.isPending,
						onClick: () => discard.mutate(),
						children: "Discard"
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: changesOpen,
				onOpenChange: setChangesOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "flex h-[85vh] flex-col p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
						className: "border-b border-border/60 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Changes from this run" }), run.reviewBranch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-[10px] text-muted-foreground",
							children: [
								run.reviewBranch,
								" → ",
								run.baseBranch
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 overflow-y-auto p-3",
						children: [
							files.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 border-b border-border/40 py-2 font-mono text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `w-16 shrink-0 uppercase ${f.status === "added" ? "text-emerald-500" : f.status === "deleted" ? "text-destructive" : "text-amber-500"}`,
									children: f.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: f.path
								})]
							}, f.path)),
							diff.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid place-items-center py-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" })
							}),
							diff.data?.patch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-3 whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-[10px] leading-snug",
								children: diff.data.patch
							}),
							!diff.isLoading && !diff.data?.patch && files.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "p-4 text-sm text-muted-foreground",
								children: "No file changes were recorded for this run."
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySheet, {
				open: activityOpen,
				onOpenChange: setActivityOpen,
				events: events.data ?? [],
				phase: "done",
				busy: false
			})
		]
	});
}
function RepoPill({ thread, onChange, onChangeNotebook }) {
	const reposFn = useServerFn(listRepoSelections);
	const notebooksFn = useServerFn(listKaggleNotebooks);
	const [open, setOpen] = (0, import_react.useState)(false);
	const repos = useQuery({
		queryKey: ["repo_selections"],
		queryFn: () => reposFn(),
		enabled: open
	});
	const notebooks = useQuery({
		queryKey: ["kaggle_notebooks"],
		queryFn: () => notebooksFn().catch(() => []),
		enabled: open
	});
	const label = thread.kaggle_notebooks ? `${thread.kaggle_notebooks.owner}/${thread.kaggle_notebooks.slug}` : thread.repo_selections ? `${thread.repo_selections.owner}/${thread.repo_selections.name}` : "no target";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "mx-auto mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground",
				children: [
					thread.kaggle_notebooks ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookPen, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-3 w-3" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-w-[180px] truncate",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3 w-3" })
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[70vh]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "What this chat codes on" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-1 overflow-y-auto",
				children: [
					repos.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-4 w-4 animate-spin" }),
					(repos.data ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground",
						children: "GitHub repos"
					}),
					(repos.data ?? []).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							onChange(r.id);
							setOpen(false);
						},
						className: `flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${r.id === thread.repo_selection_id ? "bg-accent" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono",
							children: [
								r.owner,
								"/",
								r.name
							]
						})
					}, r.id)),
					(notebooks.data ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-3 pb-1 pt-3 text-[10px] uppercase tracking-wide text-muted-foreground",
						children: "Kaggle notebooks"
					}),
					(notebooks.data ?? []).map((nb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onChangeNotebook(nb.id);
							setOpen(false);
						},
						className: `flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${nb.id === thread.kaggle_notebook_id ? "bg-accent" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookPen, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "truncate font-mono",
							children: [
								nb.owner,
								"/",
								nb.slug
							]
						})]
					}, nb.id))
				]
			})]
		})]
	});
}
function ModelPicker({ current, onSelect }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const modelsFn = useServerFn(listOpenrouterModels);
	const settingsFn = useServerFn(getOpenrouterSettings);
	const settings = useQuery({
		queryKey: ["or_settings"],
		queryFn: () => settingsFn(),
		enabled: open
	});
	const hasKey = Boolean(settings.data?.has_key || settings.data?.has_mistral_key || settings.data?.has_groq_key || settings.data?.has_nvidia_key);
	const models = useQuery({
		queryKey: ["or_models"],
		queryFn: () => modelsFn(),
		enabled: open && hasKey
	});
	const needle = q.trim().toLowerCase();
	const filtered = (models.data ?? []).filter((m) => !needle || `${m.id} ${m.name}`.toLowerCase().includes(needle));
	const short = current ? current.split("/").pop() ?? current : "model";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-8 min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-card px-2.5 font-mono text-[11px] text-muted-foreground",
				title: current || "Pick a model",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: short
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "ml-auto h-3 w-3 shrink-0" })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex h-[85vh] flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Choose a model" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-border/60 p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								autoFocus: true,
								value: q,
								onChange: (e) => setQ(e.target.value),
								placeholder: "Search models",
								className: "pl-9"
							}),
							q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setQ(""),
								className: "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto p-1",
					children: [
						!hasKey && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-6 text-center text-sm text-muted-foreground",
							children: "Add an AI provider key on the Account tab to load models."
						}),
						hasKey && models.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid place-items-center py-8",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin" })
						}),
						hasKey && models.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-4 text-sm text-destructive",
							children: models.error.message
						}),
						filtered.map((m) => {
							const active = m.id === current;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									onSelect(m.id);
									setOpen(false);
									toast.success(`Model: ${m.id}`);
								},
								className: `flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-accent ${active ? "bg-accent" : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-sm",
										children: m.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate font-mono text-[10px] text-muted-foreground",
										children: m.id
									})]
								}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-1 h-4 w-4 shrink-0 text-primary" })]
							}, m.id);
						})
					]
				})
			]
		})]
	});
}
function ThreadsSidebarTrigger({ activeId }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const listFn = useServerFn(listThreads);
	const createFn = useServerFn(createThread);
	const delFn = useServerFn(deleteThread);
	const reposFn = useServerFn(listRepoSelections);
	const qc = useQueryClient();
	const navigate = useNavigate();
	const threads = useQuery({
		queryKey: ["threads"],
		queryFn: () => listFn(),
		enabled: open
	});
	const repos = useQuery({
		queryKey: ["repo_selections"],
		queryFn: () => reposFn(),
		enabled: open
	});
	const notebooksFn = useServerFn(listKaggleNotebooks);
	const notebooks = useQuery({
		queryKey: ["kaggle_notebooks"],
		queryFn: () => notebooksFn().catch(() => []),
		enabled: open
	});
	const createMut = useMutation({
		mutationFn: (target) => createFn({ data: target }),
		onSuccess: (t) => {
			qc.invalidateQueries({ queryKey: ["threads"] });
			setOpen(false);
			navigate({
				to: "/chat/$threadId",
				params: { threadId: t.id }
			});
		}
	});
	const delMut = useMutation({
		mutationFn: (id) => delFn({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "h-8 w-8 shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-4 w-4" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "left",
			className: "flex w-[85vw] max-w-sm flex-col p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "border-b border-border/60 p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Chats" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-border/60 p-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						className: "w-full",
						disabled: !repos.data?.length && !notebooks.data?.length || createMut.isPending,
						onClick: () => {
							if (repos.data?.[0]) createMut.mutate({ repoId: repos.data[0].id });
							else if (notebooks.data?.[0]) createMut.mutate({ kaggleNotebookId: notebooks.data[0].id });
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New chat"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto p-1",
					children: [threads.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto mt-4 h-4 w-4 animate-spin" }), (threads.data ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `flex items-center gap-1 rounded-md px-2 py-2 ${t.id === activeId ? "bg-accent" : "hover:bg-accent/60"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex min-w-0 flex-1 items-center gap-2 text-left",
							onClick: () => {
								setOpen(false);
								navigate({
									to: "/chat/$threadId",
									params: { threadId: t.id }
								});
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm",
								children: t.title
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "shrink-0 rounded p-1 text-muted-foreground hover:text-destructive",
							onClick: () => delMut.mutate(t.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
						})]
					}, t.id))]
				})
			]
		})]
	});
}
//#endregion
export { ChatThreadPage as component };
