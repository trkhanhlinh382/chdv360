import {
  ApartmentOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Card, Col, Divider, Row, Space, Statistic, Tag, Typography } from 'antd';
import ImageGallery from '../components/ImageGallery';
import { ErrorView, LoadingView } from '../components/StateView';
import { useDashboardSummary } from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;
const isResidentMode = process.env.REACT_APP_USE_RESIDENT_API === 'true';

const highlights = [
  {
    icon: <img src="/logo360.png" alt="360 logo" className="inline-logo-icon" />,
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
  '/360plus01.jpg',
  '/360plus02.jpg',
  '/360plus03.jpg'
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
      {/* Tiêu đề công ty */}
      <div className="hero-block" style={{ paddingBottom: 0 }}>
        <Space align="center" style={{ marginBottom: 4 }}>
          <img src="/logo360.png" alt="360 Plus" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <Title style={{ marginBottom: 0 }}>Hệ Thống 360 Plus</Title>
            <Tag color={isResidentMode ? 'green' : 'gold'} style={{ marginTop: 4, marginBottom: 12, fontSize: 14 }}>
              Căn hộ dịch vụ cao cấp
            </Tag>
          </div>
        </Space>
      </div>

      <Card className="hero-block" bordered={false}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={9}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Title level={3} style={{ margin: 0 }}>
                Giới thiệu Công Ty 360 Plus
              </Title>
              <Paragraph style={{ margin: 0 }}>
                360 Plus là đơn vị chuyên vận hành và phát triển hệ thống căn hộ dịch vụ
                tại TP.HCM, tập trung vào trải nghiệm thuê ở minh bạch, nhanh và linh hoạt.
              </Paragraph>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text>
                  <CheckCircleOutlined style={{ color: '#9b8451', marginRight: 8 }} />
                  Hệ thống dữ liệu phòng và giá cập nhật liên tục.
                </Text>
                <Text>
                  <EnvironmentOutlined style={{ color: '#9b8451', marginRight: 8 }} />
                  Mạng lưới vận hành tại nhiều quận trọng điểm.
                </Text>
                <Text>
                  <CalendarOutlined style={{ color: '#9b8451', marginRight: 8 }} />
                  Đội ngũ hỗ trợ tư vấn và xem phòng mỗi ngày.
                </Text>
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={15}>
            <ImageGallery images={companyImages} height={360} />
          </Col>
        </Row>
      </Card>
   <Card className="hero-block" bordered={false}>
        <Title level={3} style={{ marginBottom: 8 }}>
          <BarChartOutlined /> Hệ Thống Căn Hộ
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
                value={20}
                suffix="+"
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="detail-metric-card" bordered={false}>
              <Statistic
                title="Số căn hộ"
                value={1000}
                suffix="+"
                prefix={<ApartmentOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="detail-metric-card" bordered={false}>
              <Statistic
                title="Tỷ lệ lấp đầy"
                value={96}
                suffix="%"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      {/* HẠNG MỤC 1 — Cho thuê CHDV */}
      <Card
        bordered={false}
        className="hero-block"
        style={{ borderLeft: '4px solid #bda46a' }}
        title={
          <Space>
            <div style={{ background: '#bda46a', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>1</Text>
            </div>
            <span style={{ color: '#524636', fontWeight: 700, fontSize: 16 }}>Dịch vụ cho thuê căn hộ dịch vụ</span>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: '#524636' }}>
                <EnvironmentOutlined style={{ color: '#bda46a', marginRight: 6 }} />
                Khu vực quản lý &amp; vận hành
              </Text>
              <Text type="secondary">Hiện đang vận hành hệ thống CHDV tại các quận:</Text>
              <div>
                {['Quận 6', 'Quận 12', 'Quận Tân Phú', 'Quận Bình Thạnh', 'Quận Gò Vấp'].map((q) => (
                  <Tag key={q} style={{ margin: '4px 4px 4px 0', fontSize: 13, padding: '3px 12px', borderRadius: 20, background: '#faf7f0', borderColor: '#e0d5b8', color: '#7a6740' }}>
                    {q}
                  </Tag>
                ))}
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: '#524636' }}>
                <CheckCircleOutlined style={{ color: '#bda46a', marginRight: 6 }} />
                Cam kết chất lượng dịch vụ
              </Text>
              <Row gutter={[12, 12]}>
                {[
                  { icon: <ApartmentOutlined />, label: 'Nội thất', value: 'Bàn giao đầy đủ' },
                  { icon: <ClockCircleOutlined />, label: 'Quản lý', value: '24/7 sửa chữa nhanh' },
                  { icon: <CheckCircleOutlined />, label: 'Hợp đồng', value: 'Minh bạch, rõ ràng' },
                  { icon: <ThunderboltOutlined />, label: 'Chi phí', value: 'Không phát sinh phí ẩn' },
                ].map((item) => (
                  <Col key={item.label} xs={12}>
                    <div style={{ background: '#faf7f0', borderRadius: 10, padding: '10px 14px', border: '1px solid #e8e0cc' }}>
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#bda46a', fontSize: 18 }}>{item.icon}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.label}</Text>
                        <Text strong style={{ color: '#524636', fontSize: 13 }}>{item.value}</Text>
                      </Space>
                    </div>
                  </Col>
                ))}
              </Row>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* HẠNG MỤC 2 — Thuê lại tòa nhà */}
      <Card
        bordered={false}
        className="hero-block"
        style={{ borderLeft: '4px solid #9b8451' }}
        title={
          <Space>
            <div style={{ background: '#9b8451', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>2</Text>
            </div>
            <span style={{ color: '#524636', fontWeight: 700, fontSize: 16 }}>Đang có nhu cầu thuê lại tòa nhà</span>
          </Space>
        }
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: '#524636' }}>
                <EnvironmentOutlined style={{ color: '#9b8451', marginRight: 6 }} />
                Khu vực tìm kiếm tòa nhà
              </Text>
              <Text type="secondary">Mở rộng hệ thống tại các quận:</Text>
              <div>
                {['Quận Tân Phú', 'Quận Gò Vấp', 'Quận 6', 'Quận Bình Thạnh', 'Quận 12'].map((q) => (
                  <Tag key={q} style={{ margin: '4px 4px 4px 0', fontSize: 13, padding: '3px 12px', borderRadius: 20, background: '#faf7f0', borderColor: '#e0d5b8', color: '#7a6740' }}>
                    {q}
                  </Tag>
                ))}
              </div>
              <Divider style={{ margin: '4px 0', borderColor: '#ebe7de' }} />
              <Space>
                <UnorderedListOutlined style={{ color: '#9b8451' }} />
                <Text>Số lượng tòa nhà cần thuê: <Text strong style={{ color: '#524636' }}>Không giới hạn</Text></Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong style={{ color: '#524636' }}>
                <SafetyCertificateOutlined style={{ color: '#9b8451', marginRight: 6 }} />
                Yêu cầu tòa nhà
              </Text>
              <Row gutter={[12, 12]}>
                {[
                  { icon: <ApartmentOutlined />, label: 'Quy mô', value: '30 – 100 phòng' },
                  { icon: <SafetyCertificateOutlined />, label: 'PCCC', value: 'Đạt chuẩn' },
                  { icon: <ThunderboltOutlined />, label: 'Thang máy', value: 'Bắt buộc có' },
                  { icon: <HomeOutlined />, label: 'Hợp đồng', value: 'Chính chủ ký' },
                ].map((item) => (
                  <Col key={item.label} xs={12}>
                    <div style={{ background: '#faf7f0', borderRadius: 10, padding: '10px 14px', border: '1px solid #e8e0cc' }}>
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#9b8451', fontSize: 18 }}>{item.icon}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.label}</Text>
                        <Text strong style={{ color: '#524636', fontSize: 13 }}>{item.value}</Text>
                      </Space>
                    </div>
                  </Col>
                ))}
              </Row>
            </Space>
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
    </Space>
  );
}

export default AboutPage;
