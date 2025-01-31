<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import { branding } from '$lib/configuration';
  import { CodeBlock, Tab, TabGroup } from '@skeletonlabs/skeleton';
  import codeBlocks from '$lib/assets/codeBlocks.json';

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
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p>{@html branding.analysisConfig.instructions.connection}</p>
    <div class="flex justify-center"><UserToken /></div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p>{@html branding.analysisConfig.instructions.execution}</p>
    <TabGroup class="card p-4">
      <Tab bind:group={tabSet} name="python" value={0}>Python</Tab>
      <Tab bind:group={tabSet} name="r" value={1}>R</Tab>
      <svelte:fragment slot="panel">
        {#if tabSet === 0}
          <CodeBlock
            language="python"
            lineNumbers={true}
            buttonCopied="Copied!"
            code={codeBlocks?.bdcPythonAPI || 'Code not set'}
          ></CodeBlock>
        {:else if tabSet === 1}
          <CodeBlock language="r" lineNumbers={true} code={codeBlocks?.bdcRAPI || 'Code not set'}
          ></CodeBlock>
        {/if}
      </svelte:fragment>
    </TabGroup>
  </section>
  <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">
    {#each branding.analysisConfig.cards as card}
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
