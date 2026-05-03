import { EnvironmentOutlined, MailOutlined, MenuOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Drawer, Layout, Menu, Row, Col, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import AboutPage from './pages/AboutPage';
import ApartmentDetailPage from './pages/ApartmentDetailPage';
import BuildingsPage from './pages/BuildingsPage';
import BuildingDetailPage from './pages/BuildingDetailPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import VacantApartmentsPage from './pages/VacantApartmentsPage';

const { Content, Footer, Header } = Layout;
const { Paragraph, Title } = Typography;


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

  if (pathname.startsWith('/phong-trong')) {
    return '/phong-trong';
  }

  if (pathname.startsWith('/lien-he')) {
    return '/lien-he';
  }

  return '';
}

function App() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      key: '/phong-trong',
      label: <Link to="/phong-trong">Phòng trống</Link>
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

          <div className="app-header-spacer" aria-hidden="true">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="app-mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mo menu"
            />
          </div>
        </Header>

        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setIsMobileMenuOpen(false)}
          open={isMobileMenuOpen}
          className="app-mobile-drawer"
          width="60%"
        >
          <Menu
            mode="vertical"
            selectedKeys={[getSelectedMenuKey(location.pathname)]}
            items={menuItems}
            className="app-mobile-nav"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </Drawer>

        <Content className="app-content">
          <div className="content-shell">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/gioi-thieu" element={<AboutPage />} />
              <Route path="/toa-nha" element={<BuildingsPage />} />
              <Route path="/phong-trong" element={<VacantApartmentsPage />} />
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

        <Footer className="app-footer">
          <Row gutter={[24, 20]} style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Col xs={24} md={10}>
              <Title level={4} style={{ marginBottom: 6 }}>
                CÔNG TY TNHH DỊCH VỤ 360 PLUS
              </Title>
              <Paragraph style={{ marginBottom: 0 }}>
                Giải pháp tìm phòng, quản lý phòng và kết nối khách thuê với dữ liệu cập
                nhật liên tục theo thị trường.
              </Paragraph>
              <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                Mã số thuế: 039391686
              </Paragraph>
            </Col>
            <Col xs={24} md={7}>
              <Paragraph style={{ marginBottom: 8 }}>
                <EnvironmentOutlined /> 180 Phan Huy Ích, phường An Hội Tây, TP HCM
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <MailOutlined /> 360PLUS6868@GMAIL.COM
              </Paragraph>
            </Col>
            <Col xs={24} md={7}>
              <Paragraph style={{ marginBottom: 8 }}>
                <PhoneOutlined /> HOTLINE: 0927 360 360
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                Hỗ trợ tư vấn và xem phòng mỗi ngày
              </Paragraph>
            </Col>
          </Row>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
