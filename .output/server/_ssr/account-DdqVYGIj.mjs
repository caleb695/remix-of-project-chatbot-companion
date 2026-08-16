import { i as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/@ai-sdk/react+[...].mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as startGithubOAuth, a as disconnectGithub, c as getKaggleStatus, d as listRepoSelections, f as listUserRepos, g as saveKaggleCreds, h as removeRepoSelection, l as listKaggleKernels, m as removeKaggleNotebook, n as addRepoSelection, o as getGithubConnection, p as pushKaggleNotebook, t as addKaggleNotebook, u as listKaggleNotebooks, v as syncKaggleNotebook, y as useServerFn } from "./kaggle.functions-B_7yxI00.mjs";
import { t as supabase } from "./client--F9kIJS3.mjs";
import { a as enqueueIndexJob, c as getLatestIndexJob, l as getOpenrouterSettings, p as saveOpenrouterSettings, u as installCoderWorkflow } from "./openrouter.functions-CfkWNtMF.mjs";
import { t as Input } from "./input-DicJzR9-.mjs";
import { t as Label } from "./label-B4PTMSG2.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as ExternalLink, F as Check, M as ChevronUp, P as ChevronDown, S as Github, _ as LogOut, a as Trash2, c as Search, f as NotebookPen, j as CloudUpload, l as RefreshCw, t as Zap, u as Plus, v as LoaderCircle, y as KeyRound } from "../_libs/lucide-react.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-DdqVYGIj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
function AccountPage() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	async function signOut() {
		await qc.cancelQueries();
		qc.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full max-w-md flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-base font-semibold",
				children: "Account"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: signOut,
				title: "Sign out",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 overflow-y-auto px-4 py-4 space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
					fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GithubSection, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenRouterSection, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KaggleSection, {})
			]
		})]
	});
}
function KaggleSection() {
	const qc = useQueryClient();
	const statusFn = useServerFn(getKaggleStatus);
	const saveFn = useServerFn(saveKaggleCreds);
	const kernelsFn = useServerFn(listKaggleKernels);
	const listFn = useServerFn(listKaggleNotebooks);
	const addFn = useServerFn(addKaggleNotebook);
	const removeFn = useServerFn(removeKaggleNotebook);
	const syncFn = useServerFn(syncKaggleNotebook);
	const pushFn = useServerFn(pushKaggleNotebook);
	const [username, setUsername] = (0, import_react.useState)("");
	const [key, setKey] = (0, import_react.useState)("");
	const [picking, setPicking] = (0, import_react.useState)(false);
	const status = useQuery({
		queryKey: ["kaggle_status"],
		queryFn: () => statusFn()
	});
	const notebooks = useQuery({
		queryKey: ["kaggle_notebooks"],
		queryFn: () => listFn(),
		enabled: Boolean(status.data?.connected)
	});
	const kernels = useQuery({
		queryKey: ["kaggle_kernels"],
		queryFn: () => kernelsFn(),
		enabled: picking
	});
	const saveMut = useMutation({
		mutationFn: () => saveFn({ data: {
			username,
			key
		} }),
		onSuccess: () => {
			setKey("");
			qc.invalidateQueries({ queryKey: ["kaggle_status"] });
			qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
			toast.success("Kaggle connected");
		},
		onError: (e) => toast.error(e.message)
	});
	const addMut = useMutation({
		mutationFn: (ref) => addFn({ data: { ref } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
			toast.success("Notebook added");
		},
		onError: (e) => toast.error(e.message)
	});
	const removeMut = useMutation({
		mutationFn: (id) => removeFn({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] })
	});
	const syncMut = useMutation({
		mutationFn: (id) => syncFn({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
			toast.success("Notebook synced");
		},
		onError: (e) => toast.error(e.message)
	});
	const pushMut = useMutation({
		mutationFn: (id) => pushFn({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
			toast.success("Pushed a new version to Kaggle");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookPen, { className: "h-3 w-3" }), " Kaggle notebooks"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "space-y-4 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "kg-user",
						className: "text-xs",
						children: "Kaggle username"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "kg-user",
						value: username || status.data?.username || "",
						onChange: (e) => setUsername(e.target.value),
						placeholder: "your-kaggle-username"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "kg-key",
						className: "text-xs",
						children: "Kaggle API key"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "kg-key",
						type: "password",
						value: key,
						onChange: (e) => setKey(e.target.value),
						placeholder: status.data?.connected ? "saved" : "from kaggle.json"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "underline",
								href: "https://www.kaggle.com/settings",
								target: "_blank",
								rel: "noreferrer",
								children: "Create a token"
							}),
							" ",
							"on Kaggle → Settings → API, then copy the username and key from ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "kaggle.json" }),
							".",
							status.data?.connected && " · connected"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "w-full",
						disabled: saveMut.isPending || !(username || status.data?.username) || key.length < 10,
						onClick: () => saveMut.mutate(),
						children: saveMut.isPending ? "Checking…" : status.data?.connected ? "Update credentials" : "Connect Kaggle"
					})
				]
			}), status.data?.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 border-t border-border pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Your notebooks"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setPicking((p) => !p),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Add"]
						})]
					}),
					picking && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-1",
						children: [
							kernels.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid place-items-center py-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" })
							}),
							kernels.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "p-2 text-xs text-destructive",
								children: kernels.error.message
							}),
							(kernels.data ?? []).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: addMut.isPending,
								onClick: () => addMut.mutate(k.ref),
								className: "w-full rounded p-2 text-left hover:bg-accent disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm",
									children: k.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate font-mono text-[11px] text-muted-foreground",
									children: k.ref
								})]
							}, k.ref)),
							kernels.data?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "p-2 text-xs text-muted-foreground",
								children: "No notebooks found."
							})
						]
					}),
					(notebooks.data ?? []).length === 0 && !picking && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground",
						children: "Add a notebook to code on it from the Chat tab."
					}),
					(notebooks.data ?? []).map((nb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 rounded-md border border-border p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm",
									children: nb.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "truncate font-mono text-[11px] text-muted-foreground",
									children: [
										nb.owner,
										"/",
										nb.slug
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "ghost",
									size: "sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: `https://www.kaggle.com/code/${nb.owner}/${nb.slug}`,
										target: "_blank",
										rel: "noreferrer",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => removeMut.mutate(nb.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								className: "flex-1",
								disabled: syncMut.isPending,
								onClick: () => syncMut.mutate(nb.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }), " Sync"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: nb.status === "modified" ? "default" : "outline",
								className: "flex-1",
								disabled: pushMut.isPending || nb.status !== "modified",
								onClick: () => pushMut.mutate(nb.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "mr-1.5 h-3.5 w-3.5" }), nb.status === "modified" ? "Push changes" : "No changes"]
							})]
						})]
					}, nb.id))
				]
			})]
		})]
	});
}
function GithubSection() {
	const qc = useQueryClient();
	const getConn = useServerFn(getGithubConnection);
	const listSels = useServerFn(listRepoSelections);
	const startOAuth = useServerFn(startGithubOAuth);
	const disconnect = useServerFn(disconnectGithub);
	const removeSel = useServerFn(removeRepoSelection);
	const conn = useQuery({
		queryKey: ["gh_conn"],
		queryFn: () => getConn(),
		retry: 1
	});
	const sels = useQuery({
		queryKey: ["repo_selections"],
		queryFn: () => listSels(),
		retry: 1
	});
	const connectMut = useMutation({
		mutationFn: async () => (await startOAuth()).url,
		onSuccess: (url) => {
			window.location.href = url;
		},
		onError: (e) => toast.error(e.message)
	});
	const disconnectMut = useMutation({
		mutationFn: () => disconnect(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["gh_conn"] });
			qc.invalidateQueries({ queryKey: ["repo_selections"] });
			toast.success("GitHub disconnected");
		}
	});
	const removeMut = useMutation({
		mutationFn: (id) => removeSel({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["repo_selections"] })
	});
	const installFn = useServerFn(installCoderWorkflow);
	const installMut = useMutation({
		mutationFn: (id) => installFn({ data: { repoId: id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["repo_selections"] });
			toast.success("Coder workflow installed / updated");
		},
		onError: (e) => toast.error(e.message)
	});
	const hasWorkflowScope = new Set((conn.data?.scope ?? "").split(/[ ,]+/).filter(Boolean)).has("workflow");
	if (conn.isLoading || sels.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid place-items-center py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
	});
	if (conn.error || sels.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-4 text-center text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-destructive",
			children: (conn.error ?? sels.error).message
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "mt-3 w-full",
			size: "sm",
			variant: "outline",
			onClick: () => {
				conn.refetch();
				sels.refetch();
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }), " Retry"]
		})]
	});
	if (!conn.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "mx-auto h-8 w-8 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-medium",
				children: "Connect GitHub"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "The AI needs access to read and edit your repos."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "mt-4 w-full",
				onClick: () => connectMut.mutate(),
				disabled: connectMut.isPending,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "mr-2 h-4 w-4" }), connectMut.isPending ? "Redirecting…" : "Connect GitHub"]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-lg border border-border bg-card p-3",
				children: [
					conn.data.avatar_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: conn.data.avatar_url,
						alt: "",
						className: "h-10 w-10 rounded-full"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "truncate font-mono text-sm",
							children: ["@", conn.data.github_login]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "Connected"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => disconnectMut.mutate(),
						children: "Disconnect"
					})
				]
			}),
			!hasWorkflowScope && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-destructive/40 p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Reconnect GitHub once to grant permission to install workflow files."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-2 w-full",
					size: "sm",
					variant: "outline",
					onClick: () => connectMut.mutate(),
					disabled: connectMut.isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "mr-2 h-4 w-4" }), " Reconnect GitHub"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
					children: "Your repos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddRepoButton, {})]
			}),
			(sels.data ?? []).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-dashed p-4 text-center text-xs text-muted-foreground",
				children: "Add a repo to chat with the AI about it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: (sels.data ?? []).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-3 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "truncate font-mono text-sm",
								children: [
									r.owner,
									"/",
									r.name
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-0.5 text-xs text-muted-foreground",
								children: ["branch: ", r.working_branch]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "ghost",
								size: "sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `https://github.com/${r.owner}/${r.name}`,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => removeMut.mutate(r.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
							})]
						})]
					}), r.workflow_installed_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 text-[11px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-primary" }),
							" Coder workflow installed",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-auto text-[11px] text-primary underline disabled:opacity-50",
								disabled: installMut.isPending || !hasWorkflowScope,
								onClick: () => installMut.mutate(r.id),
								children: installMut.isPending ? "Updating…" : "Update runner"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndexRepoRow, { repoId: r.id })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						className: "w-full",
						disabled: installMut.isPending || !hasWorkflowScope,
						onClick: () => installMut.mutate(r.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "mr-1.5 h-3.5 w-3.5" }), installMut.isPending ? "Installing…" : "Install coder workflow"]
					})]
				}, r.id))
			})
		]
	});
}
function IndexRepoRow({ repoId }) {
	const qc = useQueryClient();
	const enqueueFn = useServerFn(enqueueIndexJob);
	const getLatestFn = useServerFn(getLatestIndexJob);
	const settingsFn = useServerFn(getOpenrouterSettings);
	const settings = useQuery({
		queryKey: ["or_settings"],
		queryFn: () => settingsFn()
	});
	const model = settings.data?.model ?? "openai/gpt-5.6-sol";
	const job = useQuery({
		queryKey: ["index_job", repoId],
		queryFn: () => getLatestFn({ data: { repoId } }),
		refetchInterval: (q) => {
			const s = q.state.data?.status;
			return s === "queued" || s === "running" ? 2500 : false;
		}
	});
	const runMut = useMutation({
		mutationFn: () => enqueueFn({ data: {
			repoId,
			model
		} }),
		onSuccess: () => {
			toast.success("Indexing started on GitHub Actions");
			qc.invalidateQueries({ queryKey: ["index_job", repoId] });
		},
		onError: (e) => toast.error(e.message)
	});
	const j = job.data;
	const running = j?.status === "queued" || j?.status === "running";
	const cur = j?.progress_current ?? 0;
	const tot = j?.progress_total ?? 0;
	const pct = tot > 0 ? Math.min(100, Math.round(cur / tot * 100)) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "outline",
				className: "w-full",
				disabled: running || runMut.isPending || !settings.data || !(settings.data.embedding_provider === "mistral" ? settings.data.has_mistral_key : settings.data.embedding_provider === "nvidia" ? settings.data.has_nvidia_key : settings.data.has_key),
				onClick: () => runMut.mutate(),
				title: "Index with your selected embedding provider",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-1.5 h-3.5 w-3.5" }), running ? `Indexing ${cur}/${tot || "?"}…` : j?.status === "completed" ? "Re-index repo" : "Index repo"]
			}),
			running && tot > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-1 w-full overflow-hidden rounded bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-primary transition-all",
					style: { width: `${pct}%` }
				})
			}),
			j?.status === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-destructive",
				children: j.error
			})
		]
	});
}
function AddRepoButton() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const qc = useQueryClient();
	const listAll = useServerFn(listUserRepos);
	const add = useServerFn(addRepoSelection);
	const repos = useQuery({
		queryKey: ["gh_all_repos"],
		queryFn: () => listAll(),
		enabled: open
	});
	const cachedSels = qc.getQueryData(["repo_selections"]);
	const selectedIds = new Set((cachedSels ?? []).map((r) => r.github_repo_id));
	const addMut = useMutation({
		mutationFn: (r) => add({ data: r }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["repo_selections"] });
			toast.success("Added");
		},
		onError: (e) => toast.error(e.message)
	});
	const filtered = (repos.data ?? []).filter((r) => r.full_name.toLowerCase().includes(q.toLowerCase()));
	if (!open) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		size: "sm",
		variant: "outline",
		onClick: () => setOpen(true),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Add"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-background",
		style: { paddingBottom: "env(safe-area-inset-bottom)" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 border-b border-border/60 p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					autoFocus: true,
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search your repos…",
					className: "pl-9"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: () => setOpen(false),
				children: "Done"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 overflow-y-auto p-2",
			children: [
				repos.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid place-items-center py-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin" })
				}),
				repos.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-4 text-sm text-destructive",
					children: repos.error.message
				}),
				filtered.map((r) => {
					const already = selectedIds.has(r.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: already || addMut.isPending,
						onClick: () => addMut.mutate({
							github_repo_id: r.id,
							owner: r.owner,
							name: r.name,
							default_branch: r.default_branch
						}),
						className: "flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-accent disabled:opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-mono text-sm",
								children: r.full_name
							}), r.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-0.5 truncate text-xs text-muted-foreground",
								children: r.description
							})]
						}), already && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" })]
					}, r.id);
				})
			]
		})]
	});
}
function OpenRouterSection() {
	const qc = useQueryClient();
	const getFn = useServerFn(getOpenrouterSettings);
	const saveFn = useServerFn(saveOpenrouterSettings);
	const settings = useQuery({
		queryKey: ["or_settings"],
		queryFn: () => getFn()
	});
	const [apiKey, setApiKey] = (0, import_react.useState)("");
	const [mistralKey, setMistralKey] = (0, import_react.useState)("");
	const [groqKey, setGroqKey] = (0, import_react.useState)("");
	const [nvidiaKey, setNvidiaKey] = (0, import_react.useState)("");
	const [embeddingProvider, setEmbeddingProvider] = (0, import_react.useState)("mistral");
	const [embeddingModel, setEmbeddingModel] = (0, import_react.useState)("mistral-embed");
	(0, import_react.useEffect)(() => {
		if (!settings.data) return;
		setEmbeddingProvider(settings.data.embedding_provider);
		setEmbeddingModel(settings.data.embedding_model);
	}, [settings.data]);
	const currentEmbeddingProvider = embeddingProvider;
	const currentEmbeddingModel = embeddingModel;
	const saveMut = useMutation({
		mutationFn: () => saveFn({ data: {
			apiKey: apiKey || void 0,
			mistralApiKey: mistralKey || void 0,
			groqApiKey: groqKey || void 0,
			nvidiaApiKey: nvidiaKey || void 0,
			embeddingProvider: currentEmbeddingProvider,
			embeddingModel: currentEmbeddingModel,
			model: settings.data?.model ?? "anthropic/claude-3.5-sonnet"
		} }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["or_settings"] });
			qc.invalidateQueries({ queryKey: ["or_models"] });
			toast.success("Key saved");
			setApiKey("");
			setMistralKey("");
			setGroqKey("");
			setNvidiaKey("");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
			children: "API keys"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "p-4 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "or-key",
							className: "flex items-center gap-1.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-3 w-3" }), " OpenRouter (chat & coding)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "or-key",
							type: "password",
							value: apiKey,
							onChange: (e) => setApiKey(e.target.value),
							placeholder: settings.data?.key_preview ?? "sk-or-…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "underline",
								href: "https://openrouter.ai/keys",
								target: "_blank",
								rel: "noreferrer",
								children: "Get a key"
							}), settings.data?.has_key && " · saved"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "mi-key",
							className: "flex items-center gap-1.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-3 w-3" }), " Mistral (chat, coding & embeddings)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "mi-key",
							type: "password",
							value: mistralKey,
							onChange: (e) => setMistralKey(e.target.value),
							placeholder: settings.data?.mistral_key_preview ?? "…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "underline",
								href: "https://console.mistral.ai/api-keys",
								target: "_blank",
								rel: "noreferrer",
								children: "Get a key"
							}), settings.data?.has_mistral_key && " · saved"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "groq-key",
							className: "flex items-center gap-1.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-3 w-3" }), " Groq Cloud (chat & coding)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "groq-key",
							type: "password",
							value: groqKey,
							onChange: (e) => setGroqKey(e.target.value),
							placeholder: settings.data?.groq_key_preview ?? "gsk_…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "underline",
								href: "https://console.groq.com/keys",
								target: "_blank",
								rel: "noreferrer",
								children: "Get a key"
							}), settings.data?.has_groq_key && " · saved"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "nvidia-key",
							className: "flex items-center gap-1.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-3 w-3" }), " NVIDIA NIM (chat, coding & embeddings)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "nvidia-key",
							type: "password",
							value: nvidiaKey,
							onChange: (e) => setNvidiaKey(e.target.value),
							placeholder: settings.data?.nvidia_key_preview ?? "nvapi-…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "underline",
								href: "https://build.nvidia.com/settings/api-keys",
								target: "_blank",
								rel: "noreferrer",
								children: "Get a key"
							}), settings.data?.has_nvidia_key && " · saved"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 border-t border-border pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Repository embeddings"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: currentEmbeddingProvider,
							onValueChange: (value) => {
								const provider = value;
								setEmbeddingProvider(provider);
								setEmbeddingModel(provider === "mistral" ? "mistral-embed" : provider === "nvidia" ? "nvidia/nv-embedqa-e5-v5" : "mistralai/mistral-embed");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "mistral",
									children: "Mistral"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "openrouter",
									children: "OpenRouter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "nvidia",
									children: "NVIDIA NIM"
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: currentEmbeddingModel,
							onChange: (e) => setEmbeddingModel(e.target.value),
							placeholder: "Embedding model ID"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: "Use a 1024-dimension embedding model to match the repository index."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: !apiKey && !mistralKey && !groqKey && !nvidiaKey && currentEmbeddingProvider === settings.data?.embedding_provider && currentEmbeddingModel === settings.data?.embedding_model || saveMut.isPending,
						onClick: () => saveMut.mutate(),
						children: saveMut.isPending ? "Saving…" : "Save"
					})
				})
			]
		})]
	});
}
//#endregion
export { AccountPage as component };
