import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from 'node:worker_threads';
import {
  auditProvidedHtml,
  PrivateRunnerError,
  validateLocalReport,
  type LocalReport,
} from './core';

export const ANALYSIS_TIMEOUT_MS = 5_000;
export const ANALYSIS_HEAP_MIB = 128;
const WORKER_KIND = 'iswebmcp-provided-html-analysis-v1';

/** The same bundled file hosts a disposable worker; no child commands or input code run. */
export async function auditIsolated(
  bytes: Uint8Array,
  appId: string,
  timeoutMs = ANALYSIS_TIMEOUT_MS,
): Promise<LocalReport> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { kind: WORKER_KIND, bytes, appId },
      resourceLimits: {
        maxOldGenerationSizeMb: ANALYSIS_HEAP_MIB,
        maxYoungGenerationSizeMb: 16,
        stackSizeMb: 4,
      },
    });
    let settled = false;
    const finish = async (error?: PrivateRunnerError, report?: LocalReport) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        await worker.terminate();
      } catch {
        /* Worker may already have exited. */
      }
      if (error) reject(error);
      else if (report) resolve(report);
      else
        reject(
          new PrivateRunnerError(
            'ANALYSIS_FAILED',
            'The isolated analysis did not return complete evidence.',
          ),
        );
    };
    const timer = setTimeout(() => {
      void finish(
        new PrivateRunnerError(
          'ANALYSIS_LIMIT',
          'Analysis exceeded its time or memory limit. No report was written; reduce the exported artifact.',
        ),
      );
    }, timeoutMs);
    worker.once('error', (error) => {
      const memoryLimit =
        'code' in error && error.code === 'ERR_WORKER_OUT_OF_MEMORY';
      void finish(
        new PrivateRunnerError(
          memoryLimit ? 'ANALYSIS_LIMIT' : 'ANALYSIS_FAILED',
          memoryLimit
            ? 'Analysis exceeded its time or memory limit. No report was written; reduce the exported artifact.'
            : 'The isolated analysis failed. No source content or paths are included in this error.',
        ),
      );
    });
    worker.once('exit', () => {
      void finish();
    });
    worker.once('message', (message: unknown) => {
      try {
        if (!message || typeof message !== 'object' || !('ok' in message))
          throw new Error('invalid response');
        if (message.ok === true && 'report' in message) {
          void finish(undefined, validateLocalReport(message.report));
        } else if (
          message.ok === false &&
          'code' in message &&
          'message' in message &&
          typeof message.code === 'string' &&
          typeof message.message === 'string'
        ) {
          void finish(new PrivateRunnerError(message.code, message.message));
        } else throw new Error('invalid response');
      } catch {
        void finish(
          new PrivateRunnerError(
            'ANALYSIS_FAILED',
            'The isolated analysis did not return complete evidence.',
          ),
        );
      }
    });
  });
}

if (!isMainThread && workerData?.kind === WORKER_KIND) {
  try {
    parentPort?.postMessage({
      ok: true,
      report: auditProvidedHtml(workerData.bytes, workerData.appId),
    });
  } catch (error) {
    parentPort?.postMessage(
      error instanceof PrivateRunnerError
        ? { ok: false, code: error.code, message: error.message }
        : {
            ok: false,
            code: 'ANALYSIS_FAILED',
            message:
              'The isolated analysis failed. No source content or paths are included in this error.',
          },
    );
  }
}
