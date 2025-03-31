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
		client: {"start":"_app/immutable/entry/start.B21GJMwv.js","app":"_app/immutable/entry/app.QBLZOLR9.js","imports":["_app/immutable/entry/start.B21GJMwv.js","_app/immutable/chunks/Dx2jxSvH.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/entry/app.QBLZOLR9.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/chunks/CUD_i9MT.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-DHZeqe_f.js')),
			__memo(() => import('./chunks/1-Dsq9E53r.js')),
			__memo(() => import('./chunks/2-o5AcxJ-m.js')),
			__memo(() => import('./chunks/3-C5RraYZb.js')),
			__memo(() => import('./chunks/4-BJEvEl4D.js')),
			__memo(() => import('./chunks/5-gKuVG6aB.js')),
			__memo(() => import('./chunks/6-DWGfw8vU.js')),
			__memo(() => import('./chunks/7-Coc8zmjO.js')),
			__memo(() => import('./chunks/8-DkfKERRh.js')),
			__memo(() => import('./chunks/9-5mDFQDN2.js')),
			__memo(() => import('./chunks/10-C9n2JM7P.js')),
			__memo(() => import('./chunks/11-BPCk_ehf.js')),
			__memo(() => import('./chunks/12-CdVxIvhR.js')),
			__memo(() => import('./chunks/13-BlIGCvjX.js')),
			__memo(() => import('./chunks/14-Cvi2IwpI.js')),
			__memo(() => import('./chunks/15-CbpMNa5r.js')),
			__memo(() => import('./chunks/16-CHu48uLW.js')),
			__memo(() => import('./chunks/17-Dt6Py5rO.js')),
			__memo(() => import('./chunks/18-CaQ9QW2u.js')),
			__memo(() => import('./chunks/19-BSxpKXBZ.js')),
			__memo(() => import('./chunks/20-EvorORDl.js')),
			__memo(() => import('./chunks/21-pBn3hlun.js')),
			__memo(() => import('./chunks/22-DVh2kf33.js')),
			__memo(() => import('./chunks/23-DAlMKvl1.js')),
			__memo(() => import('./chunks/24--6kp6lt2.js')),
			__memo(() => import('./chunks/25-DVXVkWKy.js')),
			__memo(() => import('./chunks/26-BRJGGTHJ.js')),
			__memo(() => import('./chunks/27-YUvxjRJ4.js')),
			__memo(() => import('./chunks/28-C_olb1Zc.js')),
			__memo(() => import('./chunks/29-MGA2Pm82.js')),
			__memo(() => import('./chunks/30-BWkOauVk.js')),
			__memo(() => import('./chunks/31-dnZWLqiu.js')),
			__memo(() => import('./chunks/32-DhhMwkK9.js')),
			__memo(() => import('./chunks/33-7dCN3V04.js')),
			__memo(() => import('./chunks/34-DErKGwM0.js')),
			__memo(() => import('./chunks/35-Dd2ZOHo2.js'))
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
