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
		client: {start:"_app/immutable/entry/start.BSQ56ugL.js",app:"_app/immutable/entry/app.DnmK6A73.js",imports:["_app/immutable/entry/start.BSQ56ugL.js","_app/immutable/chunks/BLfKYx2_.js","_app/immutable/chunks/B9BhT3Ut.js","_app/immutable/chunks/pV5yBOfK.js","_app/immutable/chunks/D3FUfhzK.js","_app/immutable/chunks/CPDBQclr.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/entry/app.DnmK6A73.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/pV5yBOfK.js","_app/immutable/chunks/D3FUfhzK.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/B9BhT3Ut.js","_app/immutable/chunks/CPDBQclr.js","_app/immutable/chunks/BAa5cEXk.js","_app/immutable/chunks/D2EutmVf.js","_app/immutable/chunks/D25vQSLz.js","_app/immutable/chunks/C2caA9Pm.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-lpMeyZA2.js')),
			__memo(() => import('./chunks/1-C_Ej6qRM.js')),
			__memo(() => import('./chunks/2-ByzntVPA.js')),
			__memo(() => import('./chunks/3-Be4LFZDq.js')),
			__memo(() => import('./chunks/4-DJ52TRh6.js')),
			__memo(() => import('./chunks/5-B0dFwnE6.js')),
			__memo(() => import('./chunks/6-P4GGF1xN.js')),
			__memo(() => import('./chunks/7-DFsnkVFQ.js')),
			__memo(() => import('./chunks/8-C8vxjE7M.js')),
			__memo(() => import('./chunks/9-DPzmYjOC.js')),
			__memo(() => import('./chunks/10-C6sbfQ5p.js')),
			__memo(() => import('./chunks/11-DwO4rwTC.js')),
			__memo(() => import('./chunks/12-BX0jgmvZ.js')),
			__memo(() => import('./chunks/13-BPsBE3QD.js')),
			__memo(() => import('./chunks/14-D8ob0OZq.js')),
			__memo(() => import('./chunks/15-DfyJGa64.js')),
			__memo(() => import('./chunks/16-SCktrPAx.js')),
			__memo(() => import('./chunks/17-CgA2mmHl.js')),
			__memo(() => import('./chunks/18-BEiDOalB.js')),
			__memo(() => import('./chunks/19-C2W1LyS0.js')),
			__memo(() => import('./chunks/20-CKXBSCSs.js')),
			__memo(() => import('./chunks/21-C9T44Jts.js')),
			__memo(() => import('./chunks/22-DSaIg8Sm.js')),
			__memo(() => import('./chunks/23-DI4u9jE8.js')),
			__memo(() => import('./chunks/24-DVvLs91m.js')),
			__memo(() => import('./chunks/25-lFWwkvTi.js')),
			__memo(() => import('./chunks/26-uHUxV6Vp.js')),
			__memo(() => import('./chunks/27-Dhz2_QyO.js')),
			__memo(() => import('./chunks/28-D9y2g96b.js')),
			__memo(() => import('./chunks/29-6IJ_NAT6.js')),
			__memo(() => import('./chunks/30-DgYkQnhw.js')),
			__memo(() => import('./chunks/31-CpMSdNdV.js')),
			__memo(() => import('./chunks/32-C-G9NUTb.js')),
			__memo(() => import('./chunks/33-C2LF90Vg.js')),
			__memo(() => import('./chunks/34-DkMVPTcL.js')),
			__memo(() => import('./chunks/35-B7nZ1w9H.js')),
			__memo(() => import('./chunks/36-DV2mnAFr.js')),
			__memo(() => import('./chunks/37-CVMfkuIu.js')),
			__memo(() => import('./chunks/38-D7NBTeQV.js')),
			__memo(() => import('./chunks/39-CZLloQP8.js')),
			__memo(() => import('./chunks/40-BoE_Hcqx.js')),
			__memo(() => import('./chunks/41-B0COIZNi.js')),
			__memo(() => import('./chunks/42-D79xhR58.js'))
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
