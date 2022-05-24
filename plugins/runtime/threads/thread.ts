namespace Runtime {

  export const STATE_LABELS = {
    BLOCKED: 'Blocked',
    NEW: 'New',
    RUNNABLE: 'Runnable',
    TERMINATED: 'Terminated',
    TIMED_WAITING: 'Timed waiting',
    WAITING: 'Waiting'
  };

  export class Thread {
    blockedCount: number;
    daemon: boolean;
    blockedTime: string;
    inNative: boolean;
    lockInfo: object;
    lockOwnerId: number;
    lockOwnerName: string;
    lockedMonitors: any[];
    lockedSynchronizers: any[];
    suspended: boolean;
    threadId: number;
    threadName: string;
    threadState: string;
    waitedCount: number;
    waitedTime: string;
    priority: number;
  }

  export function initThread(thread: any): void {
    thread.threadState = STATE_LABELS[thread.threadState];
    thread.waitedTime = thread.waitedTime > 0 ? Core.humanizeMilliseconds(thread.waitedTime) : '';
    thread.blockedTime = thread.blockedTime > 0 ? Core.humanizeMilliseconds(thread.blockedTime) : '';
  };

}
