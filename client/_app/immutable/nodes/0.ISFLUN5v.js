import{r as ee}from"../chunks/BPudexzz.js";import{s as oe,q as S,a as P,p as ue,f as g,g as z,h as p,i as D,n as b,k as fe,o as ge,e as v,t as A,c as h,b as w,d as $,V as _e,m,l as te,I as R,v as ae,y as pe,O as me,P as ve,Q as he,R as ye}from"../chunks/CseAM1pm.js";import{S as se,i as le,d as we,e as be,m as Ie,t as ne,a as ie,f as je}from"../chunks/CUD_i9MT.js";import{i as De}from"../chunks/f7QgzN4w.js";import{i as ke}from"../chunks/NhmsAo-M.js";import{i as Ee}from"../chunks/CRWCUMBC.js";import"../chunks/C8tRaeKn.js";import{b as O,s as Q,i as Te}from"../chunks/CukpoKTN.js";import{g as Se}from"../chunks/D0QH3NT1.js";import{c as I}from"../chunks/Cpj98o6Y.js";import{p as Oe}from"../chunks/LJvazNn0.js";const Pe=async({url:t,fetch:e})=>{try{if((await e(t.pathname)).status===404)throw ee(302,"/")}catch{throw ee(302,"/")}},ot=Object.freeze(Object.defineProperty({__proto__:null,load:Pe},Symbol.toStringTag,{value:"Module"}));function ze(){De(),ke(),Ee()}var Z={},ce={},de={};(function(t){Object.defineProperty(t,"__esModule",{value:!0}),t.ErrorText=void 0,function(e){e.REQUIRE_ID="ID is required",e.NEED_INITIALIZATION='You need to initialize by running "initialize" function',e.ALREADY_INITIALIZED="You have already initialized"}(t.ErrorText||(t.ErrorText={}))})(de);var J={},V=I&&I.__assign||function(){return V=Object.assign||function(t){for(var e,a=1,i=arguments.length;a<i;a++){e=arguments[a];for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])}return t},V.apply(this,arguments)};Object.defineProperty(J,"__esModule",{value:!0});var Le=function(){function t(){this.data={enableLog:!1}}return t.prototype.getData=function(){return this.data},t.prototype.setData=function(e){this.data=V(V({},this.data),e)},t}(),Me=new Le;J.default=Me;var q={},Ae=I&&I.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(q,"__esModule",{value:!0});q.warn=void 0;var $e=Ae(J),Ne=function(t){$e.default.getData().enableLog&&console.warn("[gtagjs]",t)};q.warn=Ne;var N={};Object.defineProperty(N,"__esModule",{value:!0});N.checkIsBrowser=void 0;var Ce=function(){return typeof window<"u"&&typeof document<"u"};N.checkIsBrowser=Ce;var U={};Object.defineProperty(U,"__esModule",{value:!0});U.addGtagScriptDom=void 0;var Be=N,Ge="https://www.googletagmanager.com/gtag/js",Re=function(t){if(Be.checkIsBrowser()){var e=document.createElement("script");e.src=Ge+"?id="+t,e.type="text/javascript",e.async=!0,document.body.appendChild(e)}};U.addGtagScriptDom=Re;(function(t){var e=I&&I.__assign||function(){return e=Object.assign||function(r){for(var _,l=1,f=arguments.length;l<f;l++){_=arguments[l];for(var j in _)Object.prototype.hasOwnProperty.call(_,j)&&(r[j]=_[j])}return r},e.apply(this,arguments)},a=I&&I.__importDefault||function(r){return r&&r.__esModule?r:{default:r}};Object.defineProperty(t,"__esModule",{value:!0}),t.initialize=t.gtag=void 0;var i=de,n=a(J),c=q,o=N,s=U;function u(r){o.checkIsBrowser()&&(window.dataLayer||(window.dataLayer=[]),window.dataLayer.push(arguments))}t.gtag=u;var d=function(r,_){var l,f;if(o.checkIsBrowser()){if(n.default.getData().id&&c.warn(i.ErrorText.ALREADY_INITIALIZED),!r){c.warn(i.ErrorText.REQUIRE_ID);return}n.default.setData(e({id:r},(l=_==null?void 0:_.lib)!==null&&l!==void 0?l:{})),u("js",new Date),u("config",r,(f=_==null?void 0:_.gtag)!==null&&f!==void 0?f:{}),s.addGtagScriptDom(r)}};t.initialize=d,t.default={gtag:u,initialize:t.initialize}})(ce);(function(t){var e=I&&I.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(t,"__esModule",{value:!0}),t.gtag=t.initialize=t.default=void 0;var a=ce;Object.defineProperty(t,"default",{enumerable:!0,get:function(){return e(a).default}}),Object.defineProperty(t,"initialize",{enumerable:!0,get:function(){return a.initialize}}),Object.defineProperty(t,"gtag",{enumerable:!0,get:function(){return a.gtag}})})(Z);const{document:M}=Se;function Ve(t){let e,a,i,n,c;return{c(){e=v("script"),i=P(),n=v("script"),c=A(`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
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
    `),this.h()},l(o){e=h(o,"SCRIPT",{src:!0});var s=w(e);s.forEach(g),i=z(o),n=h(o,"SCRIPT",{"data-analyticsid":!0});var u=w(n);c=$(u,`let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
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
    `),u.forEach(g),this.h()},h(){e.async=!0,_e(e.src,a="https://www.googletagmanager.com/gtag/js?id="+t[2])||m(e,"src",a),m(n,"data-analyticsid",t[2])},m(o,s){D(o,e,s),D(o,i,s),D(o,n,s),p(n,c)},p:b,d(o){o&&(g(e),g(i),g(n))}}}function Je(t){let e,a;return{c(){e=v("script"),a=A(`let googleTag = document.currentScript.getAttribute('data-googleTag');

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
      })(window, document, 'script', 'dataLayer', googleTag);`),this.h()},l(i){e=h(i,"SCRIPT",{"data-googletag":!0});var n=w(e);a=$(n,`let googleTag = document.currentScript.getAttribute('data-googleTag');

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
      })(window, document, 'script', 'dataLayer', googleTag);`),n.forEach(g),this.h()},h(){m(e,"data-googletag",t[1])},m(i,n){D(i,e,n),p(e,a)},p:b,d(i){i&&g(e)}}}function re(t){var F,H;let e,a,i,n,c,o,s,u=((H=(F=O)==null?void 0:F.privacyPolicy)==null?void 0:H.title)+"",d,r,_,l,f,j="Accept",T,y,L="Reject",Y,W;return{c(){e=v("div"),a=v("div"),i=v("div"),n=v("div"),c=v("p"),o=A(`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=v("a"),d=A(u),r=A("."),_=P(),l=v("div"),f=v("button"),f.textContent=j,T=P(),y=v("button"),y.textContent=L,this.h()},l(k){e=h(k,"DIV",{"data-testid":!0,class:!0,style:!0});var E=w(e);a=h(E,"DIV",{class:!0});var K=w(a);i=h(K,"DIV",{class:!0});var C=w(i);n=h(C,"DIV",{class:!0});var X=w(n);c=h(X,"P",{});var B=w(c);o=$(B,`We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our `),s=h(B,"A",{href:!0,target:!0,class:!0});var x=w(s);d=$(x,u),x.forEach(g),r=$(B,"."),B.forEach(g),X.forEach(g),_=z(C),l=h(C,"DIV",{class:!0});var G=w(l);f=h(G,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(f)!=="svelte-7hf92q"&&(f.textContent=j),T=z(G),y=h(G,"BUTTON",{"data-testid":!0,class:!0,"data-svelte-h":!0}),te(y)!=="svelte-1rjwrh0"&&(y.textContent=L),G.forEach(g),C.forEach(g),K.forEach(g),E.forEach(g),this.h()},h(){var k,E;m(s,"href",(E=(k=O)==null?void 0:k.privacyPolicy)==null?void 0:E.url),m(s,"target","_blank"),m(s,"class","anchor"),m(n,"class","flex items center"),m(f,"data-testid","acceptGoogleConsent"),m(f,"class","btn variant-filled-primary mt-1 mb-1"),m(y,"data-testid","rejectGoogleConsent"),m(y,"class","btn variant-ghost-primary mt-1 mb-1 self-center"),m(l,"class","flex flex-col justify-center"),m(i,"class","flex flex-row justify-between items-center"),m(a,"class","bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"),m(e,"data-testid","consentModal"),m(e,"class","fixed"),R(e,"left","5%"),R(e,"bottom","60px"),R(e,"z-index","1000"),R(e,"width","90%")},m(k,E){D(k,e,E),p(e,a),p(a,i),p(i,n),p(n,c),p(c,o),p(c,s),p(s,d),p(c,r),p(i,_),p(i,l),p(l,f),p(l,T),p(l,y),Y||(W=[ae(f,"click",t[5]),ae(y,"click",t[6])],Y=!0)},p:b,d(k){k&&g(e),Y=!1,pe(W)}}}function qe(t){var u,d,r,_;let e,a,i,n,c=t[2]&&Ve(t),o=t[1]&&Je(t),s=t[1]&&t[0]&&((d=(u=O)==null?void 0:u.privacyPolicy)==null?void 0:d.url)&&((_=(r=O)==null?void 0:r.privacyPolicy)==null?void 0:_.title)&&re(t);return{c(){c&&c.c(),e=S(),o&&o.c(),a=S(),i=P(),s&&s.c(),n=S()},l(l){const f=ue("svelte-1wk68kl",M.head);c&&c.l(f),e=S(),o&&o.l(f),a=S(),f.forEach(g),i=z(l),s&&s.l(l),n=S()},m(l,f){c&&c.m(M.head,null),p(M.head,e),o&&o.m(M.head,null),p(M.head,a),D(l,i,f),s&&s.m(l,f),D(l,n,f)},p(l,[f]){var j,T,y,L;l[2]&&c.p(l,f),l[1]&&o.p(l,f),l[1]&&l[0]&&((T=(j=O)==null?void 0:j.privacyPolicy)!=null&&T.url)&&((L=(y=O)==null?void 0:y.privacyPolicy)!=null&&L.title)?s?s.p(l,f):(s=re(l),s.c(),s.m(n.parentNode,n)):s&&(s.d(1),s=null)},i:b,o:b,d(l){l&&(g(i),g(n)),c&&c.d(l),g(e),o&&o.d(l),g(a),s&&s.d(l)}}}function Ue(t,e,a){let i,n;fe(t,Oe,r=>a(4,n=r));let c=Q.google.tagManager,o=Q.google.analytics;function s(r){let _={ad_storage:"denied",analytics_storage:r?"granted":"denied",personalization_storage:r?"granted":"denied",ad_personalization:"denied",ad_data:"denied",ad_user_data:"denied"};Z.gtag("consent","update",_),localStorage.setItem("consentMode",JSON.stringify(_)),a(0,i=!1)}ge(()=>{let r=localStorage.getItem("consentMode");r||a(0,i=!0),r!=null&&r.includes("granted")&&Z.gtag("consent","update",JSON.parse(r))});const u=()=>s(!0),d=()=>s(!1);return t.$$.update=()=>{t.$$.dirty&16},a(0,i=!1),[i,c,o,s,n,u,d]}class Ye extends se{constructor(e){super(),le(this,e,Ue,qe,oe,{})}}function Qe(t){return{c:b,l:b,m:b,p:b,d:b}}function Ze(t){let e,a,i,n,c,o=t[0]&&Qe();const s=t[2].default,u=me(s,t,t[1],null);return n=new Ye({}),{c(){o&&o.c(),e=P(),a=v("main"),u&&u.c(),i=P(),we(n.$$.fragment),this.h()},l(d){o&&o.l(d),e=z(d),a=h(d,"MAIN",{class:!0});var r=w(a);u&&u.l(r),i=z(r),be(n.$$.fragment,r),r.forEach(g),this.h()},h(){m(a,"class","w-full h-full")},m(d,r){o&&o.m(d,r),D(d,e,r),D(d,a,r),u&&u.m(a,null),p(a,i),Ie(n,a,null),c=!0},p(d,[r]){d[0]&&o.p(d,r),u&&u.p&&(!c||r&2)&&ve(u,s,d,d[1],c?ye(s,d[1],r,null):he(d[1]),null)},i(d){c||(ne(u,d),ne(n.$$.fragment,d),c=!0)},o(d){ie(u,d),ie(n.$$.fragment,d),c=!1},d(d){d&&(g(e),g(a)),o&&o.d(d),u&&u.d(d),je(n)}}}function We(t,e,a){let{$$slots:i={},$$scope:n}=e,c=Q.google.tagManager;return ze(),Te(),t.$$set=o=>{"$$scope"in o&&a(1,n=o.$$scope)},[c,n,i]}class st extends se{constructor(e){super(),le(this,e,We,Ze,oe,{})}}export{st as component,ot as universal};
