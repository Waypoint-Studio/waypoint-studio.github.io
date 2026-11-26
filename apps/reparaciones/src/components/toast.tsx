import { createContext, useCallback, useContext, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type { WhatsAppMessage } from '@/domain/types';
import { Icon } from '@/components/icons';

interface Toast {
  readonly id: number;
  readonly title: string;
  readonly body: string;
  readonly kind: 'whatsapp' | 'error' | 'info';
}

interface ToastApi {
  readonly notify: (title: string, body?: string) => void;
  readonly fail: (body: string) => void;
  readonly whatsapp: (message: WhatsAppMessage | null) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 6000;

export const ToastProvider = ({ children }: { readonly children: ReactNode }): ReactElement => {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(performance.now());
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    globalThis.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), DURATION_MS);
  }, []);

  const value = useMemo<ToastApi>(
    () => ({
      notify: (title, body = '') => push({ title, body, kind: 'info' }),
      fail: (body) => push({ title: 'No se pudo completar', body, kind: 'error' }),
      whatsapp: (message) => {
        if (message !== null) {
          push({ title: `WhatsApp enviado a ${message.customerName}`, body: message.text, kind: 'whatsapp' });
        }
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`}>
            {toast.kind === 'whatsapp' ? <Icon name="whatsapp" /> : <Icon name={toast.kind === 'error' ? 'alert' : 'check'} />}
            <div>
              <p className="toast__title">{toast.title}</p>
              {toast.body === '' ? null : <p className="toast__body">{toast.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};
