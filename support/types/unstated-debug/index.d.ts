declare module 'unstated-debug' {
  import { Container, ContainerType } from 'unstated';
  interface Unstated {
    isEnabled: boolean;
    isCollapsed: boolean;
    logStateChanges: boolean;
    containers: Record<string, Container<any> | ContainerType<any>>;
    readonly states: Record<string, any>;
    readonly logState(): void;
  }

  const UNSTATED: Unstated;

  export = UNSTATED;

  declare global {
    interface Window {
      UNSTATED: Unstated;
    }
  }
}
