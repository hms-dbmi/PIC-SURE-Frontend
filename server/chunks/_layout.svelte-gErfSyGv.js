import { a as subscribe, h as null_to_empty, k as createEventDispatcher, o as onDestroy, l as is_promise, n as noop, m as compute_slots } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, e as escape, a as add_attribute, d as add_styles, s as spread, f as escape_object, m as missing_component, b as each } from './ssr-BRJpAXVH.js';
import { s as storeHighlightJs } from './codeBlocks-D7Bb9quT.js';
import { w as writable } from './index2-BVONNh3m.js';
import { g as getDrawerStore } from './stores3-BYOElYDy.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { p as prefersReducedMotionStore } from './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { f as fly } from './index3-ClZG_anC.js';
import { T as Toast, F as Footer } from './Footer-B2pijcDX.js';
import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
import { p as page } from './stores4-C3NPX6l0.js';
import './client-BR749xJD.js';
import { h as hasUnallowedFilter, a as hasGenomicFilter, b as hasInvalidFilter, f as filters } from './Filter-CiqCZxDC.js';
import { u as user, i as isLoggedIn, a as userRoutes } from './User-H6u4bNR9.js';
import { L as Logo } from './Logo-C2uox9rB.js';
import { E as ExportStore } from './Export-Bnz6Pnjy.js';
import { f as features, b as branding } from './configuration-GpO7NgNq.js';
import './GeneFilter-DYiuK3q5.js';
import './index-CvuFLVuQ.js';
import { g as getDatasetDetails } from './Dictionary-HnsCIvBe.js';
import { C as CardButton } from './CardButton-BunBsA3_.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import { E as ExportStepper } from './ExportStepper-fopQxkbm.js';
import hljs from 'highlight.js/lib/core';
import R from 'highlight.js/lib/languages/r';
import python from 'highlight.js/lib/languages/python';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';
import './Table-smaNoih1.js';
import './Row-Cb2p0o0o.js';
import './UserToken-CfRPWPLL.js';
import './CopyButton-BtLZ49Iw.js';

const storePopup = writable(void 0);
const cBase = "flex flex-col";
const cRowMain = "grid items-center";
const cRowHeadline = "";
const cSlotLead = "flex-none flex justify-between items-center";
const cSlotDefault = "flex-auto";
const cSlotTrail = "flex-none flex items-center space-x-4";
const AppBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let classesRowMain;
  let classesRowHeadline;
  let classesSlotLead;
  let classesSlotDefault;
  let classesSlotTrail;
  let $$slots = compute_slots(slots);
  let { background = "bg-surface-100-800-token" } = $$props;
  let { border = "" } = $$props;
  let { padding = "p-4" } = $$props;
  let { shadow = "" } = $$props;
  let { spacing = "space-y-4" } = $$props;
  let { gridColumns = "grid-cols-[auto_1fr_auto]" } = $$props;
  let { gap = "gap-4" } = $$props;
  let { regionRowMain = "" } = $$props;
  let { regionRowHeadline = "" } = $$props;
  let { slotLead = "" } = $$props;
  let { slotDefault = "" } = $$props;
  let { slotTrail = "" } = $$props;
  let { label = "" } = $$props;
  let { labelledby = "" } = $$props;
  if ($$props.background === void 0 && $$bindings.background && background !== void 0) $$bindings.background(background);
  if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0) $$bindings.shadow(shadow);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.gridColumns === void 0 && $$bindings.gridColumns && gridColumns !== void 0) $$bindings.gridColumns(gridColumns);
  if ($$props.gap === void 0 && $$bindings.gap && gap !== void 0) $$bindings.gap(gap);
  if ($$props.regionRowMain === void 0 && $$bindings.regionRowMain && regionRowMain !== void 0) $$bindings.regionRowMain(regionRowMain);
  if ($$props.regionRowHeadline === void 0 && $$bindings.regionRowHeadline && regionRowHeadline !== void 0) $$bindings.regionRowHeadline(regionRowHeadline);
  if ($$props.slotLead === void 0 && $$bindings.slotLead && slotLead !== void 0) $$bindings.slotLead(slotLead);
  if ($$props.slotDefault === void 0 && $$bindings.slotDefault && slotDefault !== void 0) $$bindings.slotDefault(slotDefault);
  if ($$props.slotTrail === void 0 && $$bindings.slotTrail && slotTrail !== void 0) $$bindings.slotTrail(slotTrail);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
  if ($$props.labelledby === void 0 && $$bindings.labelledby && labelledby !== void 0) $$bindings.labelledby(labelledby);
  classesBase = `${cBase} ${background} ${border} ${spacing} ${padding} ${shadow} ${$$props.class ?? ""}`;
  classesRowMain = `${cRowMain} ${gridColumns} ${gap} ${regionRowMain}`;
  classesRowHeadline = `${cRowHeadline} ${regionRowHeadline}`;
  classesSlotLead = `${cSlotLead} ${slotLead}`;
  classesSlotDefault = `${cSlotDefault} ${slotDefault}`;
  classesSlotTrail = `${cSlotTrail} ${slotTrail}`;
  return `<div class="${"app-bar " + escape(classesBase, true)}" data-testid="app-bar" role="toolbar"${add_attribute("aria-label", label, 0)}${add_attribute("aria-labelledby", labelledby, 0)}> <div class="${"app-bar-row-main " + escape(classesRowMain, true)}"> ${$$slots.lead ? `<div class="${"app-bar-slot-lead " + escape(classesSlotLead, true)}">${slots.lead ? slots.lead({}) : ``}</div>` : ``}  <div class="${"app-bar-slot-default " + escape(classesSlotDefault, true)}">${slots.default ? slots.default({}) : ``}</div>  ${$$slots.trail ? `<div class="${"app-bar-slot-trail " + escape(classesSlotTrail, true)}">${slots.trail ? slots.trail({}) : ``}</div>` : ``}</div>  ${$$slots.headline ? `<div class="${"app-bar-row-headline " + escape(classesRowHeadline, true)}">${slots.headline ? slots.headline({}) : ``}</div>` : ``}</div>`;
});
const cBaseAppShell = "w-full h-full flex flex-col overflow-hidden";
const cContentArea = "w-full h-full flex overflow-hidden";
const cPage = "flex-1 overflow-x-hidden flex flex-col";
const cSidebarLeft = "flex-none overflow-x-hidden overflow-y-auto";
const cSidebarRight = "flex-none overflow-x-hidden overflow-y-auto";
const AppShell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let classesHeader;
  let classesSidebarLeft;
  let classesSidebarRight;
  let classesPageHeader;
  let classesPageContent;
  let classesPageFooter;
  let classesFooter;
  let $$slots = compute_slots(slots);
  let { scrollbarGutter = "auto" } = $$props;
  let { regionPage = "" } = $$props;
  let { slotHeader = "z-10" } = $$props;
  let { slotSidebarLeft = "w-auto" } = $$props;
  let { slotSidebarRight = "w-auto" } = $$props;
  let { slotPageHeader = "" } = $$props;
  let { slotPageContent = "" } = $$props;
  let { slotPageFooter = "" } = $$props;
  let { slotFooter = "" } = $$props;
  if ($$props.scrollbarGutter === void 0 && $$bindings.scrollbarGutter && scrollbarGutter !== void 0) $$bindings.scrollbarGutter(scrollbarGutter);
  if ($$props.regionPage === void 0 && $$bindings.regionPage && regionPage !== void 0) $$bindings.regionPage(regionPage);
  if ($$props.slotHeader === void 0 && $$bindings.slotHeader && slotHeader !== void 0) $$bindings.slotHeader(slotHeader);
  if ($$props.slotSidebarLeft === void 0 && $$bindings.slotSidebarLeft && slotSidebarLeft !== void 0) $$bindings.slotSidebarLeft(slotSidebarLeft);
  if ($$props.slotSidebarRight === void 0 && $$bindings.slotSidebarRight && slotSidebarRight !== void 0) $$bindings.slotSidebarRight(slotSidebarRight);
  if ($$props.slotPageHeader === void 0 && $$bindings.slotPageHeader && slotPageHeader !== void 0) $$bindings.slotPageHeader(slotPageHeader);
  if ($$props.slotPageContent === void 0 && $$bindings.slotPageContent && slotPageContent !== void 0) $$bindings.slotPageContent(slotPageContent);
  if ($$props.slotPageFooter === void 0 && $$bindings.slotPageFooter && slotPageFooter !== void 0) $$bindings.slotPageFooter(slotPageFooter);
  if ($$props.slotFooter === void 0 && $$bindings.slotFooter && slotFooter !== void 0) $$bindings.slotFooter(slotFooter);
  classesBase = `${cBaseAppShell} ${$$props.class ?? ""}`;
  classesHeader = `${slotHeader}`;
  classesSidebarLeft = `${cSidebarLeft} ${slotSidebarLeft}`;
  classesSidebarRight = `${cSidebarRight} ${slotSidebarRight}`;
  classesPageHeader = `${slotPageHeader}`;
  classesPageContent = `${slotPageContent}`;
  classesPageFooter = `${slotPageFooter}`;
  classesFooter = `${slotFooter}`;
  return `<div id="appShell"${add_attribute("class", classesBase, 0)} data-testid="app-shell"> ${$$slots.header ? `<header id="shell-header" class="${"flex-none " + escape(classesHeader, true)}">${slots.header ? slots.header({}) : ``}</header>` : ``}  <div class="${"flex-auto " + escape(cContentArea, true)}"> ${$$slots.sidebarLeft ? `<aside id="sidebar-left"${add_attribute("class", classesSidebarLeft, 0)}>${slots.sidebarLeft ? slots.sidebarLeft({}) : ``}</aside>` : ``}  <div id="page" class="${escape(regionPage, true) + " " + escape(cPage, true)}"${add_styles({ "scrollbar-gutter": scrollbarGutter })}> ${$$slots.pageHeader ? `<header id="page-header" class="${"flex-none " + escape(classesPageHeader, true)}">${slots.pageHeader ? slots.pageHeader({}) : `(slot:header)`}</header>` : ``}  <main id="page-content" class="${"flex-auto " + escape(classesPageContent, true)}">${slots.default ? slots.default({}) : ``}</main>  ${$$slots.pageFooter ? `<footer id="page-footer" class="${"flex-none " + escape(classesPageFooter, true)}">${slots.pageFooter ? slots.pageFooter({}) : `(slot:footer)`}</footer>` : ``}</div>  ${$$slots.sidebarRight ? `<aside id="sidebar-right"${add_attribute("class", classesSidebarRight, 0)}>${slots.sidebarRight ? slots.sidebarRight({}) : ``}</aside>` : ``}</div>  ${$$slots.footer ? `<footer id="shell-footer" class="${"flex-none " + escape(classesFooter, true)}">${slots.footer ? slots.footer({}) : ``}</footer>` : ``}</div>`;
});
const cBackdrop$1 = "fixed top-0 left-0 right-0 bottom-0 bg-surface-backdrop-token p-4";
const cTransitionLayer = "w-full h-fit min-h-full overflow-y-auto flex justify-center";
const cModal = "block overflow-y-auto";
const cModalImage = "w-full h-auto";
const Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let cPosition;
  let classesBackdrop;
  let classesTransitionLayer;
  let classesModal;
  let parent;
  let $modalStore, $$unsubscribe_modalStore;
  let $prefersReducedMotionStore, $$unsubscribe_prefersReducedMotionStore;
  $$unsubscribe_prefersReducedMotionStore = subscribe(prefersReducedMotionStore, (value) => $prefersReducedMotionStore = value);
  createEventDispatcher();
  let { components = {} } = $$props;
  let { position = "items-center" } = $$props;
  let { background = "bg-surface-100-800-token" } = $$props;
  let { width = "w-modal" } = $$props;
  let { height = "h-auto" } = $$props;
  let { padding = "p-4" } = $$props;
  let { spacing = "space-y-4" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { shadow = "shadow-xl" } = $$props;
  let { zIndex = "z-[999]" } = $$props;
  let { buttonNeutral = "variant-ghost-surface" } = $$props;
  let { buttonPositive = "variant-filled" } = $$props;
  let { buttonTextCancel = "Cancel" } = $$props;
  let { buttonTextConfirm = "Confirm" } = $$props;
  let { buttonTextSubmit = "Submit" } = $$props;
  let { regionBackdrop = "" } = $$props;
  let { regionHeader = "text-2xl font-bold" } = $$props;
  let { regionBody = "max-h-[200px] overflow-hidden" } = $$props;
  let { regionFooter = "flex justify-end space-x-2" } = $$props;
  let { transitions = !$prefersReducedMotionStore } = $$props;
  let { transitionIn = fly } = $$props;
  let { transitionInParams = { duration: 150, opacity: 0, x: 0, y: 100 } } = $$props;
  let { transitionOut = fly } = $$props;
  let { transitionOutParams = { duration: 150, opacity: 0, x: 0, y: 100 } } = $$props;
  let promptValue;
  const buttonTextDefaults = {
    buttonTextCancel,
    buttonTextConfirm,
    buttonTextSubmit
  };
  let currentComponent;
  let modalElement;
  let windowHeight;
  let backdropOverflow = "overflow-y-hidden";
  const modalStore = getModalStore();
  $$unsubscribe_modalStore = subscribe(modalStore, (value) => $modalStore = value);
  function handleModals(modals) {
    if (modals[0].type === "prompt") promptValue = modals[0].value;
    buttonTextCancel = modals[0].buttonTextCancel || buttonTextDefaults.buttonTextCancel;
    buttonTextConfirm = modals[0].buttonTextConfirm || buttonTextDefaults.buttonTextConfirm;
    buttonTextSubmit = modals[0].buttonTextSubmit || buttonTextDefaults.buttonTextSubmit;
    currentComponent = typeof modals[0].component === "string" ? components[modals[0].component] : modals[0].component;
  }
  function onModalHeightChange(modal) {
    let modalHeight = modal?.clientHeight;
    if (!modalHeight) modalHeight = modal?.firstChild?.clientHeight;
    if (!modalHeight) return;
    if (modalHeight > windowHeight) {
      backdropOverflow = "overflow-y-auto";
    } else {
      backdropOverflow = "overflow-y-hidden";
    }
  }
  function onClose() {
    if ($modalStore[0].response) $modalStore[0].response(false);
    modalStore.close();
  }
  if ($$props.components === void 0 && $$bindings.components && components !== void 0) $$bindings.components(components);
  if ($$props.position === void 0 && $$bindings.position && position !== void 0) $$bindings.position(position);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0) $$bindings.background(background);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0) $$bindings.shadow(shadow);
  if ($$props.zIndex === void 0 && $$bindings.zIndex && zIndex !== void 0) $$bindings.zIndex(zIndex);
  if ($$props.buttonNeutral === void 0 && $$bindings.buttonNeutral && buttonNeutral !== void 0) $$bindings.buttonNeutral(buttonNeutral);
  if ($$props.buttonPositive === void 0 && $$bindings.buttonPositive && buttonPositive !== void 0) $$bindings.buttonPositive(buttonPositive);
  if ($$props.buttonTextCancel === void 0 && $$bindings.buttonTextCancel && buttonTextCancel !== void 0) $$bindings.buttonTextCancel(buttonTextCancel);
  if ($$props.buttonTextConfirm === void 0 && $$bindings.buttonTextConfirm && buttonTextConfirm !== void 0) $$bindings.buttonTextConfirm(buttonTextConfirm);
  if ($$props.buttonTextSubmit === void 0 && $$bindings.buttonTextSubmit && buttonTextSubmit !== void 0) $$bindings.buttonTextSubmit(buttonTextSubmit);
  if ($$props.regionBackdrop === void 0 && $$bindings.regionBackdrop && regionBackdrop !== void 0) $$bindings.regionBackdrop(regionBackdrop);
  if ($$props.regionHeader === void 0 && $$bindings.regionHeader && regionHeader !== void 0) $$bindings.regionHeader(regionHeader);
  if ($$props.regionBody === void 0 && $$bindings.regionBody && regionBody !== void 0) $$bindings.regionBody(regionBody);
  if ($$props.regionFooter === void 0 && $$bindings.regionFooter && regionFooter !== void 0) $$bindings.regionFooter(regionFooter);
  if ($$props.transitions === void 0 && $$bindings.transitions && transitions !== void 0) $$bindings.transitions(transitions);
  if ($$props.transitionIn === void 0 && $$bindings.transitionIn && transitionIn !== void 0) $$bindings.transitionIn(transitionIn);
  if ($$props.transitionInParams === void 0 && $$bindings.transitionInParams && transitionInParams !== void 0) $$bindings.transitionInParams(transitionInParams);
  if ($$props.transitionOut === void 0 && $$bindings.transitionOut && transitionOut !== void 0) $$bindings.transitionOut(transitionOut);
  if ($$props.transitionOutParams === void 0 && $$bindings.transitionOutParams && transitionOutParams !== void 0) $$bindings.transitionOutParams(transitionOutParams);
  {
    if ($modalStore.length) handleModals($modalStore);
  }
  {
    onModalHeightChange(modalElement);
  }
  cPosition = $modalStore[0]?.position ?? position;
  classesBackdrop = `${cBackdrop$1} ${regionBackdrop} ${zIndex} ${$$props.class ?? ""} ${$modalStore[0]?.backdropClasses ?? ""}`;
  classesTransitionLayer = `${cTransitionLayer} ${cPosition ?? ""}`;
  classesModal = `${cModal} ${background} ${width} ${height} ${padding} ${spacing} ${rounded} ${shadow} ${$modalStore[0]?.modalClasses ?? ""}`;
  parent = {
    position,
    // ---
    background,
    width,
    height,
    padding,
    spacing,
    rounded,
    shadow,
    // ---
    buttonNeutral,
    buttonPositive,
    buttonTextCancel,
    buttonTextConfirm,
    buttonTextSubmit,
    // ---
    regionBackdrop,
    regionHeader,
    regionBody,
    regionFooter,
    // ---
    onClose
  };
  $$unsubscribe_modalStore();
  $$unsubscribe_prefersReducedMotionStore();
  return ` ${$modalStore.length > 0 ? `   <div class="${"modal-backdrop " + escape(classesBackdrop, true) + " " + escape(backdropOverflow, true)}" data-testid="modal-backdrop"> <div class="${"modal-transition " + escape(classesTransitionLayer, true)}">${$modalStore[0].type !== "component" ? ` <div class="${"modal " + escape(classesModal, true)}" data-testid="modal" role="dialog" aria-modal="true"${add_attribute("aria-label", $modalStore[0].title ?? "", 0)}${add_attribute("this", modalElement, 0)}> ${$modalStore[0]?.title ? `<header class="${"modal-header " + escape(regionHeader, true)}"><!-- HTML_TAG_START -->${$modalStore[0].title}<!-- HTML_TAG_END --></header>` : ``}  ${$modalStore[0]?.body ? `<article class="${"modal-body " + escape(regionBody, true)}"><!-- HTML_TAG_START -->${$modalStore[0].body}<!-- HTML_TAG_END --></article>` : ``}  ${$modalStore[0]?.image && typeof $modalStore[0]?.image === "string" ? `<img class="${"modal-image " + escape(cModalImage, true)}"${add_attribute("src", $modalStore[0]?.image, 0)} alt="Modal">` : ``}  ${$modalStore[0].type === "alert" ? ` <footer class="${"modal-footer " + escape(regionFooter, true)}"><button type="button" class="${"btn " + escape(buttonNeutral, true)}">${escape(buttonTextCancel)}</button></footer>` : `${$modalStore[0].type === "confirm" ? ` <footer class="${"modal-footer " + escape(regionFooter, true)}"><button type="button" class="${"btn " + escape(buttonNeutral, true)}">${escape(buttonTextCancel)}</button> <button type="button" class="${"btn " + escape(buttonPositive, true)}">${escape(buttonTextConfirm)}</button></footer>` : `${$modalStore[0].type === "prompt" ? ` <form class="space-y-4"><input${spread(
    [
      { class: "modal-prompt-input input" },
      { name: "prompt" },
      { type: "text" },
      escape_object($modalStore[0].valueAttr)
    ],
    {}
  )}${add_attribute("value", promptValue, 0)}> <footer class="${"modal-footer " + escape(regionFooter, true)}"><button type="button" class="${"btn " + escape(buttonNeutral, true)}">${escape(buttonTextCancel)}</button> <button type="submit" class="${"btn " + escape(buttonPositive, true)}">${escape(buttonTextSubmit)}</button></footer></form>` : ``}`}`}</div>` : `  <div class="${"modal contents " + escape($modalStore[0]?.modalClasses ?? "", true)}" data-testid="modal-component" role="dialog" aria-modal="true"${add_attribute("aria-label", $modalStore[0].title ?? "", 0)}${add_attribute("this", modalElement, 0)}>${currentComponent?.slot ? `${validate_component(currentComponent?.ref || missing_component, "svelte:component").$$render($$result, Object.assign({}, currentComponent?.props, { parent }), {}, {
    default: () => {
      return `<!-- HTML_TAG_START -->${currentComponent?.slot}<!-- HTML_TAG_END -->`;
    }
  })}` : `${validate_component(currentComponent?.ref || missing_component, "svelte:component").$$render($$result, Object.assign({}, currentComponent?.props, { parent }), {}, {})}`}</div>`}</div></div>` : ``}`;
});
const cBackdrop = "fixed top-0 left-0 right-0 bottom-0 flex";
const cDrawer = "overflow-y-auto transition-transform";
const Drawer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesPosition;
  let classesWidth;
  let classesHeight;
  let classesRounded;
  let classesBackdrop;
  let classesDrawer;
  let $drawerStore, $$unsubscribe_drawerStore;
  let $prefersReducedMotionStore, $$unsubscribe_prefersReducedMotionStore;
  $$unsubscribe_prefersReducedMotionStore = subscribe(prefersReducedMotionStore, (value) => $prefersReducedMotionStore = value);
  createEventDispatcher();
  let { position = "left" } = $$props;
  let { bgDrawer = "bg-surface-100-800-token" } = $$props;
  let { border = "" } = $$props;
  let { rounded = "" } = $$props;
  let { shadow = "shadow-xl" } = $$props;
  let { width = "" } = $$props;
  let { height = "" } = $$props;
  let { bgBackdrop = "bg-surface-backdrop-token" } = $$props;
  let { blur = "" } = $$props;
  let { padding = "" } = $$props;
  let { zIndex = "z-40" } = $$props;
  let { regionBackdrop = "" } = $$props;
  let { regionDrawer = "" } = $$props;
  let { labelledby = "" } = $$props;
  let { describedby = "" } = $$props;
  let { duration = 200 } = $$props;
  let { transitions = !$prefersReducedMotionStore } = $$props;
  let { opacityTransition = true } = $$props;
  const presets = {
    top: {
      alignment: "items-start",
      width: "w-full",
      height: "h-[50%]",
      rounded: "rounded-bl-container-token rounded-br-container-token"
    },
    bottom: {
      alignment: "items-end",
      width: "w-full",
      height: " h-[50%]",
      rounded: "rounded-tl-container-token rounded-tr-container-token"
    },
    left: {
      alignment: "justify-start",
      width: "w-[90%]",
      height: "h-full",
      rounded: "rounded-tr-container-token rounded-br-container-token"
    },
    right: {
      alignment: "justify-end",
      width: "w-[90%]",
      height: "h-full",
      rounded: "rounded-tl-container-token rounded-bl-container-token"
    }
  };
  let elemBackdrop;
  let elemDrawer;
  const drawerStore = getDrawerStore();
  $$unsubscribe_drawerStore = subscribe(drawerStore, (value) => $drawerStore = value);
  const propDefaults = {
    position,
    bgBackdrop,
    blur,
    padding,
    bgDrawer,
    border,
    rounded,
    shadow,
    width,
    height,
    opacityTransition,
    regionBackdrop,
    regionDrawer,
    labelledby,
    describedby,
    duration
  };
  function applyPropSettings(settings) {
    position = settings.position || propDefaults.position;
    bgBackdrop = settings.bgBackdrop || propDefaults.bgBackdrop;
    blur = settings.blur || propDefaults.blur;
    padding = settings.padding || propDefaults.padding;
    bgDrawer = settings.bgDrawer || propDefaults.bgDrawer;
    border = settings.border || propDefaults.border;
    rounded = settings.rounded || propDefaults.rounded;
    shadow = settings.shadow || propDefaults.shadow;
    width = settings.width || propDefaults.width;
    height = settings.height || propDefaults.height;
    regionBackdrop = settings.regionBackdrop || propDefaults.regionBackdrop;
    regionDrawer = settings.regionDrawer || propDefaults.regionDrawer;
    labelledby = settings.labelledby || propDefaults.labelledby;
    describedby = settings.describedby || propDefaults.describedby;
    opacityTransition = settings.opacityTransition || propDefaults.opacityTransition;
    duration = settings.duration || propDefaults.duration;
  }
  drawerStore.subscribe((settings) => {
    if (settings.open !== true) return;
    applyPropSettings(settings);
  });
  if ($$props.position === void 0 && $$bindings.position && position !== void 0) $$bindings.position(position);
  if ($$props.bgDrawer === void 0 && $$bindings.bgDrawer && bgDrawer !== void 0) $$bindings.bgDrawer(bgDrawer);
  if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0) $$bindings.shadow(shadow);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  if ($$props.bgBackdrop === void 0 && $$bindings.bgBackdrop && bgBackdrop !== void 0) $$bindings.bgBackdrop(bgBackdrop);
  if ($$props.blur === void 0 && $$bindings.blur && blur !== void 0) $$bindings.blur(blur);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.zIndex === void 0 && $$bindings.zIndex && zIndex !== void 0) $$bindings.zIndex(zIndex);
  if ($$props.regionBackdrop === void 0 && $$bindings.regionBackdrop && regionBackdrop !== void 0) $$bindings.regionBackdrop(regionBackdrop);
  if ($$props.regionDrawer === void 0 && $$bindings.regionDrawer && regionDrawer !== void 0) $$bindings.regionDrawer(regionDrawer);
  if ($$props.labelledby === void 0 && $$bindings.labelledby && labelledby !== void 0) $$bindings.labelledby(labelledby);
  if ($$props.describedby === void 0 && $$bindings.describedby && describedby !== void 0) $$bindings.describedby(describedby);
  if ($$props.duration === void 0 && $$bindings.duration && duration !== void 0) $$bindings.duration(duration);
  if ($$props.transitions === void 0 && $$bindings.transitions && transitions !== void 0) $$bindings.transitions(transitions);
  if ($$props.opacityTransition === void 0 && $$bindings.opacityTransition && opacityTransition !== void 0) $$bindings.opacityTransition(opacityTransition);
  classesPosition = presets[position].alignment;
  classesWidth = width ? width : presets[position].width;
  classesHeight = height ? height : presets[position].height;
  classesRounded = rounded ? rounded : presets[position].rounded;
  classesBackdrop = `${cBackdrop} ${bgBackdrop} ${padding} ${blur} ${classesPosition} ${regionBackdrop} ${zIndex} ${$$props.class ?? ""}`;
  classesDrawer = `${cDrawer} ${bgDrawer} ${border} ${rounded} ${shadow} ${classesWidth} ${classesHeight} ${classesRounded} ${regionDrawer}`;
  $$unsubscribe_drawerStore();
  $$unsubscribe_prefersReducedMotionStore();
  return ` ${$drawerStore.open === true ? `   <div class="${"drawer-backdrop " + escape(classesBackdrop, true)}" data-testid="drawer-backdrop"${add_attribute("this", elemBackdrop, 0)}>  <div class="${"drawer " + escape(classesDrawer, true)}" data-testid="drawer" role="dialog" aria-modal="true"${add_attribute("aria-labelledby", labelledby, 0)}${add_attribute("aria-describedby", describedby, 0)}${add_attribute("this", elemDrawer, 0)}> ${slots.default ? slots.default({}) : ``}</div></div>` : ``}`;
});
const panelOpen = writable(false);
function getId({ path, id }) {
  return `nav-link` + (id ? `-` + id : path.replaceAll("/", "-"));
}
const Navigation = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let currentPage;
  let $page, $$unsubscribe_page;
  let $user, $$unsubscribe_user;
  let $isLoggedIn, $$unsubscribe_isLoggedIn;
  let $userRoutes, $$unsubscribe_userRoutes;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_isLoggedIn = subscribe(isLoggedIn, (value) => $isLoggedIn = value);
  $$unsubscribe_userRoutes = subscribe(userRoutes, (value) => $userRoutes = value);
  currentPage = (route) => {
    if (route.children) {
      for (const child of route.children) {
        if ($page.url.pathname.includes(child.path)) {
          return "page";
        }
      }
      return void 0;
    }
    return $page.url.pathname.includes(route.path) ? "page" : void 0;
  };
  $$unsubscribe_page();
  $$unsubscribe_user();
  $$unsubscribe_isLoggedIn();
  $$unsubscribe_userRoutes();
  return `${validate_component(AppBar, "AppBar").$$render(
    $$result,
    {
      padding: "py-0 pl-2 pr-5",
      background: "bg-surface-50-900-token"
    },
    {},
    {
      trail: () => {
        return `<div id="user-session-avatar">${$user.privileges && $user.email && $isLoggedIn ? ` <button id="user-session-popout"><span class="avatar flex aspect-square justify-center items-center overflow-hidden isolate variant-ghost-primary hover:variant-ghost-secondary w-12 rounded-full text-2xl">${escape($user.email[0].toUpperCase())} <span class="sr-only">Logout user ${escape($user.email)}</span></span></button> <div class="card p-6 variant-surface border-surface-100-800-token text-center" data-popup="logoutClick"><p class="pb-6">${escape($user.email)}</p> <button id="user-logout-btn" class="btn variant-ringed-primary" title="Logout" data-svelte-h="svelte-1h2eb21">Logout</button></div>` : ` <button id="user-login-btn" title="Login" class="btn variant-ghost-primary hover:variant-filled-primary" data-svelte-h="svelte-1bhf3r0">Login</button>`}</div> `;
      },
      lead: () => {
        return `<a href="/" aria-current="page" data-testid="logo-home-link">${validate_component(Logo, "Logo").$$render($$result, { class: "mx-1" }, {}, {})}</a> `;
      },
      default: () => {
        return `<nav id="page-navigation"><ul>${each($userRoutes, (route) => {
          return `<li><a class="nav-link"${add_attribute("id", getId(route), 0)}${add_attribute("href", route.path, 0)}${add_attribute("aria-current", currentPage(route), 0)}>${escape(route.text)}</a> </li>`;
        })}</ul></nav>`;
      }
    }
  )}`;
});
const css$3 = {
  code: ".actions.svelte-1ek8jk2.svelte-1ek8jk2{flex:none}.card-header.svelte-1ek8jk2 .variable.svelte-1ek8jk2{overflow-wrap:break-word;overflow:auto}",
  map: '{"version":3,"file":"AddedFilter.svelte","sources":["AddedFilter.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { elasticInOut } from \\"svelte/easing\\";\\nimport { fade, scale, slide } from \\"svelte/transition\\";\\nimport { getModalStore } from \\"@skeletonlabs/skeleton\\";\\nimport { goto } from \\"$app/navigation\\";\\nimport { Option } from \\"$lib/models/GenomeFilter\\";\\nimport { removeFilter } from \\"$lib/stores/Filter\\";\\nimport { populateFromGeneFilter } from \\"$lib/stores/GeneFilter\\";\\nimport { populateFromSNPFilter } from \\"$lib/stores/SNPFilter\\";\\nimport AddFilter from \\"$lib/components/explorer/AddFilter.svelte\\";\\nconst modalStore = getModalStore();\\nexport let filter;\\nlet open = false;\\nlet carot = \\"fa-caret-up\\";\\nfunction editFilter() {\\n  if (filter.filterType === \\"genomic\\") {\\n    populateFromGeneFilter(filter);\\n    goto(\\"/explorer/genome-filter?edit=\\" + Option.Genomic);\\n  } else if (filter.filterType === \\"snp\\") {\\n    populateFromSNPFilter(filter);\\n    goto(\\"/explorer/genome-filter?edit=\\" + Option.SNP);\\n  } else {\\n    const modal = {\\n      type: \\"component\\",\\n      title: \\"Edit Filter\\",\\n      component: \\"modalWrapper\\",\\n      modalClasses: \\"bg-surface-100-800-token p-4 block\\",\\n      meta: { existingFilter: filter, component: AddFilter },\\n      response: (r) => {\\n        console.log(r);\\n      }\\n    };\\n    modalStore.trigger(modal);\\n  }\\n}\\nconst derivedFilterDescription = function(filter2) {\\n  if (filter2.filterType === \\"Categorical\\") {\\n    if (filter2.displayType === \\"restrict\\") {\\n      let valueText = filter2.categoryValues.length === 1 ? \\"value\\" : \\"values\\";\\n      return `Restricting to ${filter2.categoryValues.length} ${valueText}.`;\\n    } else if (filter2.displayType === \\"any\\" || filter2.displayType === \\"anyRecordOf\\") {\\n      return \\"Restricting to any value.\\";\\n    } else {\\n      return filter2.description;\\n    }\\n  } else if (filter2.filterType === \\"numeric\\") {\\n    switch (filter2.displayType) {\\n      case \\"any\\":\\n        return \\"Restricting to any value.\\";\\n      case \\"between\\":\\n        return `Restricting to between ${filter2.min} and ${filter2.max}.`;\\n      case \\"greaterThan\\":\\n        return `Restricting to greater than ${filter2.min}.`;\\n      case \\"lessThan\\":\\n        return `Restricting to less than ${filter2.max}.`;\\n      default:\\n        return filter2.description || \\"N/A\\";\\n    }\\n  } else if (filter2.filterType === \\"genomic\\" || filter2.filterType === \\"snp\\") {\\n    return filter2.description;\\n  }\\n};\\nconst derivedStudyDescription = function(filter2) {\\n  if (filter2.searchResult?.studyAcronym && filter2.searchResult?.dataset) {\\n    return `${filter2.searchResult.studyAcronym} (${filter2.searchResult.dataset})`;\\n  }\\n  return filter2.searchResult?.studyAcronym || filter2.searchResult?.dataset || \\"\\";\\n};\\nconst toggleCardBody = function() {\\n  open = !open;\\n  carot = open ? \\"fa-caret-down\\" : \\"fa-caret-up\\";\\n};\\nconst deleteFilter = function() {\\n  return removeFilter(filter.uuid);\\n};\\n<\/script>\\n\\n<div\\n  id={filter.uuid}\\n  class=\\"flex flex-col card p-1 m-1\\"\\n  in:scale={{ easing: elasticInOut }}\\n  out:fade={{ duration: 300 }}\\n  data-testid=\\"added-filter-{filter.id}\\"\\n>\\n  <header class=\\"card-header p-1 flex\\">\\n    <div\\n      class=\\"flex-auto variable\\"\\n      tabindex=\\"0\\"\\n      role=\\"button\\"\\n      on:click|preventDefault|stopPropagation={toggleCardBody}\\n      on:keydown|preventDefault|stopPropagation={(e) =>\\n        (e.key === \'Enter\' || e.key === \' \') && toggleCardBody}\\n    >\\n      {filter.variableName}\\n    </div>\\n    <div class=\\"actions\\">\\n      <button\\n        type=\\"button\\"\\n        title=\\"Edit Filter\\"\\n        class=\\"bg-initial text-black-500 hover:text-primary-600\\"\\n        on:click={editFilter}\\n      >\\n        <i class=\\"fa-solid fa-pen-to-square\\"></i>\\n        <span class=\\"sr-only\\">Edit Filter</span>\\n      </button>\\n      <button\\n        type=\\"button\\"\\n        title=\\"Remove Filter\\"\\n        class=\\"bg-initial text-black-500 hover:text-primary-600\\"\\n        on:click={deleteFilter}\\n      >\\n        <i class=\\"fa-solid fa-times-circle\\"></i>\\n        <span class=\\"sr-only\\">Remove Filter</span>\\n      </button>\\n      <button\\n        type=\\"button\\"\\n        title=\\"See details\\"\\n        class=\\"bg-initial text-black-500 hover:text-primary-600\\"\\n        on:click={toggleCardBody}\\n      >\\n        <i class=\\"fa-solid {carot}\\"></i>\\n        <span class=\\"sr-only\\">See details</span>\\n      </button>\\n    </div>\\n  </header>\\n  {#if open}\\n    <section class=\\"p-1 whitespace-pre-wrap\\" transition:slide={{ axis: \'y\' }}>\\n      {derivedFilterDescription(filter)}\\n      {derivedStudyDescription(filter)}\\n      {#if filter.filterType === \'Categorical\' && filter.displayType !== \'any\' && filter.displayType !== \'anyRecordOf\'}\\n        <div>Values: {filter.categoryValues.join(\', \')}</div>\\n      {/if}\\n    </section>\\n  {/if}\\n</div>\\n\\n<style>\\n  .actions {\\n    flex: none;\\n  }\\n  .card-header .variable {\\n    overflow-wrap: break-word;\\n    overflow: auto;\\n  }</style>\\n"],"names":[],"mappings":"AAwIE,sCAAS,CACP,IAAI,CAAE,IACR,CACA,2BAAY,CAAC,wBAAU,CACrB,aAAa,CAAE,UAAU,CACzB,QAAQ,CAAE,IACZ"}'
};
const AddedFilter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getModalStore();
  let { filter } = $$props;
  let carot = "fa-caret-up";
  if ($$props.filter === void 0 && $$bindings.filter && filter !== void 0) $$bindings.filter(filter);
  $$result.css.add(css$3);
  return `<div${add_attribute("id", filter.uuid, 0)} class="flex flex-col card p-1 m-1" data-testid="${"added-filter-" + escape(filter.id, true)}"><header class="card-header p-1 flex svelte-1ek8jk2"><div class="flex-auto variable svelte-1ek8jk2" tabindex="0" role="button">${escape(filter.variableName)}</div> <div class="actions svelte-1ek8jk2"><button type="button" title="Edit Filter" class="bg-initial text-black-500 hover:text-primary-600" data-svelte-h="svelte-1cm5pi5"><i class="fa-solid fa-pen-to-square"></i> <span class="sr-only">Edit Filter</span></button> <button type="button" title="Remove Filter" class="bg-initial text-black-500 hover:text-primary-600" data-svelte-h="svelte-92dgyi"><i class="fa-solid fa-times-circle"></i> <span class="sr-only">Remove Filter</span></button> <button type="button" title="See details" class="bg-initial text-black-500 hover:text-primary-600"><i class="${"fa-solid " + escape(carot, true) + " svelte-1ek8jk2"}"></i> <span class="sr-only" data-svelte-h="svelte-dql1wg">See details</span></button></div></header> ${``} </div>`;
});
const ExportedVariable = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { variable } = $$props;
  if ($$props.variable === void 0 && $$bindings.variable && variable !== void 0) $$bindings.variable(variable);
  return `<div${add_attribute(
    "id",
    variable.studyId ? `${variable.studyId}-${variable.conceptPath}` : variable.conceptPath,
    0
  )} data-testid="${"added-export-" + escape(variable.conceptPath, true)}" class="flex flex-col card p-1 m-1"><header class="card-header p-1 flex"><div class="flex-auto">${escape(variable.display)}</div> <button type="button" title="Remove Export" class="btn-icon-color" aria-label="Remove Export" data-svelte-h="svelte-1t29e1u"><i class="fa-solid fa-times-circle"></i></button></header> </div>`;
});
const css$2 = {
  code: "hr.svelte-q6znbb{width:88%}",
  map: `{"version":3,"file":"ResultsPanel.svelte","sources":["ResultsPanel.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { branding, features, resources } from \\"$lib/configuration\\";\\nimport { slide, scale } from \\"svelte/transition\\";\\nimport { page } from \\"$app/stores\\";\\nimport FilterComponent from \\"$lib/components/explorer/results/AddedFilter.svelte\\";\\nimport ExportedVariable from \\"$lib/components/explorer/results/ExportedVariable.svelte\\";\\nimport CardButton from \\"$lib/components/buttons/CardButton.svelte\\";\\nimport { filters, hasGenomicFilter, clearFilters, totalParticipants } from \\"$lib/stores/Filter\\";\\nimport ExportStore from \\"$lib/stores/Export\\";\\nimport * as api from \\"$lib/api\\";\\nimport { ProgressRadial, getModalStore, getToastStore } from \\"@skeletonlabs/skeleton\\";\\nimport { elasticInOut } from \\"svelte/easing\\";\\nimport { onDestroy, onMount } from \\"svelte\\";\\nimport { afterNavigate, goto } from \\"$app/navigation\\";\\nimport { getQueryRequest } from \\"$lib/QueryBuilder\\";\\nimport { loadAllConcepts } from \\"$lib/services/hpds\\";\\nconst { exports, clearExports } = ExportStore;\\nconst modalStore = getModalStore();\\nconst toastStore = getToastStore();\\nconst ERROR_VALUE = \\"N/A\\";\\nlet unsubFilters;\\nlet totalPatients = 0;\\nlet triggerRefreshCount = Promise.resolve(0);\\nlet isOpenAccess = $page.url.pathname.includes(\\"/discover\\");\\nasync function getCount() {\\n  suffix = \\"\\";\\n  let request = getQueryRequest(!isOpenAccess, isOpenAccess ? resources.openHPDS : resources.hpds, isOpenAccess ? \\"CROSS_COUNT\\" : \\"COUNT\\");\\n  try {\\n    if (isOpenAccess) {\\n      const concepts = await loadAllConcepts();\\n      request.query.setCrossCountFields(concepts);\\n    }\\n    const count = await api.post(\\"picsure/query/sync\\", request);\\n    if (isOpenAccess) {\\n      let openTotalPatients = String(count[\\"\\\\\\\\_studies_consents\\\\\\\\\\"]);\\n      if (openTotalPatients.includes(\\" \\\\xB1\\")) {\\n        totalPatients = parseInt(openTotalPatients.split(\\" \\")[0]);\\n        suffix = openTotalPatients.split(\\" \\")[1];\\n        totalParticipants.set(totalPatients);\\n      } else {\\n        totalPatients = openTotalPatients;\\n        totalParticipants.set(openTotalPatients);\\n      }\\n    } else {\\n      totalParticipants.set(count);\\n      totalPatients = count;\\n    }\\n    return count;\\n  } catch (error) {\\n    if ($filters.length !== 0) {\\n      toastStore.trigger({\\n        message: branding?.explorePage?.filterErrorText,\\n        background: \\"variant-filled-error\\",\\n        autohide: false,\\n        hoverable: true\\n      });\\n    } else {\\n      toastStore.trigger({\\n        message: branding?.explorePage?.queryErrorText,\\n        background: \\"variant-filled-error\\"\\n      });\\n    }\\n    totalPatients = ERROR_VALUE;\\n    return 0;\\n  }\\n}\\nfunction clearFiltersModal() {\\n  modalStore.trigger({\\n    type: \\"confirm\\",\\n    title: \\"Clear All Filters\\",\\n    body: \\"Are you sure you want to clear all filters?\\",\\n    buttonTextConfirm: \\"Yes\\",\\n    buttonTextCancel: \\"No\\",\\n    response: (yes) => {\\n      if (yes) {\\n        clearFilters();\\n        clearExports();\\n      }\\n    }\\n  });\\n}\\n$: suffix = \\"\\";\\n$: hasFilterOrExport = $filters.length !== 0 || features.explorer.exportsEnableExport && $exports.length !== 0;\\n$: showExportButton = features.explorer.allowExport && !isOpenAccess && totalPatients !== ERROR_VALUE && totalPatients !== 0 && hasFilterOrExport;\\n$: showExplorerDistributions = !isOpenAccess && features.explorer.distributionExplorer && $filters.length !== 0 && !$filters.every((filter) => filter.filterType === \\"genomic\\" || filter.filterType === \\"snp\\");\\n$: showDiscoverDistributions = isOpenAccess && features.discoverFeautures.distributionExplorer && $filters.length !== 0;\\n$: showVariantExplorer = !isOpenAccess && features.explorer.variantExplorer && $hasGenomicFilter;\\n$: showToolSuite = totalPatients !== 0 && ($filters.length !== 0 || $exports.length !== 0) && (showExplorerDistributions || showDiscoverDistributions || showVariantExplorer);\\nonMount(async () => {\\n  unsubFilters = filters.subscribe(() => {\\n    triggerRefreshCount = getCount();\\n  });\\n});\\nafterNavigate(async () => {\\n  isOpenAccess = $page.url.pathname.includes(\\"/discover\\");\\n  const isExplorer = $page.url.pathname.includes(\\"/explorer\\");\\n  if (isExplorer || isOpenAccess) {\\n    triggerRefreshCount = getCount();\\n  }\\n});\\nonDestroy(() => {\\n  unsubFilters && unsubFilters();\\n});\\n<\/script>\\n\\n<section\\n  id=\\"results-panel\\"\\n  class=\\"flex flex-col items-center pt-8 pr-10 w-64\\"\\n  transition:slide={{ axis: 'x' }}\\n>\\n  <div class=\\"flex flex-col items-center mt-2\\">\\n    {#await triggerRefreshCount}\\n      <ProgressRadial width=\\"w-6\\" />\\n    {:then}\\n      <span id=\\"result-count\\" class=\\"text-4xl\\">\\n        {#if totalPatients === ERROR_VALUE}\\n          <i class=\\"fa-solid fa-triangle-exclamation\\"></i>\\n          <span class=\\"sr-only\\">{ERROR_VALUE}</span>\\n        {:else}\\n          {totalPatients?.toLocaleString()} {suffix || ''}\\n        {/if}\\n      </span>\\n    {:catch}\\n      <span id=\\"result-count\\" class=\\"text-4xl\\">\\n        <i class=\\"fa-solid fa-triangle-exclamation\\"></i>\\n        <span class=\\"sr-only\\">{ERROR_VALUE}</span>\\n      </span>\\n    {/await}\\n    <h4 class=\\"text-center\\">{branding?.explorePage?.totalPatientsText}</h4>\\n  </div>\\n  {#if showExportButton}\\n    <div class=\\"h-11 mt-4\\">\\n      <button\\n        id=\\"export-data-button\\"\\n        type=\\"button\\"\\n        class=\\"btn variant-filled-primary\\"\\n        on:click={() => goto('/explorer/export')}\\n        transition:scale={{ easing: elasticInOut }}\\n      >\\n        Prepare for Analysis\\n      </button>\\n    </div>\\n  {/if}\\n  <div id=\\"export-filters\\" class=\\"flex flex-col items-center mt-7 w-80\\">\\n    <hr class=\\"!border-t-2\\" />\\n    <div class=\\"flex content-center mt-7\\">\\n      <h5 class=\\"text-xl flex-auto mr-2\\">Filtered Data Summary</h5>\\n      {#if hasFilterOrExport}\\n        <button\\n          data-testid=\\"clear-all-results-btn\\"\\n          class=\\"anchor text-sm flex-none\\"\\n          on:click={clearFiltersModal}>Reset</button\\n        >\\n      {/if}\\n    </div>\\n    {#if $filters.length === 0 && $exports.length === 0}\\n      <p class=\\"text-center\\">No filters added</p>\\n    {:else}\\n      <div class=\\"px-4 mb-1 w-80\\">\\n        {#if $filters.length !== 0}\\n          <header class=\\"text-left ml-1\\">Filters</header>\\n        {/if}\\n        <section class=\\"py-1\\">\\n          {#each $filters as filter}\\n            <FilterComponent {filter} />\\n          {/each}\\n        </section>\\n      </div>\\n    {/if}\\n    {#if $exports.length !== 0}\\n      <div class=\\"px-4 mb-1 w-80\\">\\n        <header class=\\"text-left ml-1\\" data-testid=\\"export-header\\">Added Variables</header>\\n        <section class=\\"py-1\\">\\n          {#each $exports as variable (variable.id)}\\n            <ExportedVariable {variable} />\\n          {/each}\\n        </section>\\n      </div>\\n    {/if}\\n  </div>\\n  {#if showToolSuite}\\n    <div class=\\"flex flex-col items-center mt-7\\">\\n      <hr class=\\"!border-t-2\\" />\\n      <h5 class=\\"text-center text-xl mt-7\\">Tool Suite</h5>\\n      <div class=\\"flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center\\">\\n        {#if showExplorerDistributions}\\n          <CardButton\\n            href=\\"/explorer/distributions\\"\\n            data-testid=\\"distributions-btn\\"\\n            title=\\"Variable Distributions\\"\\n            icon=\\"fa-solid fa-chart-pie\\"\\n            size=\\"md\\"\\n          />\\n        {/if}\\n        {#if showDiscoverDistributions}\\n          <CardButton\\n            href=\\"/discover/distributions\\"\\n            data-testid=\\"distributions-btn\\"\\n            title=\\"Variable Distributions\\"\\n            icon=\\"fa-solid fa-chart-pie\\"\\n            size=\\"md\\"\\n          />\\n        {/if}\\n        {#if showVariantExplorer}\\n          <CardButton\\n            href=\\"/explorer/variant\\"\\n            data-testid=\\"variant-explorer-btn\\"\\n            title=\\"Variant Explorer\\"\\n            icon=\\"fa-solid fa-dna\\"\\n            size=\\"md\\"\\n            active={$page.url.pathname.includes('explorer/variant')}\\n          />\\n        {/if}\\n      </div>\\n    </div>\\n  {/if}\\n</section>\\n\\n<style>\\n  hr {\\n    width: 88%;\\n  }</style>\\n"],"names":[],"mappings":"AA0NE,gBAAG,CACD,KAAK,CAAE,GACT"}`
};
const ERROR_VALUE = "N/A";
const ResultsPanel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let suffix;
  let hasFilterOrExport;
  let showExportButton;
  let showExplorerDistributions;
  let showDiscoverDistributions;
  let showVariantExplorer;
  let showToolSuite;
  let $page, $$unsubscribe_page;
  let $exports, $$unsubscribe_exports;
  let $filters, $$unsubscribe_filters;
  let $hasGenomicFilter, $$unsubscribe_hasGenomicFilter;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_hasGenomicFilter = subscribe(hasGenomicFilter, (value) => $hasGenomicFilter = value);
  const { exports, clearExports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  getModalStore();
  getToastStore();
  let totalPatients = 0;
  let triggerRefreshCount = Promise.resolve(0);
  let isOpenAccess = $page.url.pathname.includes("/discover");
  onDestroy(() => {
  });
  $$result.css.add(css$2);
  suffix = "";
  hasFilterOrExport = $filters.length !== 0 || features.explorer.exportsEnableExport;
  showExportButton = !isOpenAccess && totalPatients !== ERROR_VALUE && totalPatients !== 0 && hasFilterOrExport;
  showExplorerDistributions = !isOpenAccess && features.explorer.distributionExplorer && $filters.length !== 0 && !$filters.every((filter) => filter.filterType === "genomic" || filter.filterType === "snp");
  showDiscoverDistributions = isOpenAccess && features.discoverFeautures.distributionExplorer && $filters.length !== 0;
  showVariantExplorer = !isOpenAccess && features.explorer.variantExplorer && $hasGenomicFilter;
  showToolSuite = totalPatients !== 0;
  $$unsubscribe_page();
  $$unsubscribe_exports();
  $$unsubscribe_filters();
  $$unsubscribe_hasGenomicFilter();
  return `<section id="results-panel" class="flex flex-col items-center pt-8 pr-10 w-64"><div class="flex flex-col items-center mt-2">${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-6" }, {}, {})} `;
    }
    return function() {
      return ` <span id="result-count" class="text-4xl">${`${escape(totalPatients?.toLocaleString())} ${escape(suffix || "")}`}</span> `;
    }();
  }(triggerRefreshCount)} <h4 class="text-center">${escape(branding?.explorePage?.totalPatientsText)}</h4></div> ${showExportButton ? `<div class="h-11 mt-4"><button id="export-data-button" type="button" class="btn variant-filled-primary" data-svelte-h="svelte-1294s29">Prepare for Analysis</button></div>` : ``} <div id="export-filters" class="flex flex-col items-center mt-7 w-80"><hr class="!border-t-2 svelte-q6znbb"> <div class="flex content-center mt-7"><h5 class="text-xl flex-auto mr-2" data-svelte-h="svelte-d5qm8d">Filtered Data Summary</h5> ${hasFilterOrExport ? `<button data-testid="clear-all-results-btn" class="anchor text-sm flex-none" data-svelte-h="svelte-21cs5u">Reset</button>` : ``}</div> ${$filters.length === 0 && $exports.length === 0 ? `<p class="text-center" data-svelte-h="svelte-9i37eu">No filters added</p>` : `<div class="px-4 mb-1 w-80">${$filters.length !== 0 ? `<header class="text-left ml-1" data-svelte-h="svelte-1cu2api">Filters</header>` : ``} <section class="py-1">${each($filters, (filter) => {
    return `${validate_component(AddedFilter, "FilterComponent").$$render($$result, { filter }, {}, {})}`;
  })}</section></div>`} ${$exports.length !== 0 ? `<div class="px-4 mb-1 w-80"><header class="text-left ml-1" data-testid="export-header" data-svelte-h="svelte-qjz4w1">Added Variables</header> <section class="py-1">${each($exports, (variable) => {
    return `${validate_component(ExportedVariable, "ExportedVariable").$$render($$result, { variable }, {}, {})}`;
  })}</section></div>` : ``}</div> ${showToolSuite ? `<div class="flex flex-col items-center mt-7"><hr class="!border-t-2 svelte-q6znbb"> <h5 class="text-center text-xl mt-7" data-svelte-h="svelte-163m1l">Tool Suite</h5> <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">${showExplorerDistributions ? `${validate_component(CardButton, "CardButton").$$render(
    $$result,
    {
      href: "/explorer/distributions",
      "data-testid": "distributions-btn",
      title: "Variable Distributions",
      icon: "fa-solid fa-chart-pie",
      size: "md"
    },
    {},
    {}
  )}` : ``} ${showDiscoverDistributions ? `${validate_component(CardButton, "CardButton").$$render(
    $$result,
    {
      href: "/discover/distributions",
      "data-testid": "distributions-btn",
      title: "Variable Distributions",
      icon: "fa-solid fa-chart-pie",
      size: "md"
    },
    {},
    {}
  )}` : ``} ${showVariantExplorer ? `${validate_component(CardButton, "CardButton").$$render(
    $$result,
    {
      href: "/explorer/variant",
      "data-testid": "variant-explorer-btn",
      title: "Variant Explorer",
      icon: "fa-solid fa-dna",
      size: "md",
      active: $page.url.pathname.includes("explorer/variant")
    },
    {},
    {}
  )}` : ``}</div></div>` : ``} </section>`;
});
const css$1 = {
  code: "#side-panel-bar.svelte-43i7ew.svelte-43i7ew{display:flex;flex-direction:column;justify-content:top;width:42px;padding:0 0.25rem}#side-panel-bar.svelte-43i7ew #results-panel-toggle.svelte-43i7ew{margin-top:2.3rem}",
  map: `{"version":3,"file":"SidePanel.svelte","sources":["SidePanel.svelte"],"sourcesContent":["<script lang=\\"ts\\">import ExportStore from \\"$lib/stores/Export\\";\\nimport ResultsPanel from \\"$lib/components/explorer/results/ResultsPanel.svelte\\";\\nimport { onDestroy, onMount } from \\"svelte\\";\\nimport {} from \\"svelte/store\\";\\nimport { filters } from \\"$lib/stores/Filter\\";\\nimport { panelOpen } from \\"$lib/stores/SidePanel\\";\\nlet { exports } = ExportStore;\\nlet unsubFilterStore;\\nlet unsubExportStore;\\nfunction openPanel() {\\n  panelOpen.set(true);\\n}\\nonMount(() => {\\n  unsubFilterStore = filters.subscribe(() => {\\n    if ($filters?.length !== 0) {\\n      openPanel();\\n    }\\n  });\\n  unsubExportStore = ExportStore.subscribe(() => {\\n    if ($exports?.length !== 0) {\\n      openPanel();\\n    }\\n  });\\n});\\nonDestroy(() => {\\n  unsubFilterStore && unsubFilterStore();\\n  unsubExportStore && unsubExportStore();\\n});\\n<\/script>\\n\\n<div id=\\"side-panel\\" class=\\"flex {$panelOpen ? 'open-panel' : 'closed-panel'}\\">\\n  <div id=\\"side-panel-bar\\">\\n    <button\\n      type=\\"button\\"\\n      id=\\"results-panel-toggle\\"\\n      title=\\"{$panelOpen ? 'Hide' : 'Show'} Results\\"\\n      class=\\"btn-icon btn-icon-sm variant-ghost-primary hover:variant-filled-primary\\"\\n      aria-label=\\"Toggle Results Panel\\"\\n      on:click={() => {\\n        panelOpen.update((value) => !value);\\n      }}\\n    >\\n      <i class=\\"fa-solid {$panelOpen ? 'fa-arrow-right' : 'fa-arrow-left'}\\"></i>\\n    </button>\\n  </div>\\n  {#if $panelOpen}\\n    <ResultsPanel on:openPanel={openPanel} />\\n  {/if}\\n</div>\\n\\n<style>\\n  #side-panel-bar {\\n    display: flex;\\n    flex-direction: column;\\n    justify-content: top;\\n    width: 42px;\\n    padding: 0 0.25rem;\\n  }\\n  #side-panel-bar #results-panel-toggle {\\n    margin-top: 2.3rem;\\n  }</style>\\n"],"names":[],"mappings":"AAmDE,2CAAgB,CACd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,GAAG,CACpB,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,CAAC,CAAC,OACb,CACA,6BAAe,CAAC,mCAAsB,CACpC,UAAU,CAAE,MACd"}`
};
const SidePanel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_exports;
  let $$unsubscribe_filters;
  let $panelOpen, $$unsubscribe_panelOpen;
  $$unsubscribe_filters = subscribe(filters, (value) => value);
  $$unsubscribe_panelOpen = subscribe(panelOpen, (value) => $panelOpen = value);
  let { exports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => value);
  onDestroy(() => {
  });
  $$result.css.add(css$1);
  $$unsubscribe_exports();
  $$unsubscribe_filters();
  $$unsubscribe_panelOpen();
  return `<div id="side-panel" class="${"flex " + escape($panelOpen ? "open-panel" : "closed-panel", true)}"><div id="side-panel-bar" class="svelte-43i7ew"><button type="button" id="results-panel-toggle" title="${escape($panelOpen ? "Hide" : "Show", true) + " Results"}" class="btn-icon btn-icon-sm variant-ghost-primary hover:variant-filled-primary svelte-43i7ew" aria-label="Toggle Results Panel"><i class="${"fa-solid " + escape($panelOpen ? "fa-arrow-right" : "fa-arrow-left", true)}"></i></button></div> ${$panelOpen ? `${validate_component(ResultsPanel, "ResultsPanel").$$render($$result, {}, {}, {})}` : ``} </div>`;
});
const ModalWrapper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $modalStore, $$unsubscribe_modalStore;
  const modalStore = getModalStore();
  $$unsubscribe_modalStore = subscribe(modalStore, (value) => $modalStore = value);
  $$unsubscribe_modalStore();
  return `${$modalStore[0] ? `<div class="${"card p-4 " + escape($modalStore[0].meta.width || "w-modal", true) + " shadow-xl space-y-4"}"><header data-testid="modal-wrapper-header" class="text-2xl font-bold">${escape($modalStore[0].title || "")} <button class="float-right" data-svelte-h="svelte-1qlbhgo">×</button></header> ${validate_component($modalStore[0].meta.component || missing_component, "svelte:component").$$render($$result, {}, {}, {})}</div>` : ``}`;
});
const DashboardDrawer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $drawerStore, $$unsubscribe_drawerStore;
  const drawerStore = getDrawerStore();
  $$unsubscribe_drawerStore = subscribe(drawerStore, (value) => $drawerStore = value);
  const datasetId = $drawerStore.meta.row?.dataset_id || "";
  const title = $drawerStore.meta.row?.name || "";
  const link = $drawerStore.meta.row?.additional_info_link || "";
  async function getDataset() {
    const details = await getDatasetDetails(datasetId);
    if (!details || Object.keys(details).length === 0) throw new Error("No details found");
    if (details.datasetId) {
      delete details.datasetId;
    }
    if (details.studyFullname) {
      delete details.studyFullname;
    }
    return details;
  }
  $$unsubscribe_drawerStore();
  return `${title ? `<h2 data-testid="drawer-title" class="text-2xl font-bold ml-4">${escape(title)}</h2>` : ``} <hr class="m-4 border-t-2 border-gray-200"> ${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return ` <div class="flex justify-center items-center h-full">${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, {}, {}, {})}</div> `;
    }
    return function(details) {
      return ` <ul data-testid="drawer-details" class="m-4 p-4">${each(Object.entries(details), ([key, value]) => {
        return `${value ? `<li class="m-2"><strong class="capitalize">${escape(key.replace(/([A-Z])/g, " $1").toLowerCase().trim())}</strong>:
          ${Array.isArray(value) ? `<ul class="list-disc">${each(value, (item) => {
          return `${item ? `<li class="ml-8">${escape(item)}</li>` : ``}`;
        })} </ul>` : `${escape(value)}`} </li>` : ``}`;
      })}</ul> ${link ? `<div class="flex justify-center items-center mb-4"><a${add_attribute("href", link || "#", 0)} class="btn variant-ghost-primary hover:variant-filled-primary" target="_blank">More Info</a></div>` : ``} `;
    }(__value);
  }(getDataset())}`;
});
const FilterWarning = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let message;
  let backTo;
  let $modalStore, $$unsubscribe_modalStore;
  const identity = () => {
  };
  const modalStore = getModalStore();
  $$unsubscribe_modalStore = subscribe(modalStore, (value) => $modalStore = value);
  message = $modalStore[0]?.meta.message || "";
  backTo = $modalStore[0]?.meta.backTo || "";
  $modalStore[0]?.meta.resetQuery || identity;
  $$unsubscribe_modalStore();
  return `<section id="discover-error-container" class="flex gap-9 justify-center bg-surface-200 rounded-container-token"><aside data-testid="warning-alert" class="alert variant-ghost-warning"><i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i> <div class="alert-message"><h3 class="h3 text-left">${escape(message)}</h3> <p>Would you like to remove the invalid filters or go back to ${escape(backTo)}?</p> <div><div class="dark"><button class="btn variant-ringed hover:variant-filled-warning" data-svelte-h="svelte-1kcmrna">Remove Invalid Filters</button> <button class="btn variant-ringed hover:variant-filled-warning">Back to ${escape(backTo)}</button></div></div></div></aside></section>`;
});
const css = {
  code: "#right-panel-container.svelte-b1qgp3{height:100%}",
  map: '{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport { AppShell, Modal, Toast, Drawer, storePopup, getModalStore, getDrawerStore } from \\"@skeletonlabs/skeleton\\";\\nimport { computePosition, autoUpdate, offset, shift, flip, arrow } from \\"@floating-ui/dom\\";\\nimport { page } from \\"$app/stores\\";\\nimport { goto, beforeNavigate } from \\"$app/navigation\\";\\nimport { panelOpen } from \\"$lib/stores/SidePanel.ts\\";\\nimport { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter, removeGenomicFilters, removeUnallowedFilters, removeInvalidFilters } from \\"$lib/stores/Filter.ts\\";\\nimport Navigation from \\"$lib/components/Navigation.svelte\\";\\nimport SidePanel from \\"$lib/components/explorer/results/SidePanel.svelte\\";\\nimport ExportStepper from \\"$lib/components/explorer/export/ExportStepper.svelte\\";\\nimport Footer from \\"$lib/components/Footer.svelte\\";\\nimport ModalWrapper from \\"$lib/components/modals/ModalWrapper.svelte\\";\\nimport DashboardDrawer from \\"$lib/components/datatable/DashboardDrawer.svelte\\";\\nimport FilterWarning from \\"$lib/components/modals/FilterWarning.svelte\\";\\nimport hljs from \\"highlight.js/lib/core\\";\\nimport R from \\"highlight.js/lib/languages/r\\";\\nimport python from \\"highlight.js/lib/languages/python\\";\\nimport { storeHighlightJs } from \\"@skeletonlabs/skeleton\\";\\nimport \\"highlight.js/styles/obsidian.css\\";\\nconst modalStore = getModalStore();\\nconst drawerStore = getDrawerStore();\\nhljs.registerLanguage(\\"python\\", python);\\nhljs.registerLanguage(\\"r\\", R);\\nstoreHighlightJs.set(hljs);\\nstorePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });\\nconst modalComponentRegistry = {\\n  stepper: { ref: ExportStepper },\\n  modalWrapper: { ref: ModalWrapper },\\n  filterWarning: { ref: FilterWarning }\\n};\\nlet modalProps = {\\n  buttonPositive: \\"variant-filled-primary\\",\\n  buttonNeutral: \\"variant-ghost-primary\\",\\n  components: modalComponentRegistry\\n};\\nonMount(() => {\\n  document.body.classList.add(\\"started\\");\\n});\\n$: showSidebar = ($page.url.pathname.includes(\\"/explorer\\") || $page.url.pathname.includes(\\"/discover\\")) && !$page.url.pathname.includes(\\"/export\\") && !$page.url.pathname.includes(\\"/distributions\\");\\nbeforeNavigate(({ to, cancel }) => {\\n  const notAuthorized = to?.url.pathname.includes(\\"/explore\\") && $hasInvalidFilter;\\n  const stigmatizing = to?.url.pathname.includes(\\"/discover\\") && ($hasGenomicFilter || $hasUnallowedFilter);\\n  if (stigmatizing || notAuthorized) {\\n    let meta = {};\\n    if (stigmatizing) {\\n      meta = {\\n        message: \\"Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover\\",\\n        backTo: \\"Explore\\",\\n        resetQuery: () => {\\n          panelOpen.set(false);\\n          removeGenomicFilters();\\n          removeUnallowedFilters();\\n          goto(`/discover`);\\n        }\\n      };\\n    }\\n    if (notAuthorized) {\\n      meta = {\\n        message: \\"You are not authorized to access the data in Explore based on your selected filters.\\",\\n        backTo: \\"Discover\\",\\n        resetQuery: () => {\\n          panelOpen.set(false);\\n          removeInvalidFilters();\\n          goto(`/explorer`);\\n        }\\n      };\\n    }\\n    cancel();\\n    modalStore.trigger({\\n      type: \\"component\\",\\n      component: \\"filterWarning\\",\\n      meta\\n    });\\n  }\\n});\\n<\/script>\\n\\n<Toast position=\\"t\\" />\\n<Modal {...modalProps} />\\n<Drawer position=\\"right\\" width=\\"w-1/2\\" rounded=\\"rounded-none\\">\\n  {#if $drawerStore.id === \'dashboard-drawer\'}\\n    <DashboardDrawer />\\n  {/if}\\n</Drawer>\\n<AppShell>\\n  <svelte:fragment slot=\\"header\\">\\n    <Navigation />\\n  </svelte:fragment>\\n  <svelte:fragment slot=\\"sidebarRight\\">\\n    {#if showSidebar}\\n      <div id=\\"right-panel-container\\" class={\'flex\'}>\\n        <SidePanel />\\n      </div>\\n    {/if}\\n  </svelte:fragment>\\n  <slot />\\n  <svelte:fragment slot=\\"pageFooter\\">\\n    <Footer />\\n  </svelte:fragment>\\n</AppShell>\\n\\n<style>\\n  #right-panel-container {\\n    height: 100%;\\n  }</style>\\n"],"names":[],"mappings":"AAsGE,oCAAuB,CACrB,MAAM,CAAE,IACV"}'
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let showSidebar;
  let $$unsubscribe_hasUnallowedFilter;
  let $$unsubscribe_hasGenomicFilter;
  let $$unsubscribe_hasInvalidFilter;
  let $page, $$unsubscribe_page;
  let $drawerStore, $$unsubscribe_drawerStore;
  $$unsubscribe_hasUnallowedFilter = subscribe(hasUnallowedFilter, (value) => value);
  $$unsubscribe_hasGenomicFilter = subscribe(hasGenomicFilter, (value) => value);
  $$unsubscribe_hasInvalidFilter = subscribe(hasInvalidFilter, (value) => value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  getModalStore();
  const drawerStore = getDrawerStore();
  $$unsubscribe_drawerStore = subscribe(drawerStore, (value) => $drawerStore = value);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("r", R);
  storeHighlightJs.set(hljs);
  storePopup.set({
    computePosition,
    autoUpdate,
    offset,
    shift,
    flip,
    arrow
  });
  const modalComponentRegistry = {
    stepper: { ref: ExportStepper },
    modalWrapper: { ref: ModalWrapper },
    filterWarning: { ref: FilterWarning }
  };
  let modalProps = {
    buttonPositive: "variant-filled-primary",
    buttonNeutral: "variant-ghost-primary",
    components: modalComponentRegistry
  };
  $$result.css.add(css);
  showSidebar = ($page.url.pathname.includes("/explorer") || $page.url.pathname.includes("/discover")) && !$page.url.pathname.includes("/export") && !$page.url.pathname.includes("/distributions");
  $$unsubscribe_hasUnallowedFilter();
  $$unsubscribe_hasGenomicFilter();
  $$unsubscribe_hasInvalidFilter();
  $$unsubscribe_page();
  $$unsubscribe_drawerStore();
  return `${validate_component(Toast, "Toast").$$render($$result, { position: "t" }, {}, {})} ${validate_component(Modal, "Modal").$$render($$result, Object.assign({}, modalProps), {}, {})} ${validate_component(Drawer, "Drawer").$$render(
    $$result,
    {
      position: "right",
      width: "w-1/2",
      rounded: "rounded-none"
    },
    {},
    {
      default: () => {
        return `${$drawerStore.id === "dashboard-drawer" ? `${validate_component(DashboardDrawer, "DashboardDrawer").$$render($$result, {}, {}, {})}` : ``}`;
      }
    }
  )} ${validate_component(AppShell, "AppShell").$$render($$result, {}, {}, {
    pageFooter: () => {
      return `${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})} `;
    },
    sidebarRight: () => {
      return `${showSidebar ? `<div id="right-panel-container" class="${escape(null_to_empty("flex"), true) + " svelte-b1qgp3"}">${validate_component(SidePanel, "SidePanel").$$render($$result, {}, {}, {})}</div>` : ``} `;
    },
    header: () => {
      return `${validate_component(Navigation, "Navigation").$$render($$result, {}, {}, {})} `;
    },
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-gErfSyGv.js.map
