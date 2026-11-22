declare module "proper-lockfile" {
  interface RetryOptions {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
  }
  interface LockOptions {
    retries?: number | RetryOptions;
    stale?: number;
    update?: number;
    realpath?: boolean;
  }
  function lock(file: string, options?: LockOptions): Promise<() => Promise<void>>;
  function unlock(file: string, options?: LockOptions): Promise<void>;
  function check(file: string, options?: LockOptions): Promise<boolean>;
}
