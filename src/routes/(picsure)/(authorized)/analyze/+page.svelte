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

<Content title="Analyze">
  <section class="flex flex-col gap-8">
    <p>
      To start your analysis, use the following code to connect to PIC-SURE. Note that you will need
      your personal access token below to complete the connection.
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
            code={`# Requires python 3.7 or later
import sys
import pandas as pd
import matplotlib.pyplot as plt
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git

import PicSureHpdsLib
import PicSureClient

token_file = "token.txt"
with open(token_file, "r") as f:
my_token = f.read()

connection = PicSureClient.Client.connect(url = PICSURE_network_URL, token = my_token)`}
          ></CodeBlock>
        {:else if tabSet === 1}
          <CodeBlock
            language="r"
            lineNumbers={true}
            code={`# Requires R 3.4 or later
install.packages("devtools")

devtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)
library(dplyr)

PICSURE_network_URL = "https://nhanes.hms.harvard.edu/picsure"
token_file <- "token.txt"
token <- scan(token_file, what = "character")
session <- picsure::bdc.initializeSession(PICSURE_network_URL, token)
session <- picsure::bdc.setResource(session = session)`}
          ></CodeBlock>
        {/if}
      </svelte:fragment>
    </TabGroup>
    <p>
      Copy your personal access token and save as a text file called “token.txt” in the same working
      directory to execute the code above.
    </p>
    <div class="flex justify-center">
      <UserToken />
    </div>
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
