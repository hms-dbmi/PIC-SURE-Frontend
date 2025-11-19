const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store","NIH_2013_logo_vertical_text_removed.svg","app-logo.png","bch-logo.svg","bdc-favicon.png","bdc-logo.svg","favicon.ico","favicon.svg","fonts/AbrilFatface.ttf","gic-logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf"},
	_: {
		client: {start:"_app/immutable/entry/start.DqNvbpFJ.js",app:"_app/immutable/entry/app.DsJMEmB8.js",imports:["_app/immutable/entry/start.DqNvbpFJ.js","_app/immutable/chunks/Dkbkn6HV.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/entry/app.DsJMEmB8.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/BG76zvuN.js","_app/immutable/chunks/CpcxNR6b.js","_app/immutable/chunks/C0kNAPzX.js","_app/immutable/chunks/DpjY2ypC.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BJtrkFHf.js')),
			__memo(() => import('./chunks/1-B-LtH9ST.js')),
			__memo(() => import('./chunks/2-D42CnLGu.js')),
			__memo(() => import('./chunks/3-CA27IBgk.js')),
			__memo(() => import('./chunks/4-DQgENxTZ.js')),
			__memo(() => import('./chunks/5-CDO8gmkV.js')),
			__memo(() => import('./chunks/6-DDdCI_SE.js')),
			__memo(() => import('./chunks/7-WysQIo0Q.js')),
			__memo(() => import('./chunks/8-Ca1H3t0q.js')),
			__memo(() => import('./chunks/9-C_QYPREp.js')),
			__memo(() => import('./chunks/10-DOafnjLJ.js')),
			__memo(() => import('./chunks/11-JLzqHyDo.js')),
			__memo(() => import('./chunks/12-D6SrgwRb.js')),
			__memo(() => import('./chunks/13-CEgobU-g.js')),
			__memo(() => import('./chunks/14-Dpjw_uLU.js')),
			__memo(() => import('./chunks/15--XlOJsvN.js')),
			__memo(() => import('./chunks/16-C4Y_LrEl.js')),
			__memo(() => import('./chunks/17-dGYPPMG4.js')),
			__memo(() => import('./chunks/18-CPW8TRBi.js')),
			__memo(() => import('./chunks/19-BabYt3eZ.js')),
			__memo(() => import('./chunks/20-Crlb4HCS.js')),
			__memo(() => import('./chunks/21-XtUlJiKO.js')),
			__memo(() => import('./chunks/22-aXTjwDdB.js')),
			__memo(() => import('./chunks/23-BVa9gRTf.js')),
			__memo(() => import('./chunks/24-BD6IKlvM.js')),
			__memo(() => import('./chunks/25-DMOkLhSf.js')),
			__memo(() => import('./chunks/26-DOW24yT1.js')),
			__memo(() => import('./chunks/27-B17BeRo0.js')),
			__memo(() => import('./chunks/28-D6es3nM_.js')),
			__memo(() => import('./chunks/29-DovMqUwU.js')),
			__memo(() => import('./chunks/30-1mqoY4v5.js')),
			__memo(() => import('./chunks/31-CD97tSxz.js')),
			__memo(() => import('./chunks/32-B21NyHY5.js')),
			__memo(() => import('./chunks/33-CkbL1Sb_.js')),
			__memo(() => import('./chunks/34-BMu1Wahd.js')),
			__memo(() => import('./chunks/35-Umyb1zXI.js')),
			__memo(() => import('./chunks/36-6B1jKA5n.js')),
			__memo(() => import('./chunks/37-CwJeQ9pD.js')),
			__memo(() => import('./chunks/38-BJ8F5WLK.js')),
			__memo(() => import('./chunks/39-Cbju_27O.js')),
			__memo(() => import('./chunks/40-33lZoH_X.js')),
			__memo(() => import('./chunks/41-CK3OVaSD.js')),
			__memo(() => import('./chunks/42-C5lsJzQ8.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/(picsure)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration",
				pattern: /^\/admin\/configuration\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/new",
				pattern: /^\/admin\/configuration\/connection\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/[uuid]/edit",
				pattern: /^\/admin\/configuration\/connection\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/new",
				pattern: /^\/admin\/configuration\/privilege\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/[uuid]/edit",
				pattern: /^\/admin\/configuration\/privilege\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/new",
				pattern: /^\/admin\/configuration\/role\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/[uuid]/edit",
				pattern: /^\/admin\/configuration\/role\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/terms/edit",
				pattern: /^\/admin\/configuration\/terms\/edit\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/manual-role",
				pattern: /^\/admin\/manual-role\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users",
				pattern: /^\/admin\/users\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/new",
				pattern: /^\/admin\/users\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]",
				pattern: /^\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit",
				pattern: /^\/admin\/users\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze/analysis",
				pattern: /^\/analyze\/analysis\/?$/,
				params: [],
				page: { layouts: [0,5,6,8,], errors: [1,,,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze/api",
				pattern: /^\/analyze\/api\/?$/,
				params: [],
				page: { layouts: [0,5,6,8,], errors: [1,,,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/analyze/api/example",
				pattern: /^\/analyze\/api\/example\/?$/,
				params: [],
				page: { layouts: [0,5,6,8,], errors: [1,,,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/collaborate",
				pattern: /^\/collaborate\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset",
				pattern: /^\/dataset\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset/request",
				pattern: /^\/dataset\/request\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/dataset/[uuid]",
				pattern: /^\/dataset\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover",
				pattern: /^\/discover\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/discover/distributions",
				pattern: /^\/discover\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer",
				pattern: /^\/explorer\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/cohort",
				pattern: /^\/explorer\/cohort\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/distributions",
				pattern: /^\/explorer\/distributions\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/export",
				pattern: /^\/explorer\/export\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/genome-filter",
				pattern: /^\/explorer\/genome-filter\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/explorer/variant",
				pattern: /^\/explorer\/variant\/?$/,
				params: [],
				page: { layouts: [0,5,6,], errors: [1,,,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/(picsure)/(public)/help",
				pattern: /^\/help\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/(authentication)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/error",
				pattern: /^\/login\/error\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,3,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/loading",
				pattern: /^\/login\/loading\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,4,], leaf: 11 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
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
