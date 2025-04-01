const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["NIH_2013_logo_vertical_text_removed.svg","app-logo.png","bdc-favicon.png","bdc-logo.svg","favicon.ico","favicon.svg","fonts/AbrilFatface.ttf","gic-logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf"},
	_: {
		client: {"start":"_app/immutable/entry/start.oDUXnYAk.js","app":"_app/immutable/entry/app.C9d11FEq.js","imports":["_app/immutable/entry/start.oDUXnYAk.js","_app/immutable/chunks/zOfZnRfh.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/entry/app.C9d11FEq.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/chunks/CUD_i9MT.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-DwZLcVPa.js')),
			__memo(() => import('./chunks/1-BWUYD3c-.js')),
			__memo(() => import('./chunks/2-CgKUAgwV.js')),
			__memo(() => import('./chunks/3-0qVTNyS-.js')),
			__memo(() => import('./chunks/4-Cr89xCbl.js')),
			__memo(() => import('./chunks/5-DXC5MwFs.js')),
			__memo(() => import('./chunks/6-CSUSzvIX.js')),
			__memo(() => import('./chunks/7-DMJWC06G.js')),
			__memo(() => import('./chunks/8-BiAjLFWW.js')),
			__memo(() => import('./chunks/9-ELQYBehB.js')),
			__memo(() => import('./chunks/10-DPgmi9h8.js')),
			__memo(() => import('./chunks/11-C02pSqGr.js')),
			__memo(() => import('./chunks/12-BTINXHBu.js')),
			__memo(() => import('./chunks/13-DTznKvK5.js')),
			__memo(() => import('./chunks/14-CRGD1kfu.js')),
			__memo(() => import('./chunks/15-C34VgtWt.js')),
			__memo(() => import('./chunks/16-CO5GGqi6.js')),
			__memo(() => import('./chunks/17-CESiyVQE.js')),
			__memo(() => import('./chunks/18-cKUSuB52.js')),
			__memo(() => import('./chunks/19-Bh2DdWBk.js')),
			__memo(() => import('./chunks/20-CKzhtkrS.js')),
			__memo(() => import('./chunks/21-YSNJDiGw.js')),
			__memo(() => import('./chunks/22-qteTeatb.js')),
			__memo(() => import('./chunks/23-n-9Jpan4.js')),
			__memo(() => import('./chunks/24-DSrKNNEN.js')),
			__memo(() => import('./chunks/25-C2r9r6rj.js')),
			__memo(() => import('./chunks/26-cCpkUFYH.js')),
			__memo(() => import('./chunks/27-DR2XAKnL.js')),
			__memo(() => import('./chunks/28-Y4aFcyvO.js')),
			__memo(() => import('./chunks/29-DoNJwjZi.js')),
			__memo(() => import('./chunks/30-BtaYcEg_.js')),
			__memo(() => import('./chunks/31-JN-6cV5i.js')),
			__memo(() => import('./chunks/32-B5xPMlcz.js')),
			__memo(() => import('./chunks/33-DqHAkpxw.js')),
			__memo(() => import('./chunks/34-bZSf3P2T.js')),
			__memo(() => import('./chunks/35-Q6T9ND0U.js'))
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
				id: "/(picsure)/(authorized)/(admin)/admin/configuration",
				pattern: /^\/admin\/configuration\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/new",
				pattern: /^\/admin\/configuration\/connection\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/[uuid]/edit",
				pattern: /^\/admin\/configuration\/connection\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/new",
				pattern: /^\/admin\/configuration\/privilege\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/[uuid]/edit",
				pattern: /^\/admin\/configuration\/privilege\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/new",
				pattern: /^\/admin\/configuration\/role\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/[uuid]/edit",
				pattern: /^\/admin\/configuration\/role\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/requests",
				pattern: /^\/admin\/requests\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users",
				pattern: /^\/admin\/users\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/new",
				pattern: /^\/admin\/users\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]",
				pattern: /^\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit",
				pattern: /^\/admin\/users\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze",
				pattern: /^\/analyze\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze/example",
				pattern: /^\/analyze\/example\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset",
				pattern: /^\/dataset\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset/[uuid]",
				pattern: /^\/dataset\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover",
				pattern: /^\/discover\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover/distributions",
				pattern: /^\/discover\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer",
				pattern: /^\/explorer\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/distributions",
				pattern: /^\/explorer\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/export",
				pattern: /^\/explorer\/export\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/genome-filter",
				pattern: /^\/explorer\/genome-filter\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/variant",
				pattern: /^\/explorer\/variant\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/help",
				pattern: /^\/help\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 35 },
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

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
