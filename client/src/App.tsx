import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PageLoader } from './components/UI';
import { SiteLayout } from './components/dashboard/SiteLayout';
import { Landing } from './pages/Landing';
import { TemplateMarketplace } from './pages/TemplateMarketplace';
import { TemplateDetail } from './pages/TemplateDetail';
import { LoginPage, RegisterPage } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { PublishedSite } from './pages/PublishedSite';
import { SitePreview } from './pages/SitePreview';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { SiteOverview } from './pages/dashboard/SiteOverview';
import { SiteItems } from './pages/dashboard/SiteItems';
import { SiteOrders } from './pages/dashboard/SiteOrders';
import { SiteCustomers } from './pages/dashboard/SiteCustomers';
import { SiteInbox } from './pages/dashboard/SiteInbox';
import { SiteMedia } from './pages/dashboard/SiteMedia';
import { SiteDesign } from './pages/dashboard/SiteDesign';
import { SiteTemplates } from './pages/dashboard/SiteTemplates';
import { SiteSeo } from './pages/dashboard/SiteSeo';
import { SiteSettings } from './pages/dashboard/SiteSettings';
import { SiteBilling } from './pages/dashboard/SiteBilling';
import { SiteAI } from './pages/dashboard/SiteAI';
import { AccountPage } from './pages/dashboard/Account';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSites } from './pages/admin/AdminSites';
import { AdminTemplates } from './pages/admin/AdminTemplates';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminAI } from './pages/admin/AdminAI';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminActivity } from './pages/admin/AdminActivity';
import { AdminSettings } from './pages/admin/AdminSettings';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!admin && user.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/templates" element={<TemplateMarketplace />} />
            <Route path="/templates/:templateId" element={<TemplateDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/site/:slug" element={<PublishedSite />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/dashboard" element={<Protected><DashboardHome /></Protected>} />
            <Route path="/dashboard/account" element={<Protected><AccountPage /></Protected>} />
            <Route path="/preview/:siteId" element={<Protected><SitePreview /></Protected>} />
            <Route path="/dashboard/:siteId" element={<Protected><SiteLayout /></Protected>}>
              <Route index element={<SiteOverview />} />
              <Route path="items" element={<SiteItems />} />
              <Route path="orders" element={<SiteOrders />} />
              <Route path="customers" element={<SiteCustomers />} />
              <Route path="inbox" element={<SiteInbox />} />
              <Route path="media" element={<SiteMedia />} />
              <Route path="design" element={<SiteDesign />} />
              <Route path="templates" element={<SiteTemplates />} />
              <Route path="seo" element={<SiteSeo />} />
              <Route path="settings" element={<SiteSettings />} />
              <Route path="billing" element={<SiteBilling />} />
              <Route path="ai" element={<SiteAI />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
            <Route path="/admin" element={<Protected admin><AdminLayout /></Protected>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="sites" element={<AdminSites />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="ai" element={<AdminAI />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>404</div>
        <h1 className="display" style={{ fontSize: 64, marginTop: 14 }}>Nothing here but good taste.</h1>
        <p className="muted mt-12" style={{ fontSize: 14 }}>The page you are looking for has moved or never existed.</p>
        <a className="btn btn-accent mt-24" href="/">Go home</a>
      </div>
    </div>
  );
}
