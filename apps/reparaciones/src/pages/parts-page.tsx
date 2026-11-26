import type { ReactElement } from 'react';
import { api } from '@/api/client';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { formatMoney } from '@/domain/labels';
import { useQuery } from '@/hooks/use-query';

export const PartsPage = (): ReactElement => {
  const { data, error, reload } = useQuery('parts', () => api.listParts());

  if (error !== null) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  return (
    <div className="page">
      <PageHeader title="Repuestos" subtitle="Se descuentan solos cuando se registran en una reparación" />
      {data === null ? (
        <Spinner />
      ) : (
        <Card className="card--flush">
          <table className="table">
            <thead>
              <tr>
                <th>Repuesto</th>
                <th className="num">Stock</th>
                <th className="num hide-sm">Costo</th>
                <th className="num">Precio</th>
                <th className="num hide-sm">Margen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((part) => (
                <tr key={part.id} className={part.stock <= part.minStock ? 'row--low' : ''}>
                  <td>
                    <span className="strong">{part.name}</span>
                    <span className="muted small block">{part.compatibleWith}</span>
                  </td>
                  <td className="num">
                    <span className={part.stock <= part.minStock ? 'stock-badge stock-badge--out' : 'stock-badge stock-badge--ok'}>{part.stock}</span>
                  </td>
                  <td className="num hide-sm">{formatMoney(part.cost)}</td>
                  <td className="num">{formatMoney(part.price)}</td>
                  <td className="num hide-sm">{Math.round(((part.price - part.cost) / part.price) * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
