import{r as ee}from"../chunks/BbQdfDK7.js";import{s as oe,q as S,a as P,p as ue,f,g as M,h as p,i as D,n as b,k as ge,o as fe,e as v,t as $,c as h,b as w,d as N,Z as _e,m,l as te,M as V,v as ae,y as pe,S as me,T as ve,U as he,V as ye}from"../chunks/CJ6ziB5E.js";import{S as se,i as le,d as we,e as be,m as Ie,t as ne,a as ie,f as je}from"../chunks/CVe-HNkC.js";import{i as De}from"../chunks/VC8iF-cC.js";import{i as ke}from"../chunks/DlmMpHpA.js";import{i as Te}from"../chunks/BlPueShg.js";import"../chunks/DXVbyi0u.js";import{b as z,s as Q,i as Ee}from"../chunks/Do7xJ0Gi.js";import{g as Se}from"../chunks/D0QH3NT1.js";import{c as I}from"../chunks/Cpj98o6Y.js";import{b as Oe}from"../chunks/Bt-Xh7oU.js";import{p as ze}from"../chunks/Bx_3jGoJ.js";const Pe=async({url:t,fetch:e})=>{try{if((await e(t.pathname)).status===404)throw ee(302,"/")}catch{throw ee(302,"/")}},lt=Object.freeze(Object.defineProperty({__proto__:null,load:Pe},Symbol.toStringTag,{value:"Module"}));function Me(){De(),ke(),Te()}var O={},ce={},de={};(function(t){Object.defineProperty(t,"__esModule",{value:!0}),t.ErrorText=void 0,function(e){e.REQUIRE_ID="ID is required",e.NEED_INITIALIZATION='You need to initialize by running "initialize" function',e.ALREADY_INITIALIZED="You have already initialized"}(t.ErrorText||(t.ErrorText={}))})(de);var U={},J=I&&I.__assign||function(){return J=Object.assign||function(t){for(var e,n=1,r=arguments.length;n<r;n++){e=arguments[n];for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a])}return t},J.apply(this,arguments)};Object.defineProperty(U,"__esModule",{value:!0});var Le=function(){function t(){this.data={enableLog:!1}}return t.prototype.getData=function(){return this.data},t.prototype.setData=function(e){this.data=J(J({},this.data),e)},t}(),Ae=new Le;U.default=Ae;var q={},$e=I&&I.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(q,"__esModule",{value:!0});q.warn=void 0;var Ne=$e(U),Ce=function(t){Ne.default.getData().enableLog&&console.warn("[gtagjs]",t)};q.warn=Ce;var C={};Object.defineProperty(C,"__esModule",{value:!0});C.checkIsBrowser=void 0;var Be=function(){return typeof window<"u"&&typeof document<"u"};C.checkIsBrowser=Be;var Y={};Object.defineProperty(Y,"__esModule",{value:!0});Y.addGtagScriptDom=void 0;var Ge=C,Re="https://www.googletagmanager.com/gtag/js",Ve=function(t){if(Ge.checkIsBrowser()){var e=document.createElement("script");e.src=Re+"?id="+t,e.type="text/javascript",e.async=!0,document.body.appendChild(e)}};Y.addGtagScriptDom=Ve;(function(t){var e=I&&I.__assign||function(){return e=Object.assign||function(i){for(var _,l=1,g=arguments.length;l<g;l++){_=arguments[l];for(var j in _)Object.prototype.hasOwnProperty.call(_,j)&&(i[j]=_[j])}return i},e.apply(this,arguments)},n=I&&I.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(t,"__esModule",{value:!0}),t.initialize=t.gtag=void 0;var r=de,a=n(U),c=q,o=C,s=Y;function u(i){o.checkIsBrowser()&&(window.dataLayer||(window.dataLayer=[]),window.dataLayer.push(arguments))}t.gtag=u;var d=function(i,_){var l,g;if(o.checkIsBrowser()){if(a.default.getData().id&&c.warn(r.ErrorText.ALREADY_INITIALIZED),!i){c.warn(r.ErrorText.REQUIRE_ID);return}a.default.setData(e({id:i},(l=_==null?void 0:_.lib)!==null&&l!==void 0?l:{})),u("js",new Date),u("config",i,(g=_==null?void 0:_.gtag)!==null&&g!==void 0?g:{}),s.addGtagScriptDom(i)}};t.initialize=d,t.default={gtag:u,initialize:t.initialize}})(ce);(function(t){var e=I&&I.__importDefault||function(r){return r&&r.__esModule?r:{default:r}};Object.defineProperty(t,"__esModule",{value:!0}),t.gtag=t.initialize=t.default=void 0;var n=ce;Object.defineProperty(t,"default",{enumerable:!0,get:function(){return e(n).default}}),Object.defineProperty(t,"initialize",{enumerable:!0,get:function(){return n.initialize}}),Object.defineProperty(t,"gtag",{enumerable:!0,get:function(){return n.gtag}})})(O);const{document:A}=Se;function Je(t){let e,n,r,a,c;return{c(){e=v("script"),r=P(),a=v("script"),c=$(`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
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
    `),this.h()},l(o){e=h(o,"SCRIPT",{src:!0});var s=w(e);s.forEach(f),r=M(o),a=h(o,"SCRIPT",{"data-analyticsid":!0});var u=w(a);c=N(u,`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
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
    `),u.forEach(f),this.h()},h(){e.async=!0,_e(e.src,n="https://www.googletagmanager.com/gtag/js?id="+t[2])||m(e,"src",n),m(a,"data-analyticsid",t[2])},m(o,s){D(o,e,s),D(o,r,s),D(o,a,s),p(a,c)},p:b,d(o){o&&(f(e),f(r),f(a))}}}function Ue(t){let e,n;return{c(){e=v("script"),n=$(`let googleTag = document.currentScript.getAttribute('data-googleTag');

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
      })(window, document, 'script', 'dataLayer', googleTag);`),a.forEach(f),this.h()},h(){m(e,"data-googletag",t[1])},m(r,a){D(r,e,a),p(e,n)},p:b,d(r){r&&f(e)}}}function re(t){var F,H;let e,n,r,a,c,o,s,u=((H=(F=z)==null?void 0:F.privacyPolicy)==null?void 0:H.title)+"",d,i,_,l,g,j="Accept",E,y,L="Reject",Z,W;return{c(){e=v("div"),n=v("div"),r=v("div"),a=v("div"),c=v("p"),o=$(`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=v("a"),d=$(u),i=$("."),_=P(),l=v("div"),g=v("button"),g.textContent=j,E=P(),y=v("button"),y.textContent=L,this.h()},l(k){e=h(k,"DIV",{"data-testid":!0,class:!0,style:!0});var T=w(e);n=h(T,"DIV",{class:!0});var K=w(n);r=h(K,"DIV",{class:!0});var B=w(r);a=h(B,"DIV",{class:!0});var X=w(a);c=h(X,"P",{});var G=w(c);o=N(G,`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=h(G,"A",{href:!0,target:!0,class:!0});var x=w(s);d=N(x,u),x.forEach(f),i=N(G,"."),G.forEach(f),X.forEach(f),_=M(B),l=h(B,"DIV",{class:!0});var R=w(l);g=h(R,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(g)!=="svelte-7hf92q"&&(g.textContent=j),E=M(R),y=h(R,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(y)!=="svelte-1rjwrh0"&&(y.textContent=L),R.forEach(f),B.forEach(f),K.forEach(f),T.forEach(f),this.h()},h(){var k,T;m(s,"href",(T=(k=z)==null?void 0:k.privacyPolicy)==null?void 0:T.url),m(s,"target","_blank"),m(s,"class","anchor"),m(a,"class","flex items center"),m(g,"data-testid","acceptGoogleConsent"),m(g,"class","btn variant-filled-primary mt-1 mb-1"),m(y,"data-testid","rejectGoogleConsent"),m(y,"class","btn variant-ghost-primary mt-1 mb-1 self-center"),m(l,"class","flex flex-col justify-center"),m(r,"class","flex flex-row justify-between items-center"),m(n,"class","bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"),m(e,"data-testid","consentModal"),m(e,"class","fixed"),V(e,"left","5%"),V(e,"bottom","60px"),V(e,"z-index","1000"),V(e,"width","90%")},m(k,T){D(k,e,T),p(e,n),p(n,r),p(r,a),p(a,c),p(c,o),p(c,s),p(s,d),p(c,i),p(r,_),p(r,l),p(l,g),p(l,E),p(l,y),Z||(W=[ae(g,"click",t[5]),ae(y,"click",t[6])],Z=!0)},p:b,d(k){k&&f(e),Z=!1,pe(W)}}}function qe(t){var u,d,i,_;let e,n,r,a,c=t[2]&&Je(t),o=t[1]&&Ue(t),s=t[1]&&t[0]&&((d=(u=z)==null?void 0:u.privacyPolicy)==null?void 0:d.url)&&((_=(i=z)==null?void 0:i.privacyPolicy)==null?void 0:_.title)&&re(t);return{c(){c&&c.c(),e=S(),o&&o.c(),n=S(),r=P(),s&&s.c(),a=S()},l(l){const g=ue("svelte-1wk68kl",A.head);c&&c.l(g),e=S(),o&&o.l(g),n=S(),g.forEach(f),r=M(l),s&&s.l(l),a=S()},m(l,g){c&&c.m(A.head,null),p(A.head,e),o&&o.m(A.head,null),p(A.head,n),D(l,r,g),s&&s.m(l,g),D(l,a,g)},p(l,[g]){var j,E,y,L;l[2]&&c.p(l,g),l[1]&&o.p(l,g),l[1]&&l[0]&&((E=(j=z)==null?void 0:j.privacyPolicy)!=null&&E.url)&&((L=(y=z)==null?void 0:y.privacyPolicy)!=null&&L.title)?s?s.p(l,g):(s=re(l),s.c(),s.m(a.parentNode,a)):s&&(s.d(1),s=null)},i:b,o:b,d(l){l&&(f(r),f(a)),c&&c.d(l),f(e),o&&o.d(l),f(n),s&&s.d(l)}}}function Ye(t,e,n){let r,a;ge(t,ze,i=>n(4,a=i));let c=Q.google.tagManager,o=Q.google.analytics;function s(i){let _={ad_storage:"denied",analytics_storage:i?"granted":"denied",personalization_storage:i?"granted":"denied",ad_personalization:"denied",ad_data:"denied",ad_user_data:"denied"};O.gtag("consent","update",_),localStorage.setItem("consentMode",JSON.stringify(_)),n(0,r=!1)}fe(()=>{let i=localStorage.getItem("consentMode");i||n(0,r=!0),i!=null&&i.includes("granted")&&O.gtag("consent","update",JSON.parse(i))});const u=()=>s(!0),d=()=>s(!1);return t.$$.update=()=>{var i;t.$$.dirty&16&&o&&Oe&&typeof O.gtag=="function"&&(i=localStorage.getItem("consentMode"))!=null&&i.includes("granted")&&(O.gtag("js",new Date),O.gtag("config",o,{page_title:document.title,page_path:a.url.pathname}))},n(0,r=!1),[r,c,o,s,a,u,d]}class Ze extends se{constructor(e){super(),le(this,e,Ye,qe,oe,{})}}function Qe(t){return{c:b,l:b,m:b,p:b,d:b}}function We(t){let e,n,r,a,c,o=t[0]&&Qe();const s=t[2].default,u=me(s,t,t[1],null);return a=new Ze({}),{c(){o&&o.c(),e=P(),n=v("main"),u&&u.c(),r=P(),we(a.$$.fragment),this.h()},l(d){o&&o.l(d),e=M(d),n=h(d,"MAIN",{class:!0});var i=w(n);u&&u.l(i),r=M(i),be(a.$$.fragment,i),i.forEach(f),this.h()},h(){m(n,"class","w-full h-full")},m(d,i){o&&o.m(d,i),D(d,e,i),D(d,n,i),u&&u.m(n,null),p(n,r),Ie(a,n,null),c=!0},p(d,[i]){d[0]&&o.p(d,i),u&&u.p&&(!c||i&2)&&ve(u,s,d,d[1],c?ye(s,d[1],i,null):he(d[1]),null)},i(d){c||(ne(u,d),ne(a.$$.fragment,d),c=!0)},o(d){ie(u,d),ie(a.$$.fragment,d),c=!1},d(d){d&&(f(e),f(n)),o&&o.d(d),u&&u.d(d),je(a)}}}function Fe(t,e,n){let{$$slots:r={},$$scope:a}=e,c=Q.google.tagManager;return Me(),Ee(),t.$$set=o=>{"$$scope"in o&&n(1,a=o.$$scope)},[c,a,r]}class ct extends se{constructor(e){super(),le(this,e,Fe,We,oe,{})}}export{ct as component,lt as universal};
