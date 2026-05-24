import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Alert, Badge, Spin, Typography, Space, Tooltip, Empty } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  CarOutlined, 
  DollarOutlined, 
  ExclamationCircleOutlined,
  CalendarOutlined,
  DashboardOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const user = api.getCurrentUser();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Đang tổng hợp số liệu báo cáo..." />
      </div>
    );
  }

  if (!stats) {
    return <Empty description="Không thể tải số liệu báo cáo." />;
  }

  const { summary, parkingStatusAlerts, buildingBreakdowns, expiringContracts } = stats;

  const contractColumns = [
    {
      title: 'Hợp đồng',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      render: (text) => <Text strong style={{ color: '#9b8451' }}>{text}</Text>
    },
    {
      title: 'Khách thuê',
      dataIndex: 'tenantName',
      key: 'tenantName'
    },
    {
      title: 'Phòng',
      key: 'room',
      render: (_, record) => `${record.buildingName} - ${record.apartmentName}`
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Còn lại',
      dataIndex: 'daysRemaining',
      key: 'daysRemaining',
      render: (days) => (
        <Badge 
          status={days <= 7 ? 'error' : days <= 15 ? 'warning' : 'processing'} 
          text={`${days} ngày`} 
        />
      )
    }
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#524636' }}>
            <DashboardOutlined style={{ marginRight: 8, color: '#bda46a' }} />
            Bảng Điều Khiển Quản Trị
          </Title>
          <Text type="secondary">Chào mừng {user?.name} ({user?.role === 'admin' ? 'Chủ sở hữu' : 'Quản lý tòa nhà'})</Text>
        </div>
      </div>

      {/* Critical Warnings / Alerts */}
      {parkingStatusAlerts.length > 0 && (
        <Alert
          message="Cảnh báo: Quá tải bãi giữ xe!"
          description={
            <div style={{ marginTop: 4 }}>
              {parkingStatusAlerts.map((alert, idx) => (
                <div key={idx}>
                  • Tòa nhà <strong>{alert.buildingName} ({alert.buildingCode})</strong> có số lượng xe đăng ký vượt công suất bãi: 
                  <strong style={{ color: '#cf1322' }}> {alert.registeredVehicles} / {alert.capacity} xe ({alert.percentage}%)</strong>.
                </div>
              ))}
            </div>
          }
          type="warning"
          showIcon
          icon={<AlertOutlined />}
          style={{ borderRadius: 8 }}
        />
      )}

      {/* Primary KPI Statistics Row */}
      <Row gutter={[16, 16]}>
        {/* Occupancy Progress Gauge */}
        <Col xs={24} md={8}>
          <Card 
            title="Tỷ Lệ Lấp Đầy Hệ Thống" 
            bordered={false} 
            style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <Progress 
              type="circle" 
              percent={summary.occupancyRate} 
              strokeColor={{ '0%': '#9b8451', '100%': '#bda46a' }}
              strokeWidth={10}
              width={140}
              format={(percent) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#524636' }}>{percent}%</span>
                  <span style={{ fontSize: 11, color: '#82745f' }}>Lấp đầy</span>
                </div>
              )}
            />
            <div style={{ marginTop: 20, textAlign: 'center', width: '100%' }}>
              <Row gutter={8}>
                <Col span={8}>
                  <Statistic title="Trống" value={summary.vacantApartments} valueStyle={{ color: '#52c41a', fontSize: 18 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Có khách" value={summary.occupiedApartments} valueStyle={{ color: '#bda46a', fontSize: 18 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Bảo trì" value={summary.maintenanceApartments} valueStyle={{ color: '#faad14', fontSize: 18 }} />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* Core numbers cards */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title="Tổng tòa nhà"
                  value={summary.totalBuildings}
                  prefix={<HomeOutlined style={{ color: '#bda46a' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title="Tổng số căn hộ"
                  value={summary.totalApartments}
                  prefix={<HomeOutlined style={{ color: '#bda46a' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title="Khách đang ở"
                  value={summary.totalResidents}
                  suffix={`(${summary.totalPrimaryTenants} chính + ${summary.totalCoResidents} phụ)`}
                  valueStyle={{ fontSize: 20 }}
                  prefix={<UserOutlined style={{ color: '#bda46a' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title="Phương tiện giữ tại bãi"
                  value={summary.totalVehicles}
                  suffix={`/ ${summary.totalParkingCapacity} sức chứa`}
                  valueStyle={{ fontSize: 20 }}
                  prefix={<CarOutlined style={{ color: '#bda46a' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} lg={16}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', background: 'linear-gradient(135deg, #fbfaf8 0%, #f5f2eb 100%)' }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic
                      title="Doanh thu thực tế đã thu"
                      value={summary.collectedRevenue}
                      formatter={formatCurrency}
                      valueStyle={{ color: '#52c41a', fontSize: 18, fontWeight: 700 }}
                      prefix={<DollarOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Nợ chưa thanh toán"
                      value={summary.outstandingDebt}
                      formatter={formatCurrency}
                      valueStyle={{ color: '#f5222d', fontSize: 18, fontWeight: 700 }}
                      prefix={<DollarOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Revenue projections */}
      <Card title="Ước Tính Tài Chính & Kế Hoạch Hàng Tháng" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8}>
            <Statistic 
              title="Tổng doanh thu dự kiến (Thuê phòng cố định)" 
              value={summary.projectedMonthlyRevenue} 
              formatter={formatCurrency}
              valueStyle={{ color: '#bda46a', fontWeight: 700 }}
            />
          </Col>
          <Col xs={24} sm={12} md={16}>
            <div style={{ background: '#fafaf9', padding: '16px', borderRadius: 8, borderLeft: '4px solid #bda46a' }}>
              <Text strong style={{ color: '#524636' }}>💡 Phân tích dòng tiền:</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Tổng doanh thu cố định dự kiến của tháng hiện tại là <strong>{formatCurrency(summary.projectedMonthlyRevenue)}</strong> (tính dựa trên hợp đồng thuê phòng).
                Hóa đơn dịch vụ (Điện, nước, phí quản lý) sẽ làm tăng tổng doanh thu thu về thực tế. Hãy xuất hóa đơn tiện ích trước ngày 5 hàng tháng để tối ưu dòng tiền thu hồi.
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Detailed Buildings Breakdown */}
      <Card title="Danh Sách Tòa Nhà & Trạng Thái Bãi Xe" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Row gutter={[16, 16]}>
          {buildingBreakdowns.map((building) => (
            <Col xs={24} md={12} key={building.buildingId}>
              <Card 
                type="inner" 
                title={`${building.name} (${building.code})`}
                style={{ borderRadius: 8, border: '1px solid #f0edf6' }}
              >
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic title="Số lượng phòng" value={building.totalRooms} />
                    <Statistic 
                      title="Phòng có khách" 
                      value={building.occupiedRooms} 
                      suffix={`/ ${building.totalRooms}`} 
                      valueStyle={{ fontSize: 16 }}
                    />
                    <Progress percent={building.occupancyRate} strokeColor="#bda46a" size="small" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Số xe đăng ký" value={building.registeredVehicles} suffix={`/ ${building.parkingCapacity}`} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Hiệu suất bãi xe:</Text>
                    <Progress 
                      percent={building.parkingUsagePercent} 
                      status={building.parkingUsagePercent >= 100 ? 'exception' : building.parkingUsagePercent >= 80 ? 'warning' : 'normal'}
                      strokeColor={building.parkingUsagePercent >= 80 ? '#f5222d' : '#bda46a'} 
                      size="small" 
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Expiring Lease Contracts Alert */}
      <Card 
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 8, color: '#f5222d' }} />
            Hợp Đồng Thuê Sắp Hết Hạn (Trong 30 ngày tới)
          </span>
        } 
        bordered={false} 
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
      >
        {expiringContracts.length === 0 ? (
          <Empty description="Không có hợp đồng nào sắp hết hạn." />
        ) : (
          <Table 
            dataSource={expiringContracts} 
            columns={contractColumns} 
            rowKey="contractId" 
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </Space>
  );
}
