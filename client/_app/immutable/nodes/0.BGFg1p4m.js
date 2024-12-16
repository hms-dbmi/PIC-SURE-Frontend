import{r as ee}from"../chunks/index.D-WRxJ17.js";import{s as oe,q as S,a as P,p as ue,f,g as L,h as p,i as j,n as b,k as ge,o as fe,e as v,t as $,c as h,b as w,d as N,T as _e,m,l as te,D as J,O as ae,w as pe,J as me,K as ve,L as he,M as ye}from"../chunks/scheduler.bui7uCNy.js";import{S as se,i as le,d as we,e as be,m as Ie,t as ne,a as ie,f as De}from"../chunks/index.CNwEczq-.js";import{i as je}from"../chunks/stores.DW-RA2wp.js";import{i as ke}from"../chunks/stores.CyMKLvfo.js";import{i as Te}from"../chunks/stores.CC2Z_udF.js";import"../chunks/ProgressBar.svelte_svelte_type_style_lang.BCRmI_eu.js";import{b as z,s as Q,i as Ee}from"../chunks/configuration.CsqyQUvi.js";import{g as Se}from"../chunks/globals.D0QH3NT1.js";import{c as I}from"../chunks/_commonjsHelpers.Cpj98o6Y.js";import{b as Oe}from"../chunks/index.Bt-Xh7oU.js";import{p as ze}from"../chunks/stores.BNv7cvyh.js";const Pe=async({url:t,fetch:e})=>{try{if((await e(t.pathname)).status===404)throw ee(302,"/")}catch{throw ee(302,"/")}},lt=Object.freeze(Object.defineProperty({__proto__:null,load:Pe},Symbol.toStringTag,{value:"Module"}));function Le(){je(),ke(),Te()}var O={},ce={},de={};(function(t){Object.defineProperty(t,"__esModule",{value:!0}),t.ErrorText=void 0,function(e){e.REQUIRE_ID="ID is required",e.NEED_INITIALIZATION='You need to initialize by running "initialize" function',e.ALREADY_INITIALIZED="You have already initialized"}(t.ErrorText||(t.ErrorText={}))})(de);var q={},V=I&&I.__assign||function(){return V=Object.assign||function(t){for(var e,n=1,r=arguments.length;n<r;n++){e=arguments[n];for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a])}return t},V.apply(this,arguments)};Object.defineProperty(q,"__esModule",{value:!0});var Me=function(){function t(){this.data={enableLog:!1}}return t.prototype.getData=function(){return this.data},t.prototype.setData=function(e){this.data=V(V({},this.data),e)},t}(),Ae=new Me;q.default=Ae;var U={},$e=I&&I.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(U,"__esModule",{value:!0});U.warn=void 0;var Ne=$e(q),Ce=function(t){Ne.default.getData().enableLog&&console.warn("[gtagjs]",t)};U.warn=Ce;var C={};Object.defineProperty(C,"__esModule",{value:!0});C.checkIsBrowser=void 0;var Be=function(){return typeof window<"u"&&typeof document<"u"};C.checkIsBrowser=Be;var Y={};Object.defineProperty(Y,"__esModule",{value:!0});Y.addGtagScriptDom=void 0;var Ge=C,Re="https://www.googletagmanager.com/gtag/js",Je=function(t){if(Ge.checkIsBrowser()){var e=document.createElement("script");e.src=Re+"?id="+t,e.type="text/javascript",e.async=!0,document.body.appendChild(e)}};Y.addGtagScriptDom=Je;(function(t){var e=I&&I.__assign||function(){return e=Object.assign||function(i){for(var _,l=1,g=arguments.length;l<g;l++){_=arguments[l];for(var D in _)Object.prototype.hasOwnProperty.call(_,D)&&(i[D]=_[D])}return i},e.apply(this,arguments)},n=I&&I.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(t,"__esModule",{value:!0}),t.initialize=t.gtag=void 0;var r=de,a=n(q),c=U,o=C,s=Y;function u(i){o.checkIsBrowser()&&(window.dataLayer||(window.dataLayer=[]),window.dataLayer.push(arguments))}t.gtag=u;var d=function(i,_){var l,g;if(o.checkIsBrowser()){if(a.default.getData().id&&c.warn(r.ErrorText.ALREADY_INITIALIZED),!i){c.warn(r.ErrorText.REQUIRE_ID);return}a.default.setData(e({id:i},(l=_==null?void 0:_.lib)!==null&&l!==void 0?l:{})),u("js",new Date),u("config",i,(g=_==null?void 0:_.gtag)!==null&&g!==void 0?g:{}),s.addGtagScriptDom(i)}};t.initialize=d,t.default={gtag:u,initialize:t.initialize}})(ce);(function(t){var e=I&&I.__importDefault||function(r){return r&&r.__esModule?r:{default:r}};Object.defineProperty(t,"__esModule",{value:!0}),t.gtag=t.initialize=t.default=void 0;var n=ce;Object.defineProperty(t,"default",{enumerable:!0,get:function(){return e(n).default}}),Object.defineProperty(t,"initialize",{enumerable:!0,get:function(){return n.initialize}}),Object.defineProperty(t,"gtag",{enumerable:!0,get:function(){return n.gtag}})})(O);const{document:A}=Se;function Ve(t){let e,n,r,a,c;return{c(){e=v("script"),r=P(),a=v("script"),c=$(`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }

      gtag('js', new Date());
      gtag('config', googleAnalyticsID);

      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        ad_personalization: 'denied',
        ad_data: 'denied',
        ad_user_data: 'denied',
      });

      let consents = localStorage.getItem('consentMode');
      if (consents) {
        consents = JSON.parse(consents);
        gtag('consent', 'update', consents);
      }
    `),this.h()},l(o){e=h(o,"SCRIPT",{src:!0});var s=w(e);s.forEach(f),r=L(o),a=h(o,"SCRIPT",{"data-analyticsid":!0});var u=w(a);c=N(u,`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }

      gtag('js', new Date());
      gtag('config', googleAnalyticsID);

      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        ad_personalization: 'denied',
        ad_data: 'denied',
        ad_user_data: 'denied',
      });

      let consents = localStorage.getItem('consentMode');
      if (consents) {
        consents = JSON.parse(consents);
        gtag('consent', 'update', consents);
      }
    `),u.forEach(f),this.h()},h(){e.async=!0,_e(e.src,n="https://www.googletagmanager.com/gtag/js?id="+t[2])||m(e,"src",n),m(a,"data-analyticsid",t[2])},m(o,s){j(o,e,s),j(o,r,s),j(o,a,s),p(a,c)},p:b,d(o){o&&(f(e),f(r),f(a))}}}function qe(t){let e,n;return{c(){e=v("script"),n=$(`let googleTag = document.currentScript.getAttribute('data-googleTag');

      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', googleTag);`),this.h()},l(r){e=h(r,"SCRIPT",{"data-googletag":!0});var a=w(e);n=N(a,`let googleTag = document.currentScript.getAttribute('data-googleTag');

      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', googleTag);`),a.forEach(f),this.h()},h(){m(e,"data-googletag",t[1])},m(r,a){j(r,e,a),p(e,n)},p:b,d(r){r&&f(e)}}}function re(t){var K,F;let e,n,r,a,c,o,s,u=((F=(K=z)==null?void 0:K.privacyPolicy)==null?void 0:F.title)+"",d,i,_,l,g,D="Accept",E,y,M="Reject",Z,W;return{c(){e=v("div"),n=v("div"),r=v("div"),a=v("div"),c=v("p"),o=$(`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=v("a"),d=$(u),i=$("."),_=P(),l=v("div"),g=v("button"),g.textContent=D,E=P(),y=v("button"),y.textContent=M,this.h()},l(k){e=h(k,"DIV",{"data-testid":!0,class:!0,style:!0});var T=w(e);n=h(T,"DIV",{class:!0});var H=w(n);r=h(H,"DIV",{class:!0});var B=w(r);a=h(B,"DIV",{class:!0});var X=w(a);c=h(X,"P",{});var G=w(c);o=N(G,`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=h(G,"A",{href:!0,target:!0,class:!0});var x=w(s);d=N(x,u),x.forEach(f),i=N(G,"."),G.forEach(f),X.forEach(f),_=L(B),l=h(B,"DIV",{class:!0});var R=w(l);g=h(R,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(g)!=="svelte-7hf92q"&&(g.textContent=D),E=L(R),y=h(R,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(y)!=="svelte-1rjwrh0"&&(y.textContent=M),R.forEach(f),B.forEach(f),H.forEach(f),T.forEach(f),this.h()},h(){var k,T;m(s,"href",(T=(k=z)==null?void 0:k.privacyPolicy)==null?void 0:T.url),m(s,"target","_blank"),m(s,"class","anchor"),m(a,"class","flex items center"),m(g,"data-testid","acceptGoogleConsent"),m(g,"class","btn variant-filled-primary mt-1 mb-1"),m(y,"data-testid","rejectGoogleConsent"),m(y,"class","btn variant-ghost-primary mt-1 mb-1 self-center"),m(l,"class","flex flex-col justify-center"),m(r,"class","flex flex-row justify-between items-center"),m(n,"class","bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"),m(e,"data-testid","consentModal"),m(e,"class","fixed"),J(e,"left","5%"),J(e,"bottom","60px"),J(e,"z-index","1000"),J(e,"width","90%")},m(k,T){j(k,e,T),p(e,n),p(n,r),p(r,a),p(a,c),p(c,o),p(c,s),p(s,d),p(c,i),p(r,_),p(r,l),p(l,g),p(l,E),p(l,y),Z||(W=[ae(g,"click",t[5]),ae(y,"click",t[6])],Z=!0)},p:b,d(k){k&&f(e),Z=!1,pe(W)}}}function Ue(t){var u,d,i,_;let e,n,r,a,c=t[2]&&Ve(t),o=t[1]&&qe(t),s=t[1]&&t[0]&&((d=(u=z)==null?void 0:u.privacyPolicy)==null?void 0:d.url)&&((_=(i=z)==null?void 0:i.privacyPolicy)==null?void 0:_.title)&&re(t);return{c(){c&&c.c(),e=S(),o&&o.c(),n=S(),r=P(),s&&s.c(),a=S()},l(l){const g=ue("svelte-1wk68kl",A.head);c&&c.l(g),e=S(),o&&o.l(g),n=S(),g.forEach(f),r=L(l),s&&s.l(l),a=S()},m(l,g){c&&c.m(A.head,null),p(A.head,e),o&&o.m(A.head,null),p(A.head,n),j(l,r,g),s&&s.m(l,g),j(l,a,g)},p(l,[g]){var D,E,y,M;l[2]&&c.p(l,g),l[1]&&o.p(l,g),l[1]&&l[0]&&((E=(D=z)==null?void 0:D.privacyPolicy)!=null&&E.url)&&((M=(y=z)==null?void 0:y.privacyPolicy)!=null&&M.title)?s?s.p(l,g):(s=re(l),s.c(),s.m(a.parentNode,a)):s&&(s.d(1),s=null)},i:b,o:b,d(l){l&&(f(r),f(a)),c&&c.d(l),f(e),o&&o.d(l),f(n),s&&s.d(l)}}}function Ye(t,e,n){let r,a;ge(t,ze,i=>n(4,a=i));let c=Q.google.tagManager,o=Q.google.analytics;function s(i){let _={ad_storage:"denied",analytics_storage:i?"granted":"denied",personalization_storage:i?"granted":"denied",ad_personalization:"denied",ad_data:"denied",ad_user_data:"denied"};O.gtag("consent","update",_),localStorage.setItem("consentMode",JSON.stringify(_)),n(0,r=!1)}fe(()=>{let i=localStorage.getItem("consentMode");i||n(0,r=!0),i!=null&&i.includes("granted")&&O.gtag("consent","update",JSON.parse(i))});const u=()=>s(!0),d=()=>s(!1);return t.$$.update=()=>{var i;t.$$.dirty&16&&o&&Oe&&typeof O.gtag=="function"&&(i=localStorage.getItem("consentMode"))!=null&&i.includes("granted")&&(O.gtag("js",new Date),O.gtag("config",o,{page_title:document.title,page_path:a.url.pathname}))},n(0,r=!1),[r,c,o,s,a,u,d]}class Ze extends se{constructor(e){super(),le(this,e,Ye,Ue,oe,{})}}function Qe(t){return{c:b,l:b,m:b,p:b,d:b}}function We(t){let e,n,r,a,c,o=t[0]&&Qe();const s=t[2].default,u=me(s,t,t[1],null);return a=new Ze({}),{c(){o&&o.c(),e=P(),n=v("main"),u&&u.c(),r=P(),we(a.$$.fragment),this.h()},l(d){o&&o.l(d),e=L(d),n=h(d,"MAIN",{class:!0});var i=w(n);u&&u.l(i),r=L(i),be(a.$$.fragment,i),i.forEach(f),this.h()},h(){m(n,"class","w-full h-full")},m(d,i){o&&o.m(d,i),j(d,e,i),j(d,n,i),u&&u.m(n,null),p(n,r),Ie(a,n,null),c=!0},p(d,[i]){d[0]&&o.p(d,i),u&&u.p&&(!c||i&2)&&ve(u,s,d,d[1],c?ye(s,d[1],i,null):he(d[1]),null)},i(d){c||(ne(u,d),ne(a.$$.fragment,d),c=!0)},o(d){ie(u,d),ie(a.$$.fragment,d),c=!1},d(d){d&&(f(e),f(n)),o&&o.d(d),u&&u.d(d),De(a)}}}function Ke(t,e,n){let{$$slots:r={},$$scope:a}=e,c=Q.google.tagManager;return Le(),Ee(),t.$$set=o=>{"$$scope"in o&&n(1,a=o.$$scope)},[c,a,r]}class ct extends se{constructor(e){super(),le(this,e,Ke,We,oe,{})}}export{ct as component,lt as universal};
