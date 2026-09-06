import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ToastMessage, ToastType } from "../types";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ShowToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastMessage, "id">>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 2000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const scheduleDismiss = useCallback((id: string, duration: number) => {
    if (duration <= 0) {
      return;
    }

    const existingTimer = timersRef.current.get(id);

    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, duration);

    timersRef.current.set(id, timer);
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title,
      description,
      duration = DEFAULT_DURATION,
    }: ShowToastOptions) => {
      const id = crypto.randomUUID();

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          title,
          description,
          duration,
        },
      ]);

      scheduleDismiss(id, duration);

      return id;
    },
    [scheduleDismiss],
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<ToastMessage, "id">>) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                ...updates,
              }
            : toast,
        ),
      );

      if (updates.duration !== undefined) {
        scheduleDismiss(id, updates.duration);
      }
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });

      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      updateToast,
      dismissToast,
    }),
    [showToast, updateToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="pointer-events-none fixed right-5 bottom-5 z-100 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{
              opacity: 0,
              y: 16,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.96,
            }}
            transition={{
              layout: {
                duration: 0.2,
                ease: "easeOut",
              },
              opacity: {
                duration: 0.18,
              },
              y: {
                duration: 0.22,
                ease: "easeOut",
              },
              scale: {
                duration: 0.18,
                ease: "easeOut",
              },
            }}
            className="pointer-events-auto"
          >
            <Toast toast={toast} onDismiss={onDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className="border-border-subtle bg-secondary text-text-primary pointer-events-auto rounded-xl border px-3.5 py-3 shadow-xl backdrop-blur-md"
      role={toast.type === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        <ToastIcon type={toast.type} />

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-semibold">{toast.title}</p>

          {toast.description && (
            <p className="text-text-secondary mt-0.5 text-xs leading-normal wrap-break-word">
              {toast.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-text-muted hover:text-text-primary shrink-0 rounded-lg p-1 transition-colors"
          aria-label="Dismiss notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "loading") {
    return (
      <Loader2Icon className="text-accent mt-0.5 h-5 w-5 shrink-0 animate-spin" />
    );
  }

  if (type === "success") {
    return (
      <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
    );
  }

  if (type === "error") {
    return (
      <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
    );
  }

  return <InfoIcon className="text-text-muted mt-0.5 h-5 w-5 shrink-0" />;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
