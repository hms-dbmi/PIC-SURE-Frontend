import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UserToken } from './UserToken-Di9tipps.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores-CeRLSJyW.js';
import './index2-BVONNh3m.js';
import './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './CopyButton-BtLZ49Iw.js';
import './User-Clr_TyZW.js';
import './index-CvuFLVuQ.js';
import './configuration-wvkhv90d.js';
import './stores4-C3NPX6l0.js';

const css = {
  code: "p.svelte-14g8zny{margin-top:0.75rem;margin-bottom:0.75rem\n}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Content from \\"$lib/components/Content.svelte\\";\\nimport UserToken from \\"$lib/components/UserToken.svelte\\";\\n<\/script>\\n\\n<Content backUrl=\\"/analyze\\" title=\\"Analyze Example\\">\\n  <div class=\\"w-full flex flex-col items-center mb-8\\">\\n    <div>\\n      <h3>\\n        Follow these steps to start using the PIC-SURE Application Programming Interface (API) to\\n        search, filter, and export using Python or R code.\\n      </h3>\\n      <p>\\n        The PIC-SURE Application Programming Interface (API) allows you to search, query, and export\\n        participant data in an analysis-ready data frame. Based on the coding language, the data\\n        will be exported as a Python or R data frame. This format allows researchers to kickstart\\n        their analysis by applying statistical and analytical functions or packages on this exported\\n        data frame.\\n      </p>\\n      <p class=\\"mt-1\\">To use the PIC-SURE API, follow these three steps:</p>\\n      <ol class=\\"list-decimal ml-12\\">\\n        <li>Set up your analysis workspace</li>\\n        <li>Get your Personal Access Token</li>\\n        <li>Start your research</li>\\n      </ol>\\n\\n      <h4 class=\\"font-medium mt-8\\">1. Set up your analysis workspace</h4>\\n      <p>\\n        First, you will need to set up your analysis workspace. This can be done in one of the\\n        BioData Catalyst cloud computing environments, Seven Bridges or Terra. Examples of how to\\n        programmatically access the PIC-SURE API with Python or R are publicly available. These\\n        include Jupyter notebooks and RStudio files, which you can access on the\\n        <a\\n          class=\\"anchor\\"\\n          href=\\"https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/tree/master/NHLBI_BioData_Catalyst\\"\\n          target=\\"_blank\\">GitHub repository</a\\n        >\\n      </p>\\n      <p>\\n        The PIC-SURE team recommends starting with the PIC-SURE_101 example code. You can access\\n        these files in the\\n        <a\\n          class=\\"anchor\\"\\n          href=\\"https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui\\"\\n          target=\\"_blank\\">Data Export from the PIC-SURE UI Seven Bridges Public Project</a\\n        >\\n        or using one of the\\n        <a\\n          class=\\"anchor\\"\\n          href=\\"https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces?tab=public&filter=pic-sure\\"\\n          target=\\"_blank\\">PIC-SURE Workspaces on Terra</a\\n        >\\n      </p>\\n\\n      <h4 class=\\"font-medium mt-8\\">2. Get your Personal Access Token</h4>\\n      <p>\\n        The personal access token serves as credentials to authenticate and authorize access to the\\n        PIC-SURE API. Retrieve your token below:\\n      </p>\\n      <div class=\\"flex justify-center p-4\\">\\n        <UserToken />\\n      </div>\\n      <p>\\n        When using the example code, copy and save this token according to the instructions.\\n        Otherwise, please save this token to connect to the PIC-SURE API.\\n      </p>\\n\\n      <h4 class=\\"font-medium mt-8\\">3. Start your research</h4>\\n      <p>\\n        Now you're ready to start your research! Run the example code to connect to the PIC-SURE API\\n        and learn how to search for variables, build queries, and export data using code.\\n      </p>\\n    </div>\\n  </div>\\n</Content>\\n\\n<style lang=\\"postcss\\">\\n  p {\\n    margin-top: 0.75rem;\\n    margin-bottom: 0.75rem\\n}</style>\\n"],"names":[],"mappings":"AA4EE,gBAAE,CACA,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE;AACnB"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${validate_component(Content, "Content").$$render(
    $$result,
    {
      backUrl: "/analyze",
      title: "Analyze Example"
    },
    {},
    {
      default: () => {
        return `<div class="w-full flex flex-col items-center mb-8"><div><h3 data-svelte-h="svelte-14bjbcg">Follow these steps to start using the PIC-SURE Application Programming Interface (API) to
        search, filter, and export using Python or R code.</h3> <p class="svelte-14g8zny" data-svelte-h="svelte-1aqzci0">The PIC-SURE Application Programming Interface (API) allows you to search, query, and export
        participant data in an analysis-ready data frame. Based on the coding language, the data
        will be exported as a Python or R data frame. This format allows researchers to kickstart
        their analysis by applying statistical and analytical functions or packages on this exported
        data frame.</p> <p class="mt-1 svelte-14g8zny" data-svelte-h="svelte-1a565mg">To use the PIC-SURE API, follow these three steps:</p> <ol class="list-decimal ml-12" data-svelte-h="svelte-1fh49ia"><li>Set up your analysis workspace</li> <li>Get your Personal Access Token</li> <li>Start your research</li></ol> <h4 class="font-medium mt-8" data-svelte-h="svelte-1tiav2w">1. Set up your analysis workspace</h4> <p class="svelte-14g8zny" data-svelte-h="svelte-u58s8j">First, you will need to set up your analysis workspace. This can be done in one of the
        BioData Catalyst cloud computing environments, Seven Bridges or Terra. Examples of how to
        programmatically access the PIC-SURE API with Python or R are publicly available. These
        include Jupyter notebooks and RStudio files, which you can access on the
        <a class="anchor" href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/tree/master/NHLBI_BioData_Catalyst" target="_blank">GitHub repository</a></p> <p class="svelte-14g8zny" data-svelte-h="svelte-oaugdr">The PIC-SURE team recommends starting with the PIC-SURE_101 example code. You can access
        these files in the
        <a class="anchor" href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui" target="_blank">Data Export from the PIC-SURE UI Seven Bridges Public Project</a>
        or using one of the
        <a class="anchor" href="https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces?tab=public&amp;filter=pic-sure" target="_blank">PIC-SURE Workspaces on Terra</a></p> <h4 class="font-medium mt-8" data-svelte-h="svelte-134mu5q">2. Get your Personal Access Token</h4> <p class="svelte-14g8zny" data-svelte-h="svelte-1azg6yr">The personal access token serves as credentials to authenticate and authorize access to the
        PIC-SURE API. Retrieve your token below:</p> <div class="flex justify-center p-4">${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})}</div> <p class="svelte-14g8zny" data-svelte-h="svelte-17mukfo">When using the example code, copy and save this token according to the instructions.
        Otherwise, please save this token to connect to the PIC-SURE API.</p> <h4 class="font-medium mt-8" data-svelte-h="svelte-1s0qwfl">3. Start your research</h4> <p class="svelte-14g8zny" data-svelte-h="svelte-1kk7u86">Now you&#39;re ready to start your research! Run the example code to connect to the PIC-SURE API
        and learn how to search for variables, build queries, and export data using code.</p></div></div>`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Z-aq2ven.js.map
