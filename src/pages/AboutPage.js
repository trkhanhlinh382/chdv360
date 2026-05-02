import {
  ApartmentOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  ShopOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { ErrorView, LoadingView } from '../components/StateView';
import { useDashboardSummary } from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;
const isResidentMode = process.env.REACT_APP_USE_RESIDENT_API === 'true';

const highlights = [
  {
    icon: <HomeOutlined />,
    title: 'Phòng giá tốt, dữ liệu minh bạch',
    description: 'Giá phòng, diện tích, tình trạng phòng được cập nhật rõ ràng để dễ so sánh.'
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Cập nhật liên tục mỗi ngày',
    description: 'Thông tin tòa nhà và căn hộ mới được đồng bộ nhanh để khách hàng ra quyết định sớm.'
  },
  {
    icon: <CheckCircleOutlined />,
    title: 'Tối ưu quy trình tìm phòng',
    description: 'Từ khâu tìm kiếm đến liên hệ, mọi thao tác được thiết kế gọn, nhanh và trực quan.'
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Hỗ trợ nhanh và linh hoạt',
    description: 'Đội ngũ 360 Plus sẵn sàng tư vấn ngay khi khách cần thông tin tòa nhà và phòng.'
  }
];

const companyImages = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1400&q=80'
];

function AboutPage() {
  const dashboardState = useDashboardSummary();

  if (dashboardState.isLoading) {
    return <LoadingView tip="Đang tải thông tin công ty..." />;
  }

  if (dashboardState.error) {
    return (
      <ErrorView
        message={dashboardState.error.message}
        onRetry={() => dashboardState.mutate()}
      />
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div className="hero-block">
        <Title style={{ marginBottom: 8 }}>Giới thiệu 360 Plus</Title>
        <Tag color={isResidentMode ? 'green' : 'gold'} style={{ marginBottom: 12 }}>
         
        </Tag>
        <Paragraph style={{ marginBottom: 0 }}>
          CÔNG TY TNHH DỊCH VỤ 360 PLUS vận hành nền tảng tìm phòng giúp khách hàng
          tiếp cận danh sách tòa nhà, phòng giá tốt và thông tin được cập nhật liên tục.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {companyImages.map((image) => (
          <Col key={image} xs={24} md={8}>
            <Card
              className="entity-card"
              cover={
                <img
                  alt="360-plus-company"
                  src={image}
                  style={{ height: 220, objectFit: 'cover' }}
                />
              }
            />
          </Col>
        ))}
      </Row>

      <Card className="hero-block" bordered={false}>
        <Title level={3} style={{ marginBottom: 8 }}>
          <BarChartOutlined /> Hệ Thống
        </Title>
        <Paragraph style={{ marginBottom: 16 }}>
          Số liệu tổng hợp về tòa nhà, căn hộ và tỷ lệ lấp đầy được hiển thị để đội ngũ
          kinh doanh và khách hàng cùng nắm bắt xu hướng nhanh hơn.
        </Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="detail-metric-card" bordered={false}>
              <Statistic
                title="Số tòa nhà"
                value={dashboardState.data?.totalBuildings || 0}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="detail-metric-card" bordered={false}>
              <Statistic
                title="Số căn hộ"
                value={dashboardState.data?.totalApartments || 0}
                prefix={<ApartmentOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="detail-metric-card" bordered={false}>
              <Statistic
                title="Tỷ lệ lấp đầy"
                value={dashboardState.data?.occupancyRate || 0}
                suffix="%"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {highlights.map((item) => (
          <Col key={item.title} xs={24} md={12}>
            <Card className="entity-card">
              <Space direction="vertical" size={8}>
                <Text strong style={{ fontSize: 16 }}>
                  {item.icon} {item.title}
                </Text>
                <Text type="secondary">{item.description}</Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="about-company-card">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={4} style={{ marginBottom: 0 }}>
            Thông tin doanh nghiệp
          </Title>
          <Text strong>CÔNG TY TNHH DỊCH VỤ 360 PLUS</Text>
          <Text>Mã số thuế: 039391686</Text>
          <Text>Email: 360PLUS6868@GMAIL.COM</Text>
          <Text>Hotline: 0927 360 360</Text>
          <Text>Văn phòng: 180 Phan Huy Ích, phường An Hội Tây, TP HCM</Text>
        </Space>
      </Card>
    </Space>
  );
}

export default AboutPage;
