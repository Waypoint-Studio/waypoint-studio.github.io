import type { ReactElement } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ToastProvider } from '@/components/toast';
import { DashboardPage } from '@/pages/dashboard-page';
import { MessagesPage } from '@/pages/messages-page';
import { NewOrderPage } from '@/pages/new-order-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { OrderDetailPage } from '@/pages/order-detail-page';
import { OrdersPage } from '@/pages/orders-page';
import { PartsPage } from '@/pages/parts-page';
import { TrackingPage } from '@/pages/tracking-page';

export const App = (): ReactElement => (
  <ToastProvider>
    <HashRouter>
      <Routes>
        <Route path="/seguimiento/:code" element={<TrackingPage />} />
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="ordenes" element={<OrdersPage />} />
          <Route path="ordenes/nueva" element={<NewOrderPage />} />
          <Route path="ordenes/:id" element={<OrderDetailPage />} />
          <Route path="repuestos" element={<PartsPage />} />
          <Route path="mensajes" element={<MessagesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </ToastProvider>
);
