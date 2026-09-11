export interface UtcOption {
  instant: string;
  offset: string;
}

export interface LocalMinuteResolution {
  status: 'resolved' | 'ambiguous' | 'nonexistent' | 'invalid';
  options: UtcOption[];
}

interface LocalMinuteParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const LOCAL_MINUTE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function resolveLocalMinute(value: string, timeZone: string): LocalMinuteResolution {
  const parts = parseLocalMinute(value);
  if (!parts) return { status: 'invalid', options: [] };

  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    offsets.add(offsetMinutesAt(localAsUtc + hours * 60 * 60 * 1_000, timeZone));
  }

  const options = [...offsets]
    .map((offsetMinutes) => {
      const instant = localAsUtc - offsetMinutes * 60 * 1_000;
      return { instant, offsetMinutes };
    })
    .filter(({ instant }) => sameParts(zonedParts(instant, timeZone), parts))
    .sort((left, right) => left.instant - right.instant)
    .map(({ instant, offsetMinutes }) => ({
      instant: new Date(instant).toISOString(),
      offset: formatOffset(offsetMinutes),
    }));

  if (options.length === 0) return { status: 'nonexistent', options };
  return { status: options.length > 1 ? 'ambiguous' : 'resolved', options };
}

export function formatInstantAsLocalMinute(instant: string, timeZone: string): string {
  const parts = zonedParts(new Date(instant).getTime(), timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

function parseLocalMinute(value: string): LocalMinuteParts | null {
  const match = LOCAL_MINUTE.exec(value);
  if (!match) return null;
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const normalized = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );
  return normalized.getUTCFullYear() === parts.year &&
    normalized.getUTCMonth() + 1 === parts.month &&
    normalized.getUTCDate() === parts.day &&
    normalized.getUTCHours() === parts.hour &&
    normalized.getUTCMinutes() === parts.minute
    ? parts
    : null;
}

function zonedParts(instant: number, timeZone: string): LocalMinuteParts {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'iso8601',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function offsetMinutesAt(instant: number, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  return (
    (Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - instant) / 60_000
  );
}

function sameParts(left: LocalMinuteParts, right: LocalMinuteParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
