import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { PhoneOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.login(values.phone, values.password);
      message.success(`Chào mừng ${res.user.name} trở lại!`);
      navigate('/dashboard');
    } catch (error) {
      message.error(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="login-layout" style={{ minHeight: '100vh', background: 'radial-gradient(circle, #2d261e 0%, #17130f 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '0 16px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/logo360.png" alt="CHDV 360 Plus" style={{ height: 64, marginBottom: 12, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <Title level={2} style={{ color: '#bda46a', margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>CHDV 360 PLUS</Title>
            <Paragraph style={{ color: '#82745f', fontSize: 14 }}>Hệ thống quản lý căn hộ dịch vụ cao cấp</Paragraph>
          </div>
          
          <Card 
            className="login-card"
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(20px)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
            }}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <Title level={4} style={{ color: '#fff', textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
              <SafetyCertificateOutlined style={{ marginRight: 8, color: '#bda46a' }} />
              ĐĂNG NHẬP HỆ THỐNG
            </Title>

            <Form
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              size="large"
            >
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại hoặc tài khoản!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined style={{ color: '#82745f' }} />} 
                  placeholder="Số điện thoại hoặc admin" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#82745f' }} />}
                  placeholder="Mật khẩu"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                  className="login-input"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block
                  style={{
                    background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 44,
                    boxShadow: '0 4px 12px rgba(189, 164, 106, 0.2)'
                  }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 24, color: '#5f5140', fontSize: 12 }}>
            © 2026 CHDV 360 Plus. Phát triển bởi Antigravity.
          </div>
        </div>
      </Content>
    </Layout>
  );
}
