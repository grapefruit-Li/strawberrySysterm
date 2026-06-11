import{d as S,g as A,h as R,c,a as e,b as r,w as u,T as y,F as D,r as B,i as p,j as k,u as i,n as _,t as g,k as h,f as O,l as w,m as P,o as n,p as z,q as T,_ as q}from"./index-BlgtYtmx.js";import{M as E}from"./ManualDrawer-DwTzQDYG.js";import{c as l}from"./createLucideIcon-DZBkfN9V.js";import{P as I}from"./play-BFx20ePo.js";import{L as N}from"./leaf-x10O1Zh4.js";/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=l("arrow-left",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=l("book-open",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=l("chart-column",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=l("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=l("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=l("database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-vue-next v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=l("settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]),J={class:"v1-layout"},K={class:"sidebar-header"},Q={key:0,class:"sidebar-header-text"},X={class:"sidebar-nav"},Y={key:0,class:"nav-label"},Z={class:"sidebar-toggle"},ee={class:"main-area"},ae={class:"top-bar"},te={class:"top-bar-left"},se={style:{"font-size":"14px",color:"var(--text-secondary)"}},oe={class:"top-bar-right"},ne={class:"content-area"},le=S({__name:"AppLayoutV1",setup(re){const m=T(),C=O(),d=w(!1),s=w(!1);function v(){window.innerWidth<768&&(s.value=!0)}A(()=>{v(),window.addEventListener("resize",v)}),R(()=>{window.removeEventListener("resize",v)});function x(){s.value=!s.value}const b=[{path:"/v1",label:"配置",icon:U},{path:"/v1/simulation",label:"模拟",icon:I},{path:"/v1/results",label:"结果",icon:F},{path:"/v1/cultivars",label:"品种库",icon:N},{path:"/v1/data",label:"数据",icon:H}];function f(o){return o==="/v1"?m.path==="/v1":m.path.startsWith(o)}const M=P(()=>{const o=b.find(a=>f(a.path));return(o==null?void 0:o.label)||"模拟器模式"});return(o,a)=>{const V=z("router-link"),L=z("router-view");return n(),c("div",J,[e("aside",{class:_(["sidebar",{collapsed:s.value}])},[e("div",K,[a[4]||(a[4]=e("div",{style:{"font-size":"28px","margin-bottom":"8px"}},"🍓",-1)),r(y,{name:"fade"},{default:u(()=>[s.value?h("",!0):(n(),c("div",Q,[...a[3]||(a[3]=[e("div",{class:"sidebar-title"},"StrawSim V1",-1),e("div",{class:"sidebar-subtitle"},"DSSAT CROPGRO 模型",-1),e("div",{class:"sidebar-badge"},"模拟器模式",-1)])]))]),_:1})]),e("nav",X,[(n(),c(D,null,B(b,t=>r(V,{key:t.path,to:t.path,class:_(["nav-item",{active:f(t.path)}])},{default:u(()=>[(n(),p(k(t.icon),{size:20,class:"nav-icon-lucide"})),r(y,{name:"fade"},{default:u(()=>[s.value?h("",!0):(n(),c("span",Y,g(t.label),1))]),_:2},1024)]),_:2},1032,["to","class"])),64))]),e("div",Z,[e("button",{class:"toggle-btn",onClick:x},[(n(),p(k(s.value?i(W):i(G)),{size:18}))])]),a[5]||(a[5]=e("div",{class:"sidebar-footer"},[e("div",{style:{"font-size":"11px",color:"var(--text-muted)"}},"v1.0 · DSSAT CROPGRO")],-1))],2),e("div",ee,[e("header",ae,[e("div",te,[e("span",se,g(M.value),1)]),e("div",oe,[e("button",{class:"ghost-btn",onClick:a[0]||(a[0]=t=>d.value=!0)},[r(i(j),{size:14}),a[6]||(a[6]=e("span",null,"使用手册",-1))]),e("button",{class:"ghost-btn",onClick:a[1]||(a[1]=t=>i(C).push("/"))},[r(i($),{size:14}),a[7]||(a[7]=e("span",null,"返回版本选择",-1))])])]),e("main",ne,[r(L)])]),d.value?(n(),p(E,{key:0,visible:d.value,version:"v1",onClose:a[2]||(a[2]=t=>d.value=!1)},null,8,["visible"])):h("",!0)])}}}),pe=q(le,[["__scopeId","data-v-0cbb5b55"]]);export{pe as default};
