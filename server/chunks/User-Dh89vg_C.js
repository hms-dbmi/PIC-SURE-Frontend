import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { e as error } from './index-CvuFLVuQ.js';
import { r as routes, P as PicsurePrivileges, f as features, B as BDCPrivileges } from './configuration-zUcJ0Kpb.js';
import { g as goto } from './client-TAfaRk9z.js';
import { p as page } from './stores4-B2YFsTYy.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

const BEARER = "Bearer ";
async function send({
  method,
  path,
  data,
  headers
}) {
  const opts = {
    method,
    headers: {}
  };
  if (data) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = typeof data === "string" ? data : JSON.stringify(data);
  }
  if (headers) {
    opts.headers = { ...opts.headers, ...headers };
  }
  const res = await fetch(`${window.location.origin}/${path}`, opts);
  return await handleResponse(res);
}
function get(path, headers) {
  return send({ method: "GET", path, headers });
}
function del(path, headers) {
  return send({ method: "DELETE", path, headers });
}
function post(path, data, headers) {
  return send({ method: "POST", path, data, headers });
}
function put(path, data, headers) {
  return send({ method: "PUT", path, data, headers });
}
async function handleResponse(res) {
  if (res.ok || res.status === 422) {
    refreshToken(res);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } else if (res.status === 401) {
    logout(void 0, true);
    return;
  } else if (res.status === 403) {
    logout(void 0, false);
    return;
  }
  throw error(res.status, await res.text());
}
function refreshToken(res) {
  let newAuthToken = res.headers.get("Authorization");
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, "");
    login();
  }
}
const user = writable(restoreUser());
user.subscribe((user2) => {
});
function restoreUser() {
  return {};
}
const userRoutes = derived(user, ($user) => {
  const userPrivileges = $user?.privileges || [];
  if (userPrivileges.length === 0) {
    return routes.filter((route) => !route.privilege);
  }
  function featureRoutes(routeList) {
    return routeList.filter((route) => route.feature ? !!features[route.feature] : true).map(
      (route) => route.children ? { ...route, children: featureRoutes(route.children) } : route
    );
  }
  const featured = featureRoutes(routes);
  if (userPrivileges.includes(PicsurePrivileges.SUPER)) {
    return featured;
  }
  function allowedRoutes(routeList) {
    return routeList.filter(
      (route) => route.privilege ? route.privilege.some((priv) => userPrivileges.includes(priv)) : true
    ).map(
      (route) => route.children ? { ...route, children: allowedRoutes(route.children) } : route
    );
  }
  return allowedRoutes(featured);
});
async function getUser(force, hasToken = false) {
  {
    const res = await get(`psama/user/me${hasToken ? "?hasToken" : ""}`);
    if (res.privileges && res.token) {
      for (const privilege of res.privileges) {
        if (privilege.includes(BDCPrivileges.PRIV_MANAGED)) {
          res.privileges.push(BDCPrivileges.AUTHORIZED_ACCESS);
          break;
        }
      }
    }
    user.set({ ...get_store_value(user), ...res });
  }
}
async function login(token) {
}
async function logout(authProvider, redirect = false) {
  {
    handleLogout(redirect);
  }
}
function handleLogout(redirect) {
  user.set({});
  if (redirect) {
    goto(`/login?redirectTo=${encodeURIComponent(get_store_value(page).url.pathname)}`);
  } else {
    goto();
  }
}
function getTokenExpiration(token) {
  if (!token) {
    throw new Error("No token provided.");
  }
  try {
    return JSON.parse(atob(token.split(".")[1])).exp * 1e3;
  } catch (error2) {
    throw new Error("Error parsing token: " + error2);
  }
}
function getTokenExpirationAsDate(token) {
  try {
    return new Date(getTokenExpiration(token));
  } catch (error2) {
    console.error("Error getting token expiration as date: " + error2);
    return void 0;
  }
}

export { userRoutes as a, getTokenExpirationAsDate as b, getUser as c, getTokenExpiration as d, put as e, del as f, get as g, post as p, user as u };
//# sourceMappingURL=User-Dh89vg_C.js.map
