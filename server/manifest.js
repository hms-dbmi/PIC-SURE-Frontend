const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store","NIH_2013_logo_vertical_text_removed.svg","app-logo.png","bdc-favicon.png","bdc-logo.svg","favicon.ico","favicon.svg","fonts/AbrilFatface.ttf","gic-logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf"},
	_: {
		client: {"start":"_app/immutable/entry/start.B8ix8eZX.js","app":"_app/immutable/entry/app.C_yP5PwL.js","imports":["_app/immutable/entry/start.B8ix8eZX.js","_app/immutable/chunks/entry.Bvh0VnfG.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/entry/app.C_yP5PwL.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/index.CNwEczq-.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-t5ljbtA3.js')),
			__memo(() => import('./chunks/1-CQ-ur5zo.js')),
			__memo(() => import('./chunks/2-DQHIToQu.js')),
			__memo(() => import('./chunks/3-Cei0kfMx.js')),
			__memo(() => import('./chunks/4-DCV-OwrL.js')),
			__memo(() => import('./chunks/5-CNBHno52.js')),
			__memo(() => import('./chunks/6-CFxq6sFV.js')),
			__memo(() => import('./chunks/7-URqVzmFc.js')),
			__memo(() => import('./chunks/8-Cy5HcAx9.js')),
			__memo(() => import('./chunks/9-BKTPHpHH.js')),
			__memo(() => import('./chunks/10-DKC6BIyE.js')),
			__memo(() => import('./chunks/11-DjdcyLR4.js')),
			__memo(() => import('./chunks/12-AQBN-R-d.js')),
			__memo(() => import('./chunks/13-Cq7aJSpL.js')),
			__memo(() => import('./chunks/14-D_qWzOBG.js')),
			__memo(() => import('./chunks/15-ZK5nXRLy.js')),
			__memo(() => import('./chunks/16-DZHO9wx_.js')),
			__memo(() => import('./chunks/17-6wBR-Auq.js')),
			__memo(() => import('./chunks/18-BxrF0BzW.js')),
			__memo(() => import('./chunks/19-BkCFxKdL.js')),
			__memo(() => import('./chunks/20-Bl0hQ_h7.js')),
			__memo(() => import('./chunks/21-D_anHRyM.js')),
			__memo(() => import('./chunks/22-Zhr6eQ59.js')),
			__memo(() => import('./chunks/23-C0hGLf9P.js')),
			__memo(() => import('./chunks/24-BB3ZQUOo.js')),
			__memo(() => import('./chunks/25-BLSiSgJA.js')),
			__memo(() => import('./chunks/26-BvryguC1.js')),
			__memo(() => import('./chunks/27-CeDjmNBZ.js')),
			__memo(() => import('./chunks/28-DdG2Z5Q2.js')),
			__memo(() => import('./chunks/29-CD37Gmoc.js')),
			__memo(() => import('./chunks/30-CZWJpUrZ.js')),
			__memo(() => import('./chunks/31-CejunU_X.js')),
			__memo(() => import('./chunks/32-DZkEloyY.js')),
			__memo(() => import('./chunks/33-D4K0uYXF.js')),
			__memo(() => import('./chunks/34-Cucp_VEl.js')),
			__memo(() => import('./chunks/35-CU8et-YE.js')),
			__memo(() => import('./chunks/36-CssBrElC.js'))
		],
		routes: [
			{
				id: "/(picsure)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authentication",
				pattern: /^\/admin\/authentication\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization",
				pattern: /^\/admin\/authorization\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/privilege/new",
				pattern: /^\/admin\/authorization\/privilege\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/privilege/[uuid]",
				pattern: /^\/admin\/authorization\/privilege\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/privilege/[uuid]/edit",
				pattern: /^\/admin\/authorization\/privilege\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/role/new",
				pattern: /^\/admin\/authorization\/role\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/role/[uuid]",
				pattern: /^\/admin\/authorization\/role\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/authorization/role/[uuid]/edit",
				pattern: /^\/admin\/authorization\/role\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/requests",
				pattern: /^\/admin\/requests\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users",
				pattern: /^\/admin\/users\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/new",
				pattern: /^\/admin\/users\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]",
				pattern: /^\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit",
				pattern: /^\/admin\/users\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze",
				pattern: /^\/analyze\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze/example",
				pattern: /^\/analyze\/example\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset",
				pattern: /^\/dataset\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset/[uuid]",
				pattern: /^\/dataset\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover",
				pattern: /^\/discover\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover/distributions",
				pattern: /^\/discover\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer",
				pattern: /^\/explorer\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/distributions",
				pattern: /^\/explorer\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/export",
				pattern: /^\/explorer\/export\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/genome-filter",
				pattern: /^\/explorer\/genome-filter\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/variant",
				pattern: /^\/explorer\/variant\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/help",
				pattern: /^\/help\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/(authentication)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/error",
				pattern: /^\/login\/error\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,3,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/loading",
				pattern: /^\/login\/loading\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,4,], leaf: 9 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

export { manifest, prerendered };
//# sourceMappingURL=manifest.js.map
