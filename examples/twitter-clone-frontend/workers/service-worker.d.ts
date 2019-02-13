/* NOTE: When using reference types don't also use imports in the same file.
For some reason it breaks the ability to reference types in another file. */

interface WorkerNavigator {
  readonly serviceWorker: ServiceWorkerContainer;
}

interface ServiceWorkerContainer {
  readonly controller: ServiceWorker;
  readonly ready: Promise<ServiceWorkerRegistration>;
  oncontrollerchange: ((this: ServiceWorkerContainer, event: Event) => any) | null;
  onerror: ((this: ServiceWorkerContainer, event?: Event) => any) | null;
  onmessage: ((this: ServiceWorkerContainer, event: ServiceWorkerMessageEvent) => any) | null;
  getRegistration(scope?: string): Promise<ServiceWorkerRegistration>;
  getRegistrations(): Promise<ServiceWorkerRegistration[]>;
  register(
    url: string,
    options?: ServiceWorkerRegistrationOptions,
  ): Promise<ServiceWorkerRegistration>;
}

interface ServiceWorkerMessageEvent extends Event {
  readonly data: any;
  readonly lastEventId: string;
  readonly origin: string;
  readonly ports: ReadonlyArray<MessagePort> | null;
  readonly source: ServiceWorker | MessagePort | null;
}

interface ServiceWorkerRegistrationOptions {
  scope?: string;
}

// Client API

interface Client {
  readonly frameType: ClientFrameType;
  navigate(url: string): Promise<Client>;
  focus(): Promise<Client>;
}

type ClientFrameType = 'auxiliary' | 'top-level' | 'nested' | 'none';

// Events

interface ActivateEvent extends ExtendableEvent {}

interface InstallEvent extends ExtendableEvent {
  readonly activeWorker: ServiceWorker;
}

// Fetch API

interface Body {
  readonly body: ReadableStream;
}

interface Headers {
  entries(): string[][];
  keys(): string[];
  values(): string[];
}

interface Response extends Body {
  readonly useFinalURL: boolean;
  clone(): Response;
  error(): Response;
  redirect(): Response;
}

// Notification API

interface Notification {
  readonly actions: NotificationAction[];
  readonly requireInteraction: boolean;
  readonly silent: boolean;
  readonly tag: string;
  readonly renotify: boolean;
  readonly timestamp: number;
  readonly title: string;
  readonly vibrate: number[];
  close(): void;
  requestPermission(): Promise<string>;
}

interface NotificationAction {}

// ServiceWorkerGlobalScope

declare var clients: Clients;
declare var onactivate: ((event?: ActivateEvent) => any) | null;
declare var onfetch: ((event?: FetchEvent) => any) | null;
declare var oninstall: ((event?: InstallEvent) => any) | null;
declare var onnotificationclick: ((event?: NotificationEvent) => any) | null;
declare var onnotificationclose: ((event?: NotificationEvent) => any) | null;
declare var onpush: ((event?: PushEvent) => any) | null;
declare var onpushsubscriptionchange: (() => any) | null;
declare var onsync: ((event?: SyncEvent) => any) | null;
declare var registration: ServiceWorkerRegistration;
declare function skipWaiting(): void;

declare global {
  // tslint:disable-next-line:no-empty-interface
  declare interface WorkerGlobalScope extends ServiceWorkerGlobalScope {}
}
