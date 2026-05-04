import {
  ApartmentOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { Button, Col, Empty, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import ApartmentCard from '../components/ApartmentCard';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartments, useBuildings } from '../services/api/hooks';

const { Paragraph, Title } = Typography;

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
    <Space direction="vertical" size={28} style={{ width: '100%' }}>
      <section className="home-banner full-bleed-banner">
        <div className="home-banner-overlay">
          <Paragraph className="home-banner-eyebrow">Nhà Trọ 360 Plus</Paragraph>
          <Title className="home-banner-title" level={1}>
            Tìm căn hộ phù hợp trong 3 phút
          </Title>
          <Paragraph className="home-banner-subtitle">
            Dữ liệu giá thuê rõ ràng, hình ảnh thực tế, liên hệ trực tiếp qua phone và
            Zalo.
          </Paragraph>
        </div>
      </section>

      <section className="hero-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ShopOutlined /> Tòa nhà nổi bật
          </Title>
          <Link to="/toa-nha">
            <Button className="section-more-btn">Xem thêm</Button>
          </Link>
        </div>
        <Paragraph style={{ marginBottom: 0 }}>
          Tổng cộng {buildingsState.data?.length || 0} tòa nhà đang mở cho thuê.
        </Paragraph>
      </section>

      <Row gutter={[16, 16]}>
        {buildingsState.data?.slice(0, 6).map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id}>
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>

      <section className="hero-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ApartmentOutlined /> Các căn hộ mới cập nhật
          </Title>
          <Link to="/phong-trong">
            <Button className="section-more-btn">Xem thêm</Button>
          </Link>
        </div>
        <Paragraph style={{ marginBottom: 0 }}>
          Danh sách căn hộ có giá và diện tích minh bạch để bạn so sánh nhanh.
        </Paragraph>
      </section>

      <Row gutter={[16, 16]}>
        {[...(apartmentsState.data || [])].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 6).map((apartment) => (
          <Col xs={24} sm={12} lg={8} key={apartment.id}>
            <ApartmentCard apartment={apartment} />
          </Col>
        ))}
      </Row>

      <section className="hero-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ApartmentOutlined /> Danh sách phòng trống
          </Title>
          <Link to="/phong-trong">
            <Button className="section-more-btn">Xem thêm</Button>
          </Link>
        </div>
        <Paragraph style={{ marginBottom: 0 }}>
          Hiện có {vacantApartments.length} phòng trống sẵn, cập nhật theo trạng thái thực tế.
        </Paragraph>
      </section>

      {vacantApartments.length === 0 ? (
        <Empty description="Hiện chưa có phòng trống" />
      ) : (
        <Row gutter={[16, 16]}>
          {vacantApartments.slice(0, 6).map((apartment) => (
            <Col xs={24} sm={12} lg={8} key={`vacant-${apartment.id}`}>
              <ApartmentCard apartment={apartment} />
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}

export default HomePage;
