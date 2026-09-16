// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import type { FormSchema, FieldSchema } from '$lib/utilities/Validation';

// Fields invented purely for this test, decoupled from configuration.json's
// register.additionalFormValues (which is a per-deployment branding fixture, not a
// stable contract) - one field per path FormField/Validation support: select,
// multiselect (array), text+between, text+regex.
const dummyAdditionalFields: FormSchema = vi.hoisted(() => ({
  favoriteColor: {
    label: 'Favorite Color',
    placeholder: 'Select a color',
    section: 'Extra details',
    type: 'select',
    rules: 'string|required',
    options: [
      { key: 'red', value: 'red', text: 'Red' },
      { key: 'blue', value: 'blue', text: 'Blue' },
    ],
  },
  topics: {
    label: 'Topics of Interest',
    help: 'Pick everything relevant.',
    section: 'Extra details',
    width: 'full',
    type: 'multiselect',
    rules: 'array|required',
    options: [
      { key: 'alpha', value: 'alpha', text: 'Alpha' },
      { key: 'beta', value: 'beta', text: 'Beta' },
    ],
  },
  nickname: {
    label: 'Nickname',
    placeholder: 'Nickname',
    section: 'Extra details',
    rules: 'string|required|between:1,10',
  },
  referralCode: {
    label: 'Referral Code',
    placeholder: 'ABC-1234',
    section: 'Extra details',
    rules: ['string', 'required', 'regex:/^[A-Z]{3}-[0-9]{4}$/'],
  },
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    branding: {
      register: {
        additionalFormValues: dummyAdditionalFields,
        intro: { title: '', description: '' },
        success: '',
      },
    },
  },
  resetConfig: () => {},
}));

vi.mock('$lib/stores/Users', () => ({
  registerUser: vi.fn(() => ({ uuid: 'test-uuid' })),
}));

import RegisterForm from '$lib/components/register/RegisterForm.svelte';
import { defaultRegisterFormFields } from '$lib/models/User';

const allFields: [string, FieldSchema][] = Object.entries({
  ...defaultRegisterFormFields,
  ...dummyAdditionalFields,
});

function fillValue(name: string, field: FieldSchema, container: HTMLElement) {
  if (field.type === 'multiselect') {
    const option = field.options?.[0];
    if (option) fireEvent.click(screen.getByRole('checkbox', { name: option.text }));
    return;
  }
  if (field.type === 'select') {
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: field.options?.[0]?.value ?? '' } });
    return;
  }
  const validValues: Record<string, string> = {
    email: 'name@example.com',
    referralCode: 'ABC-1234',
  };
  const input = container.querySelector('input') as HTMLInputElement;
  fireEvent.input(input, { target: { value: validValues[name] ?? 'Test' } });
}

function fillAllValid(except: string[] = []) {
  for (const [name, field] of allFields) {
    if (except.includes(name)) continue;
    fillValue(name, field, screen.getByTestId(`register-field-${name}`));
  }
}

async function submit() {
  await fireEvent.click(screen.getByRole('button', { name: 'Register' }));
}

describe('RegisterForm with dummy additionalFormValues', () => {
  beforeEach(() => {
    // happy-dom has no Web Animations API; the help Popover's fade transition needs it
    Element.prototype.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    });
    render(RegisterForm);
  });

  allFields.forEach(([name, field]) => {
    it(`renders the ${field.label} field`, () => {
      const container = screen.getByTestId(`register-field-${name}`);
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent(field.label);
    });
  });

  it('shows help text for a field with a help message when its help icon is clicked', async () => {
    const helpId = 'register-field-topics-help';
    expect(screen.queryByTestId(`${helpId}-content`)).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId(`${helpId}-content-btn`));

    expect(screen.getByTestId(`${helpId}-content`)).toHaveTextContent('Pick everything relevant.');
  });

  it('submits with no validation errors when every default and dummy field is valid', async () => {
    fillAllValid();

    await submit();

    expect(document.querySelectorAll('[data-testid$="-error"]')).toHaveLength(0);
  });

  it('shows the custom format error for a dummy field with its own regex rule', async () => {
    fillAllValid(['referralCode']);
    fireEvent.input(screen.getByTestId('register-field-referralCode').querySelector('input')!, {
      target: { value: 'not-a-code' },
    });

    await submit();

    expect(screen.getByTestId('register-field-referralCode-error')).toHaveTextContent(
      /not a valid format/i,
    );
  });

  it('shows the custom length error for a dummy field with a between rule', async () => {
    fillAllValid(['nickname']);
    fireEvent.input(screen.getByTestId('register-field-nickname').querySelector('input')!, {
      target: { value: 'a'.repeat(11) },
    });

    await submit();

    expect(screen.getByTestId('register-field-nickname-error')).toHaveTextContent(
      /between 1 and 10/i,
    );
  });

  it('shows the custom selection error for the dummy multiselect field left empty', async () => {
    fillAllValid(['topics']);

    await submit();

    expect(screen.getByTestId('register-field-topics-error')).toHaveTextContent(
      /at least one selection/i,
    );
  });
});
