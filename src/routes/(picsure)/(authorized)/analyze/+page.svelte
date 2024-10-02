<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import { branding } from '$lib/configuration';
  import { CodeBlock, Tab, TabGroup } from '@skeletonlabs/skeleton';

  let tabSet: number = 0;
</script>

<svelte:head>
  <title>{branding.applicationName} | API</title>
</svelte:head>

<Content title="Prepare for Analysis with the PIC-SURE API">
  <section class="flex flex-col gap-8">
    <p class="mt-4">
      The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.
    </p>
    <p>
      To connect to the PIC-SURE Application Programming Interface (API), you will need your
      personal access token. Copy your token and save as a text file called “token.txt” in the
      working directory of your chosen analysis workspace, such as <a
        href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/home"
        target="_blank"
        title="BioData Catalyst Powered by Seven
      Bridges"
        class="anchor font-bold">BioData Catalyst Powered by Seven Bridges</a
      >
      or
      <a
        href="https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces"
        target="_blank"
        title="BioData Catalyst Powered by Terra"
        class="anchor font-bold">BioData Catalyst Powered by Terra</a
      >.
    </p>
    <div class="flex justify-center">
      <UserToken />
    </div>
    <p>
      To start your analysis, copy and execute the following code in an analysis environment, such
      as BioData Catalyst Powered by Seven Bridges or BioData Catalyst Powered by Terra, to connect
      to the PIC-SURE API. Note that you will need your personal access token to complete the
      connection.
    </p>
    <TabGroup class="card p-4">
      <Tab bind:group={tabSet} name="python" value={0}>Python</Tab>
      <Tab bind:group={tabSet} name="r" value={1}>R</Tab>
      <svelte:fragment slot="panel">
        {#if tabSet === 0}
          <CodeBlock
            language="python"
            lineNumbers={true}
            buttonCopied="Copied!"
            code={`# Requires python 3.6 or later
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

bdc = PicSureBdcAdapter.Adapter(PICSURE_network_URL, my_token)`}
          ></CodeBlock>
        {:else if tabSet === 1}
          <CodeBlock
            language="r"
            lineNumbers={true}
            code={`# Requires R 3.4 or later
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
session <- picsure::bdc.setResource(session = session,  resourceName = "AUTH")`}
          ></CodeBlock>
        {/if}
      </svelte:fragment>
    </TabGroup>
  </section>
  <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">
    {#each branding.apiPage.cards as card}
      <a
        href={card.link}
        target={card.link.startsWith('http') ? '_blank' : '_self'}
        class="pic-sure-info-card p-4 basis-2/4"
      >
        <div class="card card-hover">
          <header class="card-header flex flex-col items-center">
            <h4 class="my-1" data-testid={card.header}>{card.header}</h4>
            <hr class="!border-t-2" />
          </header>
          <section class="p-4 whitespace-pre-wrap flex flex-col" data-testid={card.body}>
            <div>{card.body}</div>
            <div class="flex justify-center">
              <div class="btn variant-filled-primary mt-3 w-fit">Learn More</div>
            </div>
          </section>
        </div>
      </a>
    {/each}
  </section>
</Content>

<style>
  a.pic-sure-info-card {
    max-width: 25rem;
    min-height: 18rem;
    margin: 0 8px;
  }
</style>
