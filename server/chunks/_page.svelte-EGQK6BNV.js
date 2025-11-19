import { C as Content } from './Content-DMJk6TmZ.js';
import { U as UserToken } from './UserToken-rZOsbhyB.js';
import './index-DMPVr6nO.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './configuration-CBIXsjx2.js';
import './index2-Bp7szfwE.js';
import './Forms-DH01zSCL.js';
import './CopyButton-C8qhQbgh.js';
import './Popover-7q3Ft3Q-.js';
import '@floating-ui/dom';
import './HTML-1Mhr8hI4.js';
import 'dompurify';
import './html2-FW6Ia4bL.js';
import './Modal-dMSGxUC4.js';
import './Loading-DAyWVuL0.js';

function _page($$payload) {
  Content($$payload, {
    backUrl: "/analyze",
    title: "Analyze Example",
    children: ($$payload2) => {
      $$payload2.out.push(`<div class="w-full items-center mb-8"><div><h3>Follow these steps to start using the PIC-SURE Application Programming Interface (API) to
        search, filter, and export using Python or R code.</h3> <p class="svelte-wyuu31">The PIC-SURE Application Programming Interface (API) allows you to search, query, and export
        participant data in an analysis-ready data frame. Based on the coding language, the data
        will be exported as a Python or R data frame. This format allows researchers to kickstart
        their analysis by applying statistical and analytical functions or packages on this exported
        data frame.</p> <p class="mt-1 svelte-wyuu31">To use the PIC-SURE API, follow these three steps:</p> <ol class="list-decimal ml-12"><li>Set up your analysis workspace</li> <li>Get your Personal Access Token</li> <li>Start your research</li></ol> <h4 class="font-medium mt-8">1. Set up your analysis workspace</h4> <p class="svelte-wyuu31">First, you will need to set up your analysis workspace. This can be done in one of the
        BioData Catalyst cloud computing environments, Seven Bridges or Terra. Examples of how to
        programmatically access the PIC-SURE API with Python or R are publicly available. These
        include Jupyter notebooks and RStudio files, which you can access on the <a class="anchor" href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/tree/master/NHLBI_BioData_Catalyst" target="_blank">GitHub repository</a></p> <p class="svelte-wyuu31">The PIC-SURE team recommends starting with the PIC-SURE_101 example code. You can access
        these files in the <a class="anchor" href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui" target="_blank">Data Export from the PIC-SURE UI Seven Bridges Public Project</a> or using one of the <a class="anchor" href="https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces?tab=public&amp;filter=pic-sure" target="_blank">PIC-SURE Workspaces on Terra</a></p> <h4 class="font-medium mt-8">2. Get your Personal Access Token</h4> <p class="svelte-wyuu31">The personal access token serves as credentials to authenticate and authorize access to the
        PIC-SURE API. Retrieve your token below:</p> <div class="flex justify-center p-4">`);
      UserToken($$payload2);
      $$payload2.out.push(`<!----></div> <p class="svelte-wyuu31">When using the example code, copy and save this token according to the instructions.
        Otherwise, please save this token to connect to the PIC-SURE API.</p> <h4 class="font-medium mt-8">3. Start your research</h4> <p class="svelte-wyuu31">Now you're ready to start your research! Run the example code to connect to the PIC-SURE API
        and learn how to search for variables, build queries, and export data using code.</p></div></div>`);
    }
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-EGQK6BNV.js.map
