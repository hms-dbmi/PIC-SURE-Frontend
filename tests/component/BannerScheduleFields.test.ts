// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import BannerScheduleFields from '$lib/components/admin/configuration/BannerScheduleFields.svelte';

const props = {
  startLocal: '2026-09-10T12:00',
  endLocal: '2026-09-10T13:00',
  startChoice: '',
  endChoice: '',
  startResolution: null,
  endResolution: null,
  resolvedStart: '2026-09-10T12:00:00Z',
  resolvedEnd: '2026-09-10T13:00:00Z',
  disabled: false,
  description: 'Choose a start and end time.',
  startMissingError: true,
  restoreStartNotFuture: false,
};

describe('BannerScheduleFields', () => {
  it('marks an ambiguous time invalid until its UTC offset is chosen', async () => {
    const resolution = {
      status: 'ambiguous' as const,
      options: [
        { instant: '2026-11-01T05:30:00Z', offset: '-04:00' },
        { instant: '2026-11-01T06:30:00Z', offset: '-05:00' },
      ],
    };
    const ambiguous = {
      ...props,
      startLocal: '2026-11-01T01:30',
      startResolution: resolution,
      resolvedStart: null,
    };
    const view = render(BannerScheduleFields, { props: ambiguous });
    expect(screen.getByLabelText('Start')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox', { name: 'Start UTC offset' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await view.rerender({
      ...ambiguous,
      startChoice: resolution.options[0].instant,
      resolvedStart: resolution.options[0].instant,
    });

    expect(screen.getByLabelText('Start')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('combobox', { name: 'Start UTC offset' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('associates an invalid end time with its error and clears it when corrected', async () => {
    const view = render(BannerScheduleFields, { props });
    const end = screen.getByLabelText('End');
    expect(screen.getByLabelText('Start')).toHaveAttribute('aria-invalid', 'false');
    expect(end).toHaveAttribute('aria-invalid', 'false');

    await view.rerender({ ...props, resolvedEnd: '2026-09-10T11:00:00Z' });

    expect(end).toHaveAttribute('aria-invalid', 'true');
    expect(end).toHaveAccessibleDescription(/End must be after start/);
    expect(screen.getByText('End must be after start.').parentElement).toHaveAttribute(
      'aria-live',
      'polite',
    );

    await view.rerender(props);
    expect(end).toHaveAttribute('aria-invalid', 'false');
    expect(end).not.toHaveAccessibleDescription(/End must be after start/);
  });

  it('announces a missing required start through the persistent error span', async () => {
    const view = render(BannerScheduleFields, { props });
    const start = screen.getByLabelText('Start');
    const description = document.getElementById(start.getAttribute('aria-describedby')!);
    const error = description?.querySelector('[aria-live="polite"]');
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent('');
    expect(description).not.toHaveAttribute('aria-live');

    await view.rerender({ ...props, startLocal: '', resolvedStart: null });

    expect(start).toHaveAttribute('aria-invalid', 'true');
    expect(start).toHaveAccessibleDescription('A published banner needs a start time.');
    expect(error).toHaveTextContent('A published banner needs a start time.');
    expect(description?.querySelector('[aria-live="polite"]')).toBe(error);
  });

  it('requires a current UTC offset when a previous ambiguous time choice is stale', async () => {
    const startResolution = {
      status: 'ambiguous' as const,
      options: [
        { instant: '2026-11-01T05:15:00Z', offset: '-04:00' },
        { instant: '2026-11-01T06:15:00Z', offset: '-05:00' },
      ],
    };
    const endResolution = {
      status: 'ambiguous' as const,
      options: [
        { instant: '2026-11-01T05:30:00Z', offset: '-04:00' },
        { instant: '2026-11-01T06:30:00Z', offset: '-05:00' },
      ],
    };
    const ambiguous = {
      ...props,
      startLocal: '2026-11-01T01:15',
      endLocal: '2026-11-01T01:30',
      startResolution,
      endResolution,
      startChoice: '2025-11-02T05:15:00Z',
      endChoice: '2025-11-02T05:30:00Z',
      resolvedStart: null,
      resolvedEnd: null,
    };
    const view = render(BannerScheduleFields, { props: ambiguous });

    for (const name of ['Start', 'End']) {
      const field = screen.getByLabelText(name);
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('combobox', { name: `${name} UTC offset` })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(field).toHaveAccessibleDescription(
        `Choose a UTC offset for this ${name.toLowerCase()} time.`,
      );
      expect(
        screen.getByRole('combobox', { name: `${name} UTC offset` }),
      ).toHaveAccessibleDescription(`Choose a UTC offset for this ${name.toLowerCase()} time.`);
    }

    await view.rerender({
      ...ambiguous,
      startChoice: startResolution.options[0].instant,
      endChoice: endResolution.options[0].instant,
      resolvedStart: startResolution.options[0].instant,
      resolvedEnd: endResolution.options[0].instant,
    });

    for (const name of ['Start', 'End']) {
      expect(screen.getByLabelText(name)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByRole('combobox', { name: `${name} UTC offset` })).toHaveAttribute(
        'aria-invalid',
        'false',
      );
      expect(
        screen.queryByText(`Choose a UTC offset for this ${name.toLowerCase()} time.`),
      ).not.toBeInTheDocument();
    }
  });

  it('describes invalid ordering from the selected end offset', () => {
    render(BannerScheduleFields, {
      props: {
        ...props,
        startLocal: '2026-11-01T01:45',
        endLocal: '2026-11-01T01:30',
        resolvedStart: '2026-11-01T06:45:00Z',
        endChoice: '2026-11-01T06:30:00Z',
        resolvedEnd: '2026-11-01T06:30:00Z',
        endResolution: {
          status: 'ambiguous',
          options: [
            { instant: '2026-11-01T05:30:00Z', offset: '-04:00' },
            { instant: '2026-11-01T06:30:00Z', offset: '-05:00' },
          ],
        },
      },
    });

    expect(screen.getByRole('combobox', { name: 'End UTC offset' })).toHaveAccessibleDescription(
      /End must be after start\./,
    );
  });

  it('keeps changing valid UTC hints outside the live error spans', async () => {
    const view = render(BannerScheduleFields, { props });
    const descriptions = ['Start', 'End'].map((name) => {
      const field = screen.getByLabelText(name);
      return document.getElementById(field.getAttribute('aria-describedby')!)!;
    });
    const errors = descriptions.map((description) =>
      description.querySelector('[aria-live="polite"]'),
    );
    for (const description of descriptions) {
      expect(description).toHaveTextContent('Resolved UTC: 2026-09-10');
      expect(description.closest('[aria-live]')).toBeNull();
    }

    await view.rerender({
      ...props,
      startLocal: '2026-09-11T12:00',
      endLocal: '2026-09-11T13:00',
      resolvedStart: '2026-09-11T12:00:00Z',
      resolvedEnd: '2026-09-11T13:00:00Z',
    });

    for (const [index, description] of descriptions.entries()) {
      expect(description).toHaveTextContent('Resolved UTC: 2026-09-11');
      expect(description.querySelector('[aria-live="polite"]')).toBe(errors[index]);
      expect(errors[index]?.textContent?.trim()).toBe('');
    }
  });

  it.each([
    ['2026-09-10T12:00:00.000Z', '2026-09-10T12:00:00Z'],
    ['2026-09-10T12:00:00Z', '2026-09-10T12:00:00.000Z'],
  ])('rejects equal instants serialized as %s and %s', (resolvedStart, resolvedEnd) => {
    render(BannerScheduleFields, {
      props: { ...props, endLocal: props.startLocal, resolvedStart, resolvedEnd },
    });

    expect(screen.getByLabelText('End')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('End')).toHaveAccessibleDescription(/End must be after start\./);
  });
});
