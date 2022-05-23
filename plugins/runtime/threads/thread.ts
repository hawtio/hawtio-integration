namespace Runtime {

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

}
