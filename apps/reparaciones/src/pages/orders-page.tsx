import { useDeferredValue, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { OrderRow } from '@/components/order-row';
import { Empty, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { STATUS_LABEL } from '@/domain/labels';
import { ORDER_STATUSES, type OrderFilter } from '@/domain/types';
import { useQuery } from '@/hooks/use-query';

type StatusFilter = NonNullable<OrderFilter['status']> | 'todos';

const FILTERS: readonly StatusFilter[] = ['activos', ...ORDER_STATUSES.filter((status) => status !== 'cancelado'), 'todos'];

const filterLabel = (filter: StatusFilter): string => {
  if (filter === 'activos') {
    return 'Activos';
  }
  return filter === 'todos' ? 'Todos' : STATUS_LABEL[filter];
};

const isFilter = (value: string | null): value is StatusFilter => FILTERS.includes(value as StatusFilter);

export const OrdersPage = (): ReactElement => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('estado');
  const status: StatusFilter = isFilter(raw) ? raw : 'activos';
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data, error, loading, reload } = useQuery(`orders:${status}:${deferredSearch}`, () =>
    api.listOrders({ ...(status === 'todos' ? {} : { status }), search: deferredSearch }),
  );

  return (
    <div className="page">
      <PageHeader
        title="Órdenes"
        subtitle="Busca por código, cliente, teléfono o equipo"
        action={
          <Link to="/ordenes/nueva" className="btn btn--primary">
            <Icon name="plus" size={18} />
            Recibir
          </Link>
        }
      />

      <label className="search">
        <Icon name="search" />
        <input
          type="search"
          placeholder="Ej: RC-1041, Laura, A54"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Buscar órdenes"
        />
      </label>

      <div className="chips" role="tablist" aria-label="Filtrar por estado">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={filter === status}
            className={`chip${filter === status ? ' chip--active' : ''}`}
            onClick={() => setParams(filter === 'activos' ? {} : { estado: filter })}
          >
            {filterLabel(filter)}
          </button>
        ))}
      </div>

      {error === null ? null : <ErrorBox message={error} onRetry={reload} />}
      {data === null && error === null ? <Spinner /> : null}
      {data !== null && data.length === 0 ? (
        <Empty title="No hay órdenes con ese filtro.">
          <p className="muted">Prueba con otro estado o borra la búsqueda.</p>
        </Empty>
      ) : null}
      {data !== null && data.length > 0 ? (
        <div className={`order-list${loading ? ' page--refreshing' : ''}`}>
          {data.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
