<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
</script>

<Content>
  <div class="mb-8 text-center">
    <AngleButton class="float-left" href="/analyze">Back</AngleButton>
    <h1>Get Started with the PIC-SURE API</h1>
  </div>

  <div class="img-placeholder border my-2">Placeholder image</div>

  <div class="my-2">
    <h2>Personal User Token</h2>
    <p>
      The personal security token is a unique string of characters that serves as a credential to
      authenticate a specific user and grant them access to protected data or services via an API.
      Personal security tokens serve as a means of authenticating and authorizing access to
      sensitive information. Maintaining the privacy and security of your personal security token is
      essential.
    </p>
  </div>

  <div class="my-2">
    <h2>Accessing the PIC-SURE API</h2>
    <ul class="list-disc ml-4">
      <li>Copy your security token below</li>
      <li>
        Navigate to the analysis environment where you will be accessing data or running the example
        notebooks
      </li>
      <li>
        Create a file called <em>token.txt</em> and paste the user token into it. Save the file in the
        home folder
      </li>
    </ul>
  </div>

  <div class="my-2 flex justify-center">
    <UserToken />
  </div>

  <div class="my-2">
    <h2>PIC-SURE API Examples</h2>
    <p>
      Explore Python or R notebook examples available in the public GitHub repository. These
      examples showcase how to extract participant-level data from the NHANES (National Health and
      Nutrition Examination Survey) dataset and conduct an initial exploration and visualization of
      the data.
    </p>
    <ul class="list-disc ml-4">
      <li>
        <a
          target="_blank"
          href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/blob/master/AIM-AHEAD/NHANES_PICSURE_python.ipynb"
          >Python Example Notebook</a
        >
      </li>
      <li>
        <a
          target="_blank"
          href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/blob/master/AIM-AHEAD/NHANES_PICSURE_R.ipynb"
          >R Example Notebook</a
        >
      </li>
    </ul>
  </div>

  <div class="text-right my-6">
    <a class="btn btn-lg variant-ringed-primary" href="/analyze/help">
      What is the PIC-SURE API <i class="fa-solid fa-angles-right ml-1 text-primary-500"></i>
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
  li {
    margin: 0 0.5em 1em;
  }
</style>
