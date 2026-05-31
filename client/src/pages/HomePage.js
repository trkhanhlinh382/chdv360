import {
  ApartmentOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  SecurityScanOutlined,
  HomeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { Button, Col, Empty, Row, Space, Typography, Card } from 'antd';
import { Link } from 'react-router-dom';
import ApartmentCard from '../components/ApartmentCard';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartments, useBuildings } from '../services/api/hooks';

const { Paragraph, Title, Text } = Typography;

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isVacantApartment(apartment) {
  if (!apartment?.status) {
    return true;
  }

  const status = apartment.status;

  if (typeof status === 'string') {
    const normalized = normalizeText(status);
    return (
      normalized.includes('trong') ||
      normalized.includes('vacant') ||
      normalized.includes('available')
    );
  }

  const statusId = String(status.id || '');
  if (statusId === '1') {
    return true;
  }

  const statusLabel = normalizeText(status.title || status.name || status.code);
  return (
    statusLabel.includes('trong') ||
    statusLabel.includes('vacant') ||
    statusLabel.includes('available')
  );
}

function HomePage() {
  const buildingsState = useBuildings();
  const apartmentsState = useApartments();
  const vacantApartments = (apartmentsState.data || []).filter((item) => isVacantApartment(item));

  if (buildingsState.isLoading || apartmentsState.isLoading) {
    return <LoadingView tip="Đang tải dữ liệu trang chủ..." />;
  }

  if (buildingsState.error) {
    return (
      <ErrorView
        message={buildingsState.error.message}
        onRetry={() => buildingsState.mutate()}
      />
    );
  }

  if (apartmentsState.error) {
    return (
      <ErrorView
        message={apartmentsState.error.message}
        onRetry={() => apartmentsState.mutate()}
      />
    );
  }

  return (
    <Space direction="vertical" size={32} style={{ width: '100%' }}>
      {/* Luxury Grand Hero Banner */}
      <section className="luxury-hero full-bleed-banner">
        <div className="home-banner-overlay" style={{ padding: '60px 0' }}>
          <Row align="middle" gutter={[24, 24]}>
            <Col xs={24} md={18} lg={13} xl={11}>
              <div className="luxury-hero-card">
                <Paragraph className="home-banner-eyebrow" style={{ color: '#9b8451', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '12px' }}>
                  NHÀ TRỌ 360 PLUS
                </Paragraph>
                <Title className="home-banner-title" level={1} style={{ fontSize: '38px', color: '#3a2e1e', fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.25 }}>
                  Trải Nghiệm Không Gian Sống Cao Cấp & Tiện Nghi
                </Title>
                <Paragraph className="home-banner-subtitle" style={{ fontSize: '15px', color: '#5f5140', marginBottom: '24px', lineHeight: 1.6 }}>
                  Hệ thống căn hộ dịch vụ cao cấp thế hệ mới. Thông tin minh bạch, dịch vụ chuẩn mực, hình ảnh thực tế và hỗ trợ tận tâm 24/7. Tìm phòng ưng ý chỉ trong 3 phút.
                </Paragraph>
                <Link to="/phong-trong">
                  <Button type="primary" size="large" style={{ borderRadius: '999px', background: 'linear-gradient(135deg, #9b8451 0%, #bda46a 100%)', border: 'none', height: '48px', paddingInline: '28px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Tìm phòng trống ngay <ArrowRightOutlined />
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Exclusive Company Services Section */}
      <section style={{ textAlign: 'center', padding: '24px 0 12px 0' }}>
        <Title level={2} className="luxury-section-title" style={{ color: '#3a2e1e', fontWeight: 800 }}>
          Dịch Vụ & Tiện Ích Độc Quyền Cao Cấp
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: '640px', margin: '0 auto 40px auto', fontSize: '15px', color: '#82745f' }}>
          Tại CHDV 360 Plus, chúng tôi không chỉ mang lại một nơi trú chân, mà kiến tạo một không gian sống đẳng cấp với hệ thống dịch vụ quản lý chuẩn mực quốc tế.
        </Paragraph>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="luxury-service-card" bodyStyle={{ padding: '28px 24px' }} bordered={false}>
              <div className="luxury-icon-wrapper">
                <SafetyCertificateOutlined />
              </div>
              <Title level={4} style={{ color: '#3a2e1e', fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>
                Quản Lý Chuyên Nghiệp
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0, color: '#82745f' }}>
                Bảo trì cơ sở vật chất định kỳ, hỗ trợ sự cố khẩn cấp 24/7 và dọn dẹp vệ sinh chung sạch sẽ.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="luxury-service-card" bodyStyle={{ padding: '28px 24px' }} bordered={false}>
              <div className="luxury-icon-wrapper">
                <CreditCardOutlined />
              </div>
              <Title level={4} style={{ color: '#3a2e1e', fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>
                Thanh Toán Linh Hoạt
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0, color: '#82745f' }}>
                Quản lý biểu phí rõ ràng, cập nhật hóa đơn điện tử tự động hàng tháng và thanh toán chuyển khoản nhanh chóng.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="luxury-service-card" bodyStyle={{ padding: '28px 24px' }} bordered={false}>
              <div className="luxury-icon-wrapper">
                <SecurityScanOutlined />
              </div>
              <Title level={4} style={{ color: '#3a2e1e', fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>
                An Ninh Tuyệt Đối
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0, color: '#82745f' }}>
                Cổng khóa vân tay cao cấp tích hợp camera thông minh 24/7 và đội ngũ bảo vệ trực tuần tra nghiêm ngặt.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="luxury-service-card" bodyStyle={{ padding: '28px 24px' }} bordered={false}>
              <div className="luxury-icon-wrapper">
                <HomeOutlined />
              </div>
              <Title level={4} style={{ color: '#3a2e1e', fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>
                Không Gian Tiện Nghi
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: 0, color: '#82745f' }}>
                Căn hộ thiết kế hiện đại, ngập tràn ánh sáng tự nhiên với đầy đủ trang thiết bị nội thất cao cấp.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* Buildings List Section */}
      <section className="hero-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#3a2e1e' }}>
            <ShopOutlined style={{ marginRight: 8, color: '#9b8451' }} /> Tòa nhà nổi bật
          </Title>
          <Link to="/toa-nha">
            <Button className="section-more-btn">Xem tất cả</Button>
          </Link>
        </div>
        <Paragraph style={{ marginBottom: 0, color: '#82745f' }}>
          Tổng cộng {buildingsState.data?.length || 0} tòa nhà đang mở cho thuê với hiệu suất cao.
        </Paragraph>
      </section>

      <Row gutter={[16, 16]}>
        {buildingsState.data?.slice(0, 6).map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id} className="luxury-card-hover">
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>

      {/* Vacant Apartments Section */}
      <section className="hero-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#3a2e1e' }}>
            <ApartmentOutlined style={{ marginRight: 8, color: '#9b8451' }} /> Phòng trống sẵn mới nhất
          </Title>
          <Link to="/phong-trong">
            <Button className="section-more-btn">Xem thêm</Button>
          </Link>
        </div>
        <Paragraph style={{ marginBottom: 0, color: '#82745f' }}>
          Hiện có {vacantApartments.length} phòng trống sẵn sàng dọn vào ở ngay, giá cả công khai minh bạch.
        </Paragraph>
      </section>

      {vacantApartments.length === 0 ? (
        <Empty description="Hiện chưa có phòng trống" />
      ) : (
        <Row gutter={[16, 16]}>
          {vacantApartments.slice(0, 6).map((apartment) => (
            <Col xs={24} sm={12} lg={8} key={`vacant-${apartment.id}`} className="luxury-card-hover">
              <ApartmentCard apartment={apartment} />
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}

export default HomePage;
