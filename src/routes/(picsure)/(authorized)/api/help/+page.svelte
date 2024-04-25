<script lang="ts">
  import Content from '$lib/components/Content.svelte';
</script>

<Content>
  <div class="mb-8 text-center">
    <a class="float-left mr-2 text-primary-500" href="/api">
      <i class="btn btn-sm variant-ringed-primary fa-solid fa-angles-left mr-3 text-primary-500"
      ></i>Back
    </a>
    <h1>PIC-SURE Application Programming Interface (API)</h1>
  </div>

  <div class="my-2">
    <h2>What is the PICSURE API?</h2>
    <p>
      The <em
        >Patient-Centered Information Commons: Standardized Unification of Research Elements</em
      >
      (PIC-SURE) <em> Application Programming Interface</em> (API) is a powerful tool designed to simplify
      access to a diverse range of databases in the healthcare and research domains. These databases
      often have varying architectures and data organizations, presenting challenges for researchers
      looking to extract and interpret medical insights
    </p>
    <p>
      Despite the inherent diversity among these databases, the PIC-SURE API facilitates a seamless
      interaction with a wide range of data, providing researchers with a unified interface for
      database access. This approach significantly simplifies the data access process, empowering
      researchers to concentrate their efforts on research analysis and deriving valuable medical
      insights.
    </p>
  </div>

  <div class="img-placeholder border my-2">Placeholder image</div>

  <div class="grid grid-cols-3 divide-x my-2">
    <div class="col-span-2 px-4">
      <h2>Key Features</h2>
      <dl>
        <dt>Search and Query:</dt>
        <dd>
          Easily search and query the data using intuitive commands and syntax, allowing you to
          filter datasets based on specific criteria and keywords.
        </dd>
        <dt>Participant-Level Data:</dt>
        <dd>
          Access and export participant-level data, enabling you to conduct detailed analysis and
          exploration of individual participant data.
        </dd>
        <dt>Python and R:</dt>
        <dd>
          The API is available in Python and R, enabling researchers to query databases using their
          preferred coding language.
        </dd>
        <dt>Open Source:</dt>
        <dd>
          The PIC-SURE API is open source with an Apache 2.0 license, providing transparency,
          flexibility, and community-driven development.
        </dd>
      </dl>
    </div>
    <div class="px-4">
      <h2>More Information</h2>
      <ul class="list-disc ml-4">
        <li>
          <a
            target="_blank"
            href="https://app.gitbook.com/o/HwwUMljKAspjFDq5CK7G/s/G6504U3TjKPfCoTEdgY8/"
            >PIC-SURE User Guide</a
          >
        </li>
        <li>
          <a target="_blank" href="https://github.com/hms-dbmi/pic-sure"
            >PIC-SURE API GitHub repository</a
          >
        </li>
        <li>
          <a target="_blank" href="https://github.com/hms-dbmi/pic-sure-python-client"
            >Python client</a
          >
        </li>
        <li>
          <a target="_blank" href="https://github.com/hms-dbmi/pic-sure-python-adapter-hpds"
            >Python adapter</a
          >
        </li>
        <li>
          <a target="_blank" href="https://github.com/hms-dbmi/pic-sure-r-adapter-hpds">R adapter</a
          >
        </li>
        <li>
          <a
            target="_blank"
            href="https://github.com/hms-dbmi/pic-sure-r-adapter-hpds/blob/main/hpds.pdf"
            >R client</a
          >
        </li>
      </ul>
    </div>
  </div>

  <div class="text-right my-6">
    <a class="btn btn-lg variant-ringed-primary" href="/api/start">
      Get started using the PIC-Sure API <i class="fa-solid fa-angles-right ml-1 text-primary-500"
      ></i>
    </a>
  </div>
</Content>

<style>
  h1 {
    font-size: 2.25em;
  }
  h2 {
    font-size: 1.75em;
    margin: 0 0 0.5em;
  }
  p {
    display: block;
    margin: 1em;
  }
  .img-placeholder {
    width: 80%;
    margin: 3em auto;
    padding: 3em;
  }

  em {
    font-weight: bold;
  }
  dt {
    float: left;
    clear: left;
    font-weight: bold;
    margin: 0 0.3em 0 1em;
  }

  dd {
    padding: 0 1em 0.5em;
  }

  li {
    margin: 0 0.5em 1em;
  }
</style>
