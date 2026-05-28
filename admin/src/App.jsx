import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, ConfigProvider, Space, Typography, Tag, Card } from 'antd';
import { 
  DashboardOutlined, 
  ShopOutlined, 
  ApartmentOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  CalculatorOutlined, 
  UserSwitchOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AreaChartOutlined,
  UserAddOutlined
} from '@ant-design/icons';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BuildingManagement from './pages/BuildingManagement';
import ApartmentManagement from './pages/ApartmentManagement';
import TenantManagement from './pages/TenantManagement';
import ContractManagement from './pages/ContractManagement';
import InvoiceManagement from './pages/InvoiceManagement';
import StaffManagement from './pages/StaffManagement';
import CheckinWizard from './pages/CheckinWizard';

import { api } from './services/api';


const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 1. Private Route Guard
function PrivateRoute({ children }) {
  const token = localStorage.getItem('chdv360_admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

// 2. Admin Route Guard
function AdminRoute({ children }) {
  const user = api.getCurrentUser();
  const isAdmin = user && user.role === 'admin';
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

// 3. Main Dashboard Shell/Layout
function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
  };

  // Define sidebar menu options based on role
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Bảng điều khiển'
    },
    {
      key: '/buildings',
      icon: <ShopOutlined />,
      label: 'Quản lý tòa nhà'
    },
    {
      key: '/apartments',
      icon: <ApartmentOutlined />,
      label: 'Quản lý căn hộ'
    },
    {
      key: '/tenants',
      icon: <UserOutlined />,
      label: 'Quản lý khách thuê'
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: 'Quản lý hợp đồng'
    },
    {
      key: '/checkin',
      icon: <UserAddOutlined />,
      label: 'Nhận phòng'
    },
    {
      key: '/invoices',
      icon: <CalculatorOutlined />,
      label: 'Hóa đơn điện nước'
    }
  ];


  // Admin-only option
  if (user?.role === 'admin') {
    menuItems.push({
      key: '/staff',
      icon: <UserSwitchOutlined />,
      label: 'Quản lý nhân viên'
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider Drawer Panel */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        width={250}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          zIndex: 10
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : 24, background: '#fafaf9', borderBottom: '1px solid #f0edf6' }}>
          <img src="/logo360.png" alt="CHDV" style={{ height: 32, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} onError={(e) => { e.target.style.display = 'none'; }} />
          {!collapsed && (
            <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 700, color: '#bda46a', letterSpacing: 0.5 }}>
              360 PLUS ADMIN
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 12 }}
        />
      </Sider>

      <Layout>
        {/* Top Header Panel */}
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', zIndex: 9 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <Space size="large" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <Text strong style={{ color: '#524636' }}>{user?.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {user?.role === 'admin' ? (
                  <Tag color="gold" style={{ border: 'none', borderRadius: 4, margin: 0 }}>Chủ sở hữu</Tag>
                ) : (
                  <Tag color="blue" style={{ border: 'none', borderRadius: 4, margin: 0 }}>Quản lý tòa nhà</Tag>
                )}
              </Text>
            </div>
            
            <Button 
              type="text" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ fontWeight: 500 }}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        {/* Content Shell View */}
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: 'transparent', overflowY: 'auto' }}>
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="buildings" element={<BuildingManagement />} />
            <Route path="apartments" element={<ApartmentManagement />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="contracts" element={<ContractManagement />} />
            <Route path="invoices" element={<InvoiceManagement />} />
            <Route path="staff" element={<AdminRoute><StaffManagement /></AdminRoute>} />
            <Route path="checkin" element={<CheckinWizard />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />

          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
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
          borderRadius: 10
        }
      }}
    >
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={<PrivateRoute><DashboardShell /></PrivateRoute>} />
        {/* Redirect from root admin route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
