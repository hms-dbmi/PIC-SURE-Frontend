<script lang="ts">
  import * as api from '#lib/api.ts';
  import { Psama } from '#lib/paths.ts';
  import { toaster } from '#lib/toaster.ts';

  import ErrorAlert from '#lib/components/ErrorAlert.svelte';
  import Loading from '#lib/components/Loading.svelte';
  import Editor from '#lib/components/editor/Editor.svelte';
  import Modal from '#lib/components/Modal.svelte';

  let terms: string = $state('');
  let original: string = $state('');
  let dirty: boolean = $derived(terms !== original);

  async function load() {
    terms = await api.get(Psama.TOS + '/latest');
    original = terms;
  }

  async function onCommit() {
    await api
      .post(Psama.TOS + '/update', terms, { 'Content-Type': 'text/html' })
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
    <Modal
      title="Publish"
      width="w-1/3"
      data-testid="publish-terms"
      triggerBase="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 mt-3"
      disabled={!dirty}
      withDefault={true}
      onconfirm={onCommit}
      cancelClass="border preset-tonal-error hover:preset-filled-error-500"
    >
      {#snippet trigger()}Publish{/snippet}
      <div>
        Once published, these terms will be live and every user will be prompted to accept them on
        their next login.
      </div>
      <div class="mt-3">Do you wish to continue?</div>
    </Modal>
  </div>
{:catch}
  <ErrorAlert title="API Error">
    An error occured while retrieving current terms of service.
  </ErrorAlert>
{/await}
