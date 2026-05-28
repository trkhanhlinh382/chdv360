import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Card, 
  Space, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  message, 
  Button, 
  Divider,
  Tag
} from 'antd';
import { 
  EnvironmentOutlined, 
  ShopOutlined, 
  ApartmentOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

export default function RegionManagement() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await api.getBuildings();
      setBuildings(bRes.data);
      const aRes = await api.getApartments();
      setApartments(aRes.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu khu vực');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute region statistics
  const uniqueRegions = Array.from(new Set(buildings.map(b => b.region).filter(Boolean)));
  const regionStats = uniqueRegions.map((reg, idx) => {
    const regBuildings = buildings.filter(b => b.region === reg);
    const regApartments = apartments.filter(apt => 
      regBuildings.some(rb => rb._id === (apt.buildingId?._id || apt.buildingId))
    );
    return {
      key: idx.toString(),
      region: reg,
      buildingCount: regBuildings.length,
      apartmentCount: regApartments.length
    };
  });

  const columns = [
    {
      title: 'Tên Khu Vực',
      dataIndex: 'region',
      key: 'region',
      render: (text) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/buildings?region=${encodeURIComponent(text)}`)} 
          style={{ padding: 0, height: 'auto', fontWeight: 600, color: '#9b8451', fontSize: 15 }}
          icon={<EnvironmentOutlined />}
        >
          {text}
        </Button>
      )
    },
    {
      title: 'Số Lượng Tòa Nhà',
      dataIndex: 'buildingCount',
      key: 'buildingCount',
      render: (count) => <Tag color="gold" style={{ fontSize: 13, padding: '2px 8px' }}>{count} tòa nhà</Tag>
    },
    {
      title: 'Số Lượng Căn Hộ',
      dataIndex: 'apartmentCount',
      key: 'apartmentCount',
      render: (count) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 8px' }}>{count} phòng</Tag>
    },
    {
      title: 'Hành động nhanh',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/buildings?region=${encodeURIComponent(record.region)}`)}
          style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none', borderRadius: 6 }}
        >
          Xem tòa nhà
        </Button>
      )
    }
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* Overview stats cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title="Tổng số Khu Vực" 
              value={uniqueRegions.length} 
              valueStyle={{ color: '#bda46a', fontWeight: 700 }}
              prefix={<EnvironmentOutlined style={{ color: '#bda46a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title="Tổng số Tòa Nhà" 
              value={buildings.length} 
              valueStyle={{ color: '#9b8451', fontWeight: 700 }}
              prefix={<ShopOutlined style={{ color: '#9b8451' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title="Tổng số Căn Hộ" 
              value={apartments.length} 
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              prefix={<ApartmentOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Regions table */}
      <Card 
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#bda46a' }} />
            <Title level={4} style={{ margin: 0, color: '#524636' }}>Bảng Thống Kê Chi Tiết Khu Vực</Title>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
      >
        <Table 
          dataSource={regionStats} 
          columns={columns} 
          loading={loading}
          pagination={false}
          rowKey="region"
        />
      </Card>
    </Space>
  );
}
