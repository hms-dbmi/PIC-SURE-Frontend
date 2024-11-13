import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { E as Explorer } from './Explorer-BtHHi7CO.js';
import './lifecycle-GVhEEkqU.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './Row-CyujZUEb.js';
import './stores3-DsZ2QG0u.js';
import './Search-otDnaXFe.js';
import './dictionary--3HNnv1h.js';
import './User-DwYSDSFP.js';
import './index-DzcLzHBX.js';
import './Export-CQyK1aHM.js';
import 'uuid';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import './ProgressRadial-B9eVk9uU.js';
import './Filter-MdaGYKsz.js';
import './Searchbox-CdmC2p1u.js';
import './index4-WKGwQsfU.js';
import './ErrorAlert-DZROveXa.js';
import './stores-Bn6ceQfl.js';
import 'driver.js';

const searchTerm = "cardiac surgery";
const title = "Welcome to BioData Catalyst Powered by PIC-SURE";
const description = "BioData Catalyst Powered by PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE. <br /><br />Once the tour starts, you can click “Next” or use the arrow keys to navigate the tour. You can press any other key or click anywhere on the screen to escape the tour.";
const steps = [
  {
    element: "#explorer-search-box",
    popover: {
      title: "Search",
      description: 'Search clinical variables of interest. Here, the term "{{searchTerm}}" was used to get all results related to {{searchTerm}}.',
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
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#ExplorerTable-table #row-0",
    onHighlightStarted: "clickElement",
    popover: {
      title: "Variable Details",
      description: "To learn more about a variable, click on the row or click the information icon.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#ExplorerTable-table #active-row-0",
    popover: {
      title: "Variable Details",
      description: "This displays information about the variable, including dataset information and study information.",
      onPrevClick: "disablePrevious",
      onNextClick: "clickElementThenNext"
    }
  },
  {
    element: '#row-0 button[title="Filter"]',
    onHighlightStarted: "clickElement",
    popover: {
      title: "Apply Filters",
      description: "Click the filter icon to apply inclusion criteria to build your cohort.",
      onPrevClick: "disablePrevious"
    }
  },
  {
    element: "#active-row-0",
    popover: {
      title: "Apply Filters",
      description: "You can add filters by selecting different values or specifying a numeric range here, then clicking the “+” button.",
      onPrevClick: "disablePrevious",
      onNextClick: "applyFilterThenNext"
    }
  },
  {
    element: '#row-0 button[title="Add for Analysis"]',
    popover: {
      title: "Export Variable",
      description: "Click the export icon to add a variable to your export without applying a filter.",
      onPrevClick: "disablePrevious",
      onNextClick: "clickElementThenNext"
    }
  },
  {
    element: "#sidebar-right",
    popover: {
      title: "Cohort Summary",
      description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view variable distributions and prepare your cohort for analysis.",
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
const authTour = {
  searchTerm,
  title,
  description,
  steps
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-72bt5e_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Explorer</title>`, ""}<!-- HEAD_svelte-72bt5e_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { full: true }, {}, {
    default: () => {
      return `${validate_component(Explorer, "Explorer").$$render($$result, { tourConfig: authTour }, {}, {})}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CwhtPOaj.js.map
