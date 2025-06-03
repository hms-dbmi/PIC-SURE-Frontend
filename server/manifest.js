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
		client: {"start":"_app/immutable/entry/start.DCtU9w2W.js","app":"_app/immutable/entry/app.DP3WtI9q.js","imports":["_app/immutable/entry/start.DCtU9w2W.js","_app/immutable/chunks/BMKj-mzl.js","_app/immutable/chunks/CDvIr29H.js","_app/immutable/entry/app.DP3WtI9q.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CDvIr29H.js","_app/immutable/chunks/ByE-_V18.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-VQmLFlqP.js')),
			__memo(() => import('./chunks/1-BWuEy2Oz.js')),
			__memo(() => import('./chunks/2-CTmLT401.js')),
			__memo(() => import('./chunks/3-BZ0P7Krv.js')),
			__memo(() => import('./chunks/4-LXKq0rwi.js')),
			__memo(() => import('./chunks/5-BCflFTGf.js')),
			__memo(() => import('./chunks/6-B6VzWnQZ.js')),
			__memo(() => import('./chunks/7-E2gaH2Qn.js')),
			__memo(() => import('./chunks/8-BcPCaIeA.js')),
			__memo(() => import('./chunks/9-DprifqkA.js')),
			__memo(() => import('./chunks/10-DRW7IAfw.js')),
			__memo(() => import('./chunks/11-CJmZtrHq.js')),
			__memo(() => import('./chunks/12-d-iMxz6c.js')),
			__memo(() => import('./chunks/13-Br0y0oJf.js')),
			__memo(() => import('./chunks/14-dsaVrOPj.js')),
			__memo(() => import('./chunks/15-CM69YIPg.js')),
			__memo(() => import('./chunks/16-CNcrglT4.js')),
			__memo(() => import('./chunks/17-AqUJCU1G.js')),
			__memo(() => import('./chunks/18-C8VY-DH1.js')),
			__memo(() => import('./chunks/19-BB6ajQcX.js')),
			__memo(() => import('./chunks/20-Cx0Wr4md.js')),
			__memo(() => import('./chunks/21-Duj1EtX7.js')),
			__memo(() => import('./chunks/22-CIXOv-sF.js')),
			__memo(() => import('./chunks/23-BPdbqj45.js')),
			__memo(() => import('./chunks/24-C-soGkZj.js')),
			__memo(() => import('./chunks/25-ZT3I2sxx.js')),
			__memo(() => import('./chunks/26-B2_BSrug.js')),
			__memo(() => import('./chunks/27-DQN6Md_c.js')),
			__memo(() => import('./chunks/28-C8fvyG0s.js')),
			__memo(() => import('./chunks/29-CHuXZDxZ.js')),
			__memo(() => import('./chunks/30-IKnKsb9i.js')),
			__memo(() => import('./chunks/31-CJz5Kcbz.js')),
			__memo(() => import('./chunks/32-BKYOLoO3.js')),
			__memo(() => import('./chunks/33-C7tIFTLf.js')),
			__memo(() => import('./chunks/34-CsderH-v.js')),
			__memo(() => import('./chunks/35-JRf42PX0.js')),
			__memo(() => import('./chunks/36-AUn5r1Cf.js'))
		],
		routes: [
			{
				id: "/(picsure)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,5,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration",
				pattern: /^\/admin\/configuration\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/new",
				pattern: /^\/admin\/configuration\/connection\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/connection/[uuid]/edit",
				pattern: /^\/admin\/configuration\/connection\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/new",
				pattern: /^\/admin\/configuration\/privilege\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/privilege/[uuid]/edit",
				pattern: /^\/admin\/configuration\/privilege\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/new",
				pattern: /^\/admin\/configuration\/role\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/configuration/role/[uuid]/edit",
				pattern: /^\/admin\/configuration\/role\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/requests",
				pattern: /^\/admin\/requests\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users",
				pattern: /^\/admin\/users\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/new",
				pattern: /^\/admin\/users\/new\/?$/,
				params: [],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]",
				pattern: /^\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit",
				pattern: /^\/admin\/users\/([^/]+?)\/edit\/?$/,
				params: [{"name":"uuid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,5,6,7,], errors: [1,,,,], leaf: 22 },
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
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/error",
				pattern: /^\/login\/error\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,3,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/(authentication)/login/loading",
				pattern: /^\/login\/loading\/?$/,
				params: [],
				page: { layouts: [0,2,,], errors: [1,,4,], leaf: 10 },
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
