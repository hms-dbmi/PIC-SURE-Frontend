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
		client: {start:"_app/immutable/entry/start.-cvIL-0Z.js",app:"_app/immutable/entry/app.Bnnsm5zV.js",imports:["_app/immutable/entry/start.-cvIL-0Z.js","_app/immutable/chunks/CsA2x4iF.js","_app/immutable/chunks/DlIBaGjY.js","_app/immutable/chunks/B4GrenNm.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/entry/app.Bnnsm5zV.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/B4GrenNm.js","_app/immutable/chunks/DxSOTiY2.js","_app/immutable/chunks/D7VV4X-8.js","_app/immutable/chunks/CtfeAAbw.js","_app/immutable/chunks/DlIBaGjY.js","_app/immutable/chunks/CSsnQ7i2.js","_app/immutable/chunks/10UUyb-S.js","_app/immutable/chunks/DFQ-BVSw.js","_app/immutable/chunks/DvPjbdiY.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CNt1ewlC.js')),
			__memo(() => import('./chunks/1-FO4wMBHG.js')),
			__memo(() => import('./chunks/2-Bevnpt-_.js')),
			__memo(() => import('./chunks/3-BFz5RzZy.js')),
			__memo(() => import('./chunks/4-B-Ibb6Ad.js')),
			__memo(() => import('./chunks/5-DCt05ahZ.js')),
			__memo(() => import('./chunks/6-CQ348S3P.js')),
			__memo(() => import('./chunks/7-IN-Ofd7f.js')),
			__memo(() => import('./chunks/8-CF3Gk3Hb.js')),
			__memo(() => import('./chunks/9-CIhbXmk4.js')),
			__memo(() => import('./chunks/10-Dl-PeOpP.js')),
			__memo(() => import('./chunks/11-L935O_vH.js')),
			__memo(() => import('./chunks/12-qdHu80Q8.js')),
			__memo(() => import('./chunks/13-D0NIsuAz.js')),
			__memo(() => import('./chunks/14-C4frHe7Q.js')),
			__memo(() => import('./chunks/15-C20rbeci.js')),
			__memo(() => import('./chunks/16-GOyntl49.js')),
			__memo(() => import('./chunks/17-C1pYoCzp.js')),
			__memo(() => import('./chunks/18-CICV5vZi.js')),
			__memo(() => import('./chunks/19-B66SS_mV.js')),
			__memo(() => import('./chunks/20-B8j3FEOS.js')),
			__memo(() => import('./chunks/21-CXzM-_kQ.js')),
			__memo(() => import('./chunks/22-CXnGvh5I.js')),
			__memo(() => import('./chunks/23-Bm0zK5q9.js')),
			__memo(() => import('./chunks/24-L-WFQnho.js')),
			__memo(() => import('./chunks/25-BvM7TDa5.js')),
			__memo(() => import('./chunks/26-DRxbbeSH.js')),
			__memo(() => import('./chunks/27-KcpsMhkO.js')),
			__memo(() => import('./chunks/28-Dut6evJC.js')),
			__memo(() => import('./chunks/29-RQTVWARk.js')),
			__memo(() => import('./chunks/30-erz9NS9v.js')),
			__memo(() => import('./chunks/31-CwjorrMA.js')),
			__memo(() => import('./chunks/32-DuF-04xl.js')),
			__memo(() => import('./chunks/33-ChxTp2FC.js')),
			__memo(() => import('./chunks/34-BTNum45V.js')),
			__memo(() => import('./chunks/35-Bwz2T0J0.js')),
			__memo(() => import('./chunks/36-4ScDivNM.js')),
			__memo(() => import('./chunks/37-DO5iMG_O.js')),
			__memo(() => import('./chunks/38-CGxr65tr.js')),
			__memo(() => import('./chunks/39-CphvuApE.js')),
			__memo(() => import('./chunks/40-BJJ-DPJi.js')),
			__memo(() => import('./chunks/41-B5DSXqjx.js')),
			__memo(() => import('./chunks/42-qvjV9LDM.js'))
		],
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
