import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { E as Explorer } from './Explorer-ChH7zbM0.js';
import './utils-EiTRXYbg.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './Row-DCE9feR7.js';
import './stores3-BdNELvYD.js';
import './Search-D-FrJ9_r.js';
import './dictionary-B6ttSChn.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';
import './Export-DDji5yGs.js';
import 'uuid';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import './Filter-DOEs1vKh.js';
import './AddFilter.svelte_svelte_type_style_lang-DfyN2jb3.js';
import './Searchbox-BqU5fuX3.js';
import './ProgressRadial-D8-DtAvy.js';
import './ErrorAlert-C4rfD0QC.js';
import './stores-BqdKqnkB.js';
import 'driver.js';

const searchTerm = "RECOVER";
const title = "Welcome to BioData Catalyst Powered by PIC-SURE";
const description = "BioData Catalyst Powered by PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE. This tour uses the Researching COVID to Enhance Recovery (RECOVER) dataset as an example. The RECOVER initiative is focused on understanding, diagnosing, treating, and preventing Long COVID. <br /><br />Once the tour starts, you can click “Next” or use the arrow keys to navigate the tour. You can press any other key or click anywhere on the screen to escape the tour.";
const steps = [
  {
    element: "#explorer-search-box",
    popover: {
      title: "Search",
      description: 'Search clinical variables of interest. Here, the term "{{searchTerm}}" was used to get all {{searchTerm}}-related results.',
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#facet-side-bar",
    popover: {
      title: "Refine Search",
      description: "Use the options displayed here to further refine your search results using facets.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#ExplorerTable-table",
    popover: {
      title: "Search Results",
      description: "The search results are displayed in this area. Each row describes a different variable that matches your search term and/or facets.",
      onPrevClick: "disablePrevious",
      onNextClick: "findAndSetFirstNonStigmatizedAvailableFilterThenNext"
    }
  },
  {
    element: "#ExplorerTable-table .non-stigmatized-row",
    onHighlightStarted: "clickElement",
    popover: {
      title: "Variable Details",
      description: "To learn more about a variable, click on the row or click the information icon.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#ExplorerTable-table .expandable-row",
    popover: {
      title: "Variable Details",
      description: "This displays information about the variable, including dataset information and study information.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: '#ExplorerTable-table .non-stigmatized-row button[title="Filter"]',
    onHighlightStarted: "clickElement",
    popover: {
      title: "Apply Filters",
      description: "Click the filter icon to apply inclusion criteria to build your cohort.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#ExplorerTable-table .expandable-row",
    popover: {
      title: "Apply Filters",
      description: "You can add filters by selecting different values or specifying a numeric range here, then clicking the “+” button.",
      onPrevClick: "disablePrevious",
      onNextClick: "applyFilterThenNext"
    }
  },
  {
    element: "#sidebar-right",
    popover: {
      title: "Cohort Summary",
      description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view variable distributions and counts per study. Note that this count is obfuscated to protect participant-level data.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#nav-link-help",
    onDeselected: "removeHighlightClass",
    popover: {
      title: "Help Resources",
      description: "To learn more about PIC-SURE, please consult the <a href='https://pic-sure.gitbook.io/nhlbi-biodata-catalyst-powered-by-pic-sure' class='anchor' target='_blank'>user guide</a> and <a href='https://www.youtube.com/playlist?list=PLJ6YccH8TEufZ5L-ctxzFF7vuZRLVacKw' class='anchor' target='_blank'>video</a> demonstrations. You can also find these resources on the help page.",
      onPrevClick: "disablePrevious"
    }
  }
];
const openTour = {
  searchTerm,
  title,
  description,
  steps
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-uhn8uu_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Discover</title>`, ""}<!-- HEAD_svelte-uhn8uu_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { full: true }, {}, {
    default: () => {
      return `${validate_component(Explorer, "Explorer").$$render($$result, { tourConfig: openTour }, {}, {})}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BsAR_zDP.js.map
