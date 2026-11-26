import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Empty } from '@/components/ui';

export const NotFoundPage = (): ReactElement => (
  <Empty title="Esta página no existe.">
    <Link to="/" className="btn btn--primary">
      Ir al tablero
    </Link>
  </Empty>
);
