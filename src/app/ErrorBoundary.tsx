import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { failed: false };

  public static getDerivedStateFromError(): State {
    return { failed: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ECHO ROOM initialization failed', error, info);
    }
  }

  public render() {
    if (this.state.failed) {
      return (
        <main className="system-screen" role="alert">
          <p className="eyebrow">SYSTEM ERROR</p>
          <h1>ゲームを開始できませんでした</h1>
          <p>
            ページを再読み込みしてください。改善しない場合は対応ブラウザをご確認ください。
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
