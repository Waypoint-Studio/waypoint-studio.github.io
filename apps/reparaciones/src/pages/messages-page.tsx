import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { Card, Empty, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { formatDateTime } from '@/domain/labels';
import { useQuery } from '@/hooks/use-query';

export const MessagesPage = (): ReactElement => {
  const { data, error, reload } = useQuery('messages:all', () => api.listMessages());

  if (error !== null) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Mensajes enviados"
        subtitle="Avisos automáticos por WhatsApp. En esta demo son simulados: no se envía nada de verdad."
      />
      {data === null ? <Spinner /> : null}
      {data !== null && data.length === 0 ? <Empty title="Todavía no hay mensajes." /> : null}
      {data !== null && data.length > 0 ? (
        <Card className="card--flush">
          <ul className="message-log">
            {data.map((message) => (
              <li key={message.id}>
                <span className="message-log__icon">
                  <Icon name="whatsapp" size={18} />
                </span>
                <div>
                  <p className="message-log__head">
                    <span className="strong">{message.customerName}</span>
                    <Link to={`/ordenes/${message.orderId}`} className="message-log__code">
                      {message.orderCode}
                    </Link>
                    <span className="muted small">{formatDateTime(message.at)}</span>
                  </p>
                  <p className="message-log__text">{message.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
};
