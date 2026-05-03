import { ConfigProvider, Layout, Menu, Typography } from 'antd';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import AboutPage from './pages/AboutPage';
import ApartmentDetailPage from './pages/ApartmentDetailPage';
import BuildingsPage from './pages/BuildingsPage';
import BuildingDetailPage from './pages/BuildingDetailPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

const { Content, Footer, Header } = Layout;
const { Title } = Typography;

function getSelectedMenuKey(pathname) {
  if (pathname === '/') {
    return '/';
  }

  if (pathname.startsWith('/gioi-thieu')) {
    return '/gioi-thieu';
  }

  if (
    pathname.startsWith('/toa-nha') ||
    pathname.startsWith('/buildings') ||
    pathname.startsWith('/apartments')
  ) {
    return '/toa-nha';
  }

  if (pathname.startsWith('/lien-he')) {
    return '/lien-he';
  }

  return '';
}

function App() {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      label: <Link to="/">Trang chủ</Link>
    },
    {
      key: '/gioi-thieu',
      label: <Link to="/gioi-thieu">Giới thiệu</Link>
    },
    {
      key: '/toa-nha',
      label: <Link to="/toa-nha">Tòa nhà</Link>
    },
    {
      key: '/lien-he',
      label: <Link to="/lien-he">Liên hệ</Link>
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#bda46a',
          colorText: '#5f5140',
          colorTextHeading: '#524636',
          colorTextSecondary: '#82745f',
          colorLink: '#9b8451',
          colorLinkHover: '#bda46a',
          borderRadius: 12
        }
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <Link to="/">
            <img src="/logo360.png" alt="Logo CHDV 360 Plus" className="brand-logo" />
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[getSelectedMenuKey(location.pathname)]}
            items={menuItems}
            className="app-nav"
          />

          <div className="app-header-spacer" aria-hidden="true" />
        </Header>

        <Content className="app-content">
          <div className="content-shell">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/gioi-thieu" element={<AboutPage />} />
              <Route path="/toa-nha" element={<BuildingsPage />} />
              <Route path="/lien-he" element={<ContactPage />} />
              <Route path="/buildings/:buildingId" element={<BuildingDetailPage />} />
              <Route
                path="/apartments/:apartmentId"
                element={<ApartmentDetailPage />}
              />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          CHDV 360 Plus
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
