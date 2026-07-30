import path from 'path';
import type { Reporter, TestCase, TestResult, FullResult, Suite } from '@playwright/test/reporter';

// in onTestEnd:

type FailureEntry = {
  title: string;
  message: string;
  location: string,
};

class MinimalReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private failures: FailureEntry[] = [];
  private startMs = 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBegin(_config: unknown, _suite: Suite): void {
    this.startMs = Date.now();
    console.log('Running tests...');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed') {
      this.passed++;
    } else if (result.status === 'skipped') {
      this.skipped++;
    } else {
      this.failed++;
      const title = test.titlePath().slice(1).join(' > ').trim();
      const message = this.extractMessage(result).trim();
      // const location = test.location.file + ':' + test.location.line;
      const location = path.relative(process.cwd(), test.location.file) + ':' + test.location.line;
      this.failures.push({ title, message, location });
    }
  }

  onEnd(_result: FullResult): void {
    if (this.failures.length) {
      for (const { title, message, location } of this.failures) {
        console.log(`✗ ${location} ${title}`);
        if (message) {
          // Indent and cap the error body
          const lines = message.split('\n').slice(0, 8);
          for (const line of lines) {
            console.log(`    ${line}`);
          }
        }
        console.log('');
      }
    }

    const elapsed = ((Date.now() - this.startMs) / 1000).toFixed(1);
    const total = this.passed + this.failed + this.skipped;
    console.log([
      (this.passed ? `${this.passed} passed` : ''),
      (this.failed ? `${this.failed} failed` : ''),
      (this.skipped ? `${this.skipped} skipped` : ''),
      `${total} total tests in ${elapsed}s`
    ].filter(Boolean).join(' '));
  }

  private extractMessage(result: TestResult): string {
    // Prefer the first error's message; strip ANSI codes and stack frames
    const raw = result.errors[0]?.message ?? result.errors[0]?.value ?? '';
    return raw
      .replace(/\\x1b\[[0-9;]*m/g, '') // strip ANSI
      .replace(/\n\s+at .+/g, '') // strip stack frames
      .trim();
  }
}

export default MinimalReporter;
