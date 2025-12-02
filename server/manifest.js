const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["NIH_2013_logo_vertical_text_removed.svg","app-logo.png","bch-logo.svg","bdc-favicon.png","bdc-logo.svg","favicon.ico","favicon.svg","fonts/AbrilFatface.ttf","gic-logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf"},
	_: {
		client: {start:"_app/immutable/entry/start.CXGSijoX.js",app:"_app/immutable/entry/app.u5HHf1vs.js",imports:["_app/immutable/entry/start.CXGSijoX.js","_app/immutable/chunks/BPde4ukL.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/entry/app.u5HHf1vs.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/BG76zvuN.js","_app/immutable/chunks/CpcxNR6b.js","_app/immutable/chunks/C0kNAPzX.js","_app/immutable/chunks/DpjY2ypC.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-Bmj96gVW.js')),
			__memo(() => import('./chunks/1-DtiJbxHo.js')),
			__memo(() => import('./chunks/2-Cptc2BOb.js')),
			__memo(() => import('./chunks/3-CP8nWekx.js')),
			__memo(() => import('./chunks/4-B4Eayr1d.js')),
			__memo(() => import('./chunks/5-6KoH_yd4.js')),
			__memo(() => import('./chunks/6-C6zwj7Wd.js')),
			__memo(() => import('./chunks/7-1nXjB0bM.js')),
			__memo(() => import('./chunks/8-BhFOrYKw.js')),
			__memo(() => import('./chunks/9-B_XwzbhS.js')),
			__memo(() => import('./chunks/10-DK6Dpx5p.js')),
			__memo(() => import('./chunks/11-BWPJ3a1X.js')),
			__memo(() => import('./chunks/12-D9oBj_-3.js')),
			__memo(() => import('./chunks/13-ClTZMXhh.js')),
			__memo(() => import('./chunks/14-UuwGjcye.js')),
			__memo(() => import('./chunks/15-BJ6sEMip.js')),
			__memo(() => import('./chunks/16-vKRhjq-M.js')),
			__memo(() => import('./chunks/17-C8wTRP9d.js')),
			__memo(() => import('./chunks/18-bDVqFp0q.js')),
			__memo(() => import('./chunks/19-DQNMtkT1.js')),
			__memo(() => import('./chunks/20-DgZ1tXat.js')),
			__memo(() => import('./chunks/21-CLddsbRQ.js')),
			__memo(() => import('./chunks/22-CCOtBZKN.js')),
			__memo(() => import('./chunks/23-WRVkmUVE.js')),
			__memo(() => import('./chunks/24-DYm3Uzx_.js')),
			__memo(() => import('./chunks/25-BxnyM7s7.js')),
			__memo(() => import('./chunks/26-LaqMtfRV.js')),
			__memo(() => import('./chunks/27-BIGF2lKi.js')),
			__memo(() => import('./chunks/28-PYvNiJM2.js')),
			__memo(() => import('./chunks/29-lFaBpNO3.js')),
			__memo(() => import('./chunks/30-3myL0NOb.js')),
			__memo(() => import('./chunks/31-d8TUnPDq.js')),
			__memo(() => import('./chunks/32-DajRYjIb.js')),
			__memo(() => import('./chunks/33-oG3BNmEy.js')),
			__memo(() => import('./chunks/34-Do_QuWZ7.js')),
			__memo(() => import('./chunks/35-Czm_-x6q.js')),
			__memo(() => import('./chunks/36-DCnyk-WC.js')),
			__memo(() => import('./chunks/37-DhbvCD_h.js')),
			__memo(() => import('./chunks/38-DX1V2xtn.js')),
			__memo(() => import('./chunks/39-ySThk3_X.js')),
			__memo(() => import('./chunks/40-BsG-WawH.js')),
			__memo(() => import('./chunks/41-xHvaWv7H.js')),
			__memo(() => import('./chunks/42-DirqjA6-.js'))
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
