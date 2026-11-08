import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { Snackbar } from './Snackbar';

interface SnackbarActions {
  showError: (message: string) => void;
  dismiss: () => void;
}

interface SnackbarHostState {
  message: string | null;
  activeHost: string | null;
  registerHost: (id: string) => () => void;
  dismiss: () => void;
}

const SnackbarActionsContext = createContext<SnackbarActions | null>(null);
const SnackbarHostContext = createContext<SnackbarHostState | null>(null);

/**
 * Mount once at the app root. Screens call `useSnackbar().showError(message)`.
 * Modals render their own host (see `ui/Modal`); the most recently mounted host
 * shows the message, so errors stay visible above an open modal.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [hosts, setHosts] = useState<string[]>([]);

  const showError = useCallback((next: string) => setMessage(next), []);
  const dismiss = useCallback(() => setMessage(null), []);
  const registerHost = useCallback((id: string) => {
    setHosts((current) => [...current, id]);
    return () => setHosts((current) => current.filter((host) => host !== id));
  }, []);

  const actions = useMemo(() => ({ showError, dismiss }), [showError, dismiss]);
  const host = useMemo(
    () => ({
      message,
      activeHost: hosts[hosts.length - 1] ?? null,
      registerHost,
      dismiss,
    }),
    [message, hosts, registerHost, dismiss],
  );

  return (
    <SnackbarActionsContext.Provider value={actions}>
      <SnackbarHostContext.Provider value={host}>
        {children}
        <SnackbarHost />
      </SnackbarHostContext.Provider>
    </SnackbarActionsContext.Provider>
  );
}

export function useSnackbar(): SnackbarActions {
  const actions = useContext(SnackbarActionsContext);
  if (!actions) throw new Error('useSnackbar must be used inside a SnackbarProvider');
  return actions;
}

/** Renders the snackbar when this host is the topmost one. Used by the provider and by `ui/Modal`. */
export function SnackbarHost() {
  const id = useId();
  const host = useContext(SnackbarHostContext);
  const registerHost = host?.registerHost;

  useLayoutEffect(() => registerHost?.(id), [id, registerHost]);

  if (!host || host.activeHost !== id) return null;
  return <Snackbar message={host.message} onDismiss={host.dismiss} />;
}
