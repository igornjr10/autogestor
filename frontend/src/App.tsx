import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { VehicleList } from './pages/vehicles/VehicleList';
import { VehicleForm } from './pages/vehicles/VehicleForm';
import { VehicleDetail } from './pages/vehicles/VehicleDetail';
import { ClientList } from './pages/clients/ClientList';
import { ClientForm } from './pages/clients/ClientForm';
import { ClientDetail } from './pages/clients/ClientDetail';
import { SaleForm } from './pages/sales/SaleForm';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CashflowPage } from './pages/cashflow/CashflowPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { FiliaisPage } from './pages/filiais/FiliaisPage';
import { NotificacoesPage } from './pages/notificacoes/NotificacoesPage';
import { ParcelasPage } from './pages/parcelas/ParcelasPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/caixa" element={<CashflowPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/filiais" element={<FiliaisPage />} />
                <Route path="/notificacoes" element={<NotificacoesPage />} />
                <Route path="/parcelas" element={<ParcelasPage />} />
                <Route path="/veiculos" element={<VehicleList />} />
                <Route path="/veiculos/novo" element={<VehicleForm />} />
                <Route path="/veiculos/:id" element={<VehicleDetail />} />
                <Route path="/veiculos/:id/editar" element={<VehicleForm />} />
                <Route path="/veiculos/:veiculoId/vender" element={<SaleForm />} />
                <Route path="/clientes" element={<ClientList />} />
                <Route path="/clientes/novo" element={<ClientForm />} />
                <Route path="/clientes/:id" element={<ClientDetail />} />
                <Route path="/clientes/:id/editar" element={<ClientForm />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
