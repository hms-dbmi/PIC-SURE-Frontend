<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import { isAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import { addManualRole } from '$lib/stores/Roles';

  let studyId = $state('');
  let consentCode = $state('');
  let isSubmitting = $state(false);

  $effect(() => {
    if (!isSubmitting) {
      studyId = '';
      consentCode = '';
    }
  });

  async function createRole(event: SubmitEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    
    isSubmitting = true;
    let studyToSend = !consentCode ? studyId : studyId + consentCode;
    const encodedStudyId = encodeURI(studyToSend);
    
    if (encodedStudyId !== studyId) {
      toaster.error({
        title: 'Error: study-identifier contains invalid characters',
      });
      isSubmitting = false;
      return;
    }

    try {
      const newRole = await addManualRole(encodedStudyId);
      if (newRole) {
        toaster.success({
          title: `Role "${newRole.name}" added successfully`,
        });
      }
    } catch (error) {
      toaster.error({
        title: 'Error: Failed to add role',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | New Role</title>
</svelte:head>

<Content title="Manual Role">
  <form onsubmit={createRole}>
    <fieldset data-testid="manual-role-form" class="grid gap-4 my-3" disabled={!$isAdmin || isSubmitting}>
      <label class="label required">
        <span>Study with Consent Code (e.g. phs001514):</span>
        <input 
          type="text" 
          bind:value={studyId} 
          class="input" 
          required 
          minlength="1" 
          maxlength="255"
          pattern="[a-zA-Z0-9._-]+"
          title="Only letters, numbers, dots, underscores and hyphens are allowed"
        />
      </label>
      <label class="label">
        <span>Consent Code:</span>
        <input 
          type="text" 
          bind:value={consentCode} 
          class="input" 
          required 
          minlength="1" 
          maxlength="255"
          pattern="(\.c\d+)?"
          title="Consent code must be empty or a .c followed by numbers (e.g. .c1, .c23)"
        />
      </label>
      <button 
        class="btn preset-filled-primary-500" 
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding Role...' : 'Add Role'}
      </button>
    </fieldset>
  </form>
</Content>
