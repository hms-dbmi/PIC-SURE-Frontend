<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { type UserRequest, defaultRegisterFormFields } from '$lib/models/User';
  import { registerUser } from '$lib/stores/Users';

  import type { FieldSchema, FormSchema } from '$lib/utilities/Validation';
  import { validateForm, validateField } from '$lib/utilities/Validation';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import FormField from '$lib/components/FormField.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { config } from '$lib/configuration.svelte';

  const intro = config.branding.register?.intro;
  const successMsg = config.branding.register?.success || '';
  const registerFormSchema: FormSchema = {
    ...defaultRegisterFormFields,
    ...(config.branding.register?.additionalFormValues || {}),
  };
  const sections = groupBySection(registerFormSchema);

  let values = $state<Record<string, string | string[]>>(
    Object.fromEntries(
      Object.entries(registerFormSchema).map(([name, field]) => [
        name,
        field.type === 'multiselect' ? [] : '',
      ]),
    ),
  );
  let errors = $state<Record<string, string>>({});
  let submitError = $state(false);
  let submitSuccess = $state(false);

  // Buckets fields by their optional `section`, in the order each section first
  // appears - fields with no section fall into their own ungrouped bucket(s) rather
  // than being merged together, so field order within the schema is always preserved.
  function groupBySection(
    schema: FormSchema,
  ): Array<{ section?: string; fields: Array<[string, FieldSchema]> }> {
    const groups: Array<{ section?: string; fields: Array<[string, FieldSchema]> }> = [];
    const bySection = new SvelteMap<string, Array<[string, FieldSchema]>>();
    for (const entry of Object.entries(schema)) {
      const section = entry[1].section;
      if (!section) {
        groups.push({ section: undefined, fields: [entry] });
        continue;
      }
      let fields = bySection.get(section);
      if (!fields) {
        fields = [];
        bySection.set(section, fields);
        groups.push({ section, fields });
      }
      fields.push(entry);
    }
    return groups;
  }

  function setValue(name: string, value: string | string[]) {
    values = { ...values, [name]: value };
    if (errors[name]) {
      const field = registerFormSchema[name];
      const error = validateField(value, field.rules, field.label);
      errors = { ...errors, [name]: error ?? '' };
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const formErrors = validateForm(registerFormSchema, values);
    errors = formErrors;
    if (Object.keys(formErrors).length > 0) return;

    const request: UserRequest = {
      email: values['email'] as string,
      acceptedTOS: true,
      generalMetadata: JSON.stringify(values),
      active: false,
    };

    submitError = false;
    try {
      await registerUser(request);
      submitSuccess = true;
    } catch (e) {
      submitError = true;
      console.error(e);
    }
  }
</script>

{#if intro?.title || intro?.description}
  <header class="mb-6">
    {#if intro.title}<h1 class="mb-2">{intro.title}</h1>{/if}
    {#if intro.description}
      <p class="max-w-prose text-surface-700-300">{intro.description}</p>
    {/if}
  </header>
{/if}

{#if !submitSuccess}
  {#if submitError}
    <ErrorAlert data-testid="register-form-error">
      {config.branding.register?.error || 'An error occured during submission'}
    </ErrorAlert>
  {/if}
  <form class="w-1/2" onsubmit={handleSubmit} novalidate>
    <div data-testid="register-form" class="flex flex-col gap-5 my-3">
      {#each sections as { section, fields } (section ?? fields[0]?.[0])}
        <fieldset class="card bg-surface-50-950 flex flex-col gap-5 p-6">
          {#if section}
            <legend class="-ml-1 px-1 text-xs font-bold tracking-wide text-primary-500 uppercase">
              {section}
            </legend>
          {/if}
          <div class="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            {#each fields as [name, field] (name)}
              <div class={field.width === 'full' ? 'sm:col-span-2' : ''}>
                <FormField
                  {name}
                  {field}
                  value={values[name]}
                  error={errors[name]}
                  onchange={(value) => setValue(name, value)}
                />
              </div>
            {/each}
          </div>
        </fieldset>
      {/each}

      <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="m-0 text-xs text-surface-600-400">
          All fields are required unless marked optional.
        </p>
        <button
          type="submit"
          class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
        >
          Register
        </button>
      </div>
    </div>
  </form>
{/if}

{#if submitSuccess}
  <div class="text-left p-2 left card bg-surface-50-950">
    {#if config.branding.register?.success}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(successMsg)}
    {:else}
      <p>Your account has been successfully created. What you should expect next:</p>
      <ol class="m-3 ml-8 list-disc">
        <li>An administrator will review your account.</li>
        <li>You will receive an email to create a password.</li>
        <li>Login and start your research!</li>
      </ol>
    {/if}
  </div>
{/if}
