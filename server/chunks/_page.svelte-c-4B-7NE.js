import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-C099ZcAV.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { U as UserToken } from './UserToken-BOMdB7Zz.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { T as TabGroup, C as CodeBlock, a as Tab } from './CodeBlock-BfRczGon.js';
import './utils-EiTRXYbg.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './stores-BqdKqnkB.js';
import './index2-Bx7ZSImw.js';
import './stores2-DM9tzbse.js';
import './ProgressRadial-D8-DtAvy.js';
import './CopyButton-t8NdlniS.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const css = {
  code: "a.pic-sure-info-card.svelte-pjjuju{max-width:25rem;min-height:18rem;margin:0 8px}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Content from \\"$lib/components/Content.svelte\\";\\nimport UserToken from \\"$lib/components/UserToken.svelte\\";\\nimport { branding } from \\"$lib/configuration\\";\\nimport { CodeBlock, Tab, TabGroup } from \\"@skeletonlabs/skeleton\\";\\nlet tabSet = 0;\\n<\/script>\\n\\n<svelte:head>\\n  <title>{branding.applicationName} | API</title>\\n</svelte:head>\\n\\n<Content title=\\"Prepare for Analysis with the PIC-SURE API\\">\\n  <section class=\\"flex flex-col gap-8\\">\\n    <p class=\\"mt-4\\">\\n      The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of\\n      your choice. This API is available in both Python and R coding languages.\\n    </p>\\n    <p>\\n      To connect to the PIC-SURE Application Programming Interface (API), you will need your\\n      personal access token. Copy your token and save as a text file called “token.txt” in the\\n      working directory of your chosen analysis workspace, such as <a\\n        href=\\"https://platform.sb.biodatacatalyst.nhlbi.nih.gov/home\\"\\n        target=\\"_blank\\"\\n        title=\\"BioData Catalyst Powered by Seven\\n      Bridges\\"\\n        class=\\"anchor font-bold\\">BioData Catalyst Powered by Seven Bridges</a\\n      >\\n      or\\n      <a\\n        href=\\"https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces\\"\\n        target=\\"_blank\\"\\n        title=\\"BioData Catalyst Powered by Terra\\"\\n        class=\\"anchor font-bold\\">BioData Catalyst Powered by Terra</a\\n      >.\\n    </p>\\n    <div class=\\"flex justify-center\\">\\n      <UserToken />\\n    </div>\\n    <p>\\n      To start your analysis, copy and execute the following code in an analysis environment, such\\n      as BioData Catalyst Powered by Seven Bridges or BioData Catalyst Powered by Terra, to connect\\n      to the PIC-SURE API. Note that you will need your personal access token to complete the\\n      connection.\\n    </p>\\n    <TabGroup class=\\"card p-4\\">\\n      <Tab bind:group={tabSet} name=\\"python\\" value={0}>Python</Tab>\\n      <Tab bind:group={tabSet} name=\\"r\\" value={1}>R</Tab>\\n      <svelte:fragment slot=\\"panel\\">\\n        {#if tabSet === 0}\\n          <CodeBlock\\n            language=\\"python\\"\\n            lineNumbers={true}\\n            buttonCopied=\\"Copied!\\"\\n            code={\`# Requires python 3.6 or later\\nimport sys\\nimport pandas as pd\\nimport matplotlib.pyplot as plt\\n# BDC Powered by Terra users uncomment the following line to specify package install location\\n# sys.path.insert(0, r\\"/home/jupyter/.local/lib/python3.7/site-packages\\")\\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git\\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git\\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-biodatacatalyst-python-adapter-hpds.git\\nimport PicSureClient\\nimport PicSureBdcAdapter\\n# Set up connection to PIC-SURE API\\nPICSURE_network_URL = \\"https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure\\"\\ntoken_file = \\"token.txt\\"\\n\\nwith open(token_file, \\"r\\") as f:\\n    my_token = f.read()\\n\\nbdc = PicSureBdcAdapter.Adapter(PICSURE_network_URL, my_token)\`}\\n          ></CodeBlock>\\n        {:else if tabSet === 1}\\n          <CodeBlock\\n            language=\\"r\\"\\n            lineNumbers={true}\\n            code={\`# Requires R 3.4 or later\\n### Uncomment this code if you are not using the PIC-SURE environment in *BDC-Seven Bridges*, or if you do not have all the necessary dependencies installed.\\n#install.packages(\\"devtools\\")\\nSys.setenv(TAR = \\"/bin/tar\\")\\noptions(unzip = \\"internal\\")\\ndevtools::install_github(\\"hms-dbmi/pic-sure-r-adapter-hpds\\", ref=\\"main\\", force=T, quiet=FALSE)\\nlibrary(dplyr)\\nPICSURE_network_URL = \\"https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure\\"\\ntoken_file <- \\"token.txt\\"\\ntoken <- scan(token_file, what = \\"character\\")\\nsession <- picsure::bdc.initializeSession(PICSURE_network_URL, token)\\nsession <- picsure::bdc.setResource(session = session,  resourceName = \\"AUTH\\")\`}\\n          ></CodeBlock>\\n        {/if}\\n      </svelte:fragment>\\n    </TabGroup>\\n  </section>\\n  <section id=\\"info-cards\\" class=\\"w-full flex flex-wrap flex-row justify-center mt-6\\">\\n    {#each branding.apiPage.cards as card}\\n      <a\\n        href={card.link}\\n        target={card.link.startsWith('http') ? '_blank' : '_self'}\\n        class=\\"pic-sure-info-card p-4 basis-2/4\\"\\n      >\\n        <div class=\\"card card-hover\\">\\n          <header class=\\"card-header flex flex-col items-center\\">\\n            <h4 class=\\"my-1\\" data-testid={card.header}>{card.header}</h4>\\n            <hr class=\\"!border-t-2\\" />\\n          </header>\\n          <section class=\\"p-4 whitespace-pre-wrap flex flex-col\\" data-testid={card.body}>\\n            <div>{card.body}</div>\\n            <div class=\\"flex justify-center\\">\\n              <div class=\\"btn variant-filled-primary mt-3 w-fit\\">Learn More</div>\\n            </div>\\n          </section>\\n        </div>\\n      </a>\\n    {/each}\\n  </section>\\n</Content>\\n\\n<style>\\n  a.pic-sure-info-card {\\n    max-width: 25rem;\\n    min-height: 18rem;\\n    margin: 0 8px;\\n  }</style>\\n"],"names":[],"mappings":"AAuHE,CAAC,iCAAoB,CACnB,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,CAAC,CAAC,GACZ"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let tabSet = 0;
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-6qg1j1_START -->${$$result.title = `<title>${escape(branding.applicationName)} | API</title>`, ""}<!-- HEAD_svelte-6qg1j1_END -->`, ""} ${validate_component(Content, "Content").$$render(
      $$result,
      {
        title: "Prepare for Analysis with the PIC-SURE API"
      },
      {},
      {
        default: () => {
          return `<section class="flex flex-col gap-8"><p class="mt-4" data-svelte-h="svelte-sllq2c">The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.</p> <p data-svelte-h="svelte-hhfohy">To connect to the PIC-SURE Application Programming Interface (API), you will need your
      personal access token. Copy your token and save as a text file called “token.txt” in the
      working directory of your chosen analysis workspace, such as <a href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/home" target="_blank" title="BioData Catalyst Powered by Seven
      Bridges" class="anchor font-bold">BioData Catalyst Powered by Seven Bridges</a>
      or
      <a href="https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces" target="_blank" title="BioData Catalyst Powered by Terra" class="anchor font-bold">BioData Catalyst Powered by Terra</a>.</p> <div class="flex justify-center">${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})}</div> <p data-svelte-h="svelte-18y4mfq">To start your analysis, copy and execute the following code in an analysis environment, such
      as BioData Catalyst Powered by Seven Bridges or BioData Catalyst Powered by Terra, to connect
      to the PIC-SURE API. Note that you will need your personal access token to complete the
      connection.</p> ${validate_component(TabGroup, "TabGroup").$$render($$result, { class: "card p-4" }, {}, {
            panel: () => {
              return `${tabSet === 0 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                $$result,
                {
                  language: "python",
                  lineNumbers: true,
                  buttonCopied: "Copied!",
                  code: `# Requires python 3.6 or later
import sys
import pandas as pd
import matplotlib.pyplot as plt
# BDC Powered by Terra users uncomment the following line to specify package install location
# sys.path.insert(0, r"/home/jupyter/.local/lib/python3.7/site-packages")
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-biodatacatalyst-python-adapter-hpds.git
import PicSureClient
import PicSureBdcAdapter
# Set up connection to PIC-SURE API
PICSURE_network_URL = "https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure"
token_file = "token.txt"

with open(token_file, "r") as f:
    my_token = f.read()

bdc = PicSureBdcAdapter.Adapter(PICSURE_network_URL, my_token)`
                },
                {},
                {}
              )}` : `${tabSet === 1 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                $$result,
                {
                  language: "r",
                  lineNumbers: true,
                  code: `# Requires R 3.4 or later
### Uncomment this code if you are not using the PIC-SURE environment in *BDC-Seven Bridges*, or if you do not have all the necessary dependencies installed.
#install.packages("devtools")
Sys.setenv(TAR = "/bin/tar")
options(unzip = "internal")
devtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)
library(dplyr)
PICSURE_network_URL = "https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure"
token_file <- "token.txt"
token <- scan(token_file, what = "character")
session <- picsure::bdc.initializeSession(PICSURE_network_URL, token)
session <- picsure::bdc.setResource(session = session,  resourceName = "AUTH")`
                },
                {},
                {}
              )}` : ``}`} `;
            },
            default: () => {
              return `${validate_component(Tab, "Tab").$$render(
                $$result,
                { name: "python", value: 0, group: tabSet },
                {
                  group: ($$value) => {
                    tabSet = $$value;
                    $$settled = false;
                  }
                },
                {
                  default: () => {
                    return `Python`;
                  }
                }
              )} ${validate_component(Tab, "Tab").$$render(
                $$result,
                { name: "r", value: 1, group: tabSet },
                {
                  group: ($$value) => {
                    tabSet = $$value;
                    $$settled = false;
                  }
                },
                {
                  default: () => {
                    return `R`;
                  }
                }
              )}`;
            }
          })}</section> <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">${each(branding.apiPage.cards, (card) => {
            return `<a${add_attribute("href", card.link, 0)}${add_attribute("target", card.link.startsWith("http") ? "_blank" : "_self", 0)} class="pic-sure-info-card p-4 basis-2/4 svelte-pjjuju"><div class="card card-hover"><header class="card-header flex flex-col items-center"><h4 class="my-1"${add_attribute("data-testid", card.header, 0)}>${escape(card.header)}</h4> <hr class="!border-t-2"></header> <section class="p-4 whitespace-pre-wrap flex flex-col"${add_attribute("data-testid", card.body, 0)}><div>${escape(card.body)}</div> <div class="flex justify-center" data-svelte-h="svelte-1127l30"><div class="btn variant-filled-primary mt-3 w-fit">Learn More</div></div> </section></div> </a>`;
          })}</section>`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-c-4B-7NE.js.map
