<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
</script>

<Content backUrl="/analyze" title="Analyze Example">
  <div class="w-full items-center mb-8">
    <div>
      <h3>
        Follow these steps to start using the PIC-SURE Application Programming Interface (API) to
        search, filter, and export using Python or R code.
      </h3>
      <p>
        The PIC-SURE Application Programming Interface (API) allows you to search, query, and export
        participant data in an analysis-ready data frame. Based on the coding language, the data
        will be exported as a Python or R data frame. This format allows researchers to kickstart
        their analysis by applying statistical and analytical functions or packages on this exported
        data frame.
      </p>
      <p class="mt-1">To use the PIC-SURE API, follow these three steps:</p>
      <ol class="list-decimal ml-12">
        <li>Set up your analysis workspace</li>
        <li>Get your Personal Access Token</li>
        <li>Start your research</li>
      </ol>

      <h4 class="font-medium mt-8">1. Set up your analysis workspace</h4>
      <p>
        First, you will need to set up your analysis workspace. This can be done in one of the
        BioData Catalyst cloud computing environments, Seven Bridges or Terra. Examples of how to
        programmatically access the PIC-SURE API with Python or R are publicly available. These
        include Jupyter notebooks and RStudio files, which you can access on the
        <a
          class="anchor"
          href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API/tree/master/NHLBI_BioData_Catalyst"
          target="_blank">GitHub repository</a
        >
      </p>
      <p>
        The PIC-SURE team recommends starting with the PIC-SURE_101 example code. You can access
        these files in the
        <a
          class="anchor"
          href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui"
          target="_blank">Data Export from the PIC-SURE UI Seven Bridges Public Project</a
        >
        or using one of the
        <a
          class="anchor"
          href="https://terra.biodatacatalyst.nhlbi.nih.gov/#workspaces?tab=public&filter=pic-sure"
          target="_blank">PIC-SURE Workspaces on Terra</a
        >
      </p>

      <h4 class="font-medium mt-8">2. Get your Personal Access Token</h4>
      <p>
        The personal access token serves as credentials to authenticate and authorize access to the
        PIC-SURE API. Retrieve your token below:
      </p>
      <div class="flex justify-center p-4">
        <UserToken />
      </div>
      <p>
        When using the example code, copy and save this token according to the instructions.
        Otherwise, please save this token to connect to the PIC-SURE API.
      </p>

      <h4 class="font-medium mt-8">3. Start your research</h4>
      <p>
        Now you're ready to start your research! Run the example code to connect to the PIC-SURE API
        and learn how to search for variables, build queries, and export data using code.
      </p>
    </div>
  </div>
</Content>

<style lang="postcss">
  @reference "../../../../../../styles/app.css";

  p {
    @reference my-3;
  }
</style>
