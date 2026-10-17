<script lang="ts">
  import * as tos from '#lib/api/psama/tos.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import Editor from '#lib/ui/Editor.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';

  let terms: string = $state('');
  let original: string = $state('');
  let dirty: boolean = $derived(terms !== original);

  async function load() {
    terms = await tos.latest();
    original = terms;
  }

  async function onCommit() {
    await tos
      .update(terms)
      .then(() => {
        original = terms;
        toaster.success({ description: 'Terms have been successfully published.' });
      })
      .catch(() =>
        toaster.error({
          description:
            'An error occured while publishing these terms. Make a backup and try again or contact an administrator.',
        }),
      );
  }
</script>

{#await load()}
  <Loading />
{:then}
  <!-- No privilege check: PSAMA's /tos/update accepts ADMIN and SUPER_ADMIN, and the admin
       layout already limits this page to those users. -->
  <Editor fontOptions bind:content={terms} />
  <div class="flex justify-end">
    <ConfirmDialog
      title="Publish"
      size="third"
      data-testid="admin-terms-publish"
      triggerClass="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 mt-3"
      disabled={!dirty}
      onconfirm={onCommit}
    >
      {#snippet trigger()}Publish{/snippet}
      <div>
        Once published, these terms will be live and every user will be prompted to accept them on
        their next login.
      </div>
      <div class="mt-3">Do you wish to continue?</div>
    </ConfirmDialog>
  </div>
{:catch}
  <ErrorAlert title="API Error">
    An error occured while retrieving current terms of service.
  </ErrorAlert>
{/await}
