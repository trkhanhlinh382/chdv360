import {
  ApartmentOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { Col, Row, Space, Typography } from 'antd';
import ApartmentCard from '../components/ApartmentCard';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartments, useBuildings } from '../services/api/hooks';

const { Paragraph, Title } = Typography;

function HomePage() {
  const buildingsState = useBuildings();
  const apartmentsState = useApartments();

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
        <Title style={{ marginBottom: 8 }}>
          <ShopOutlined /> Tòa nhà nổi bật
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Tổng cộng {buildingsState.data?.length || 0} tòa nhà đang mở cho thuê.
        </Paragraph>
      </section>

      <Row gutter={[16, 16]}>
        {buildingsState.data?.map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id}>
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>

      <section className="hero-block">
        <Title style={{ marginBottom: 8 }}>
          <ApartmentOutlined /> Các căn hộ mới cập nhật
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Danh sách căn hộ có giá và diện tích minh bạch để bạn so sánh nhanh.
        </Paragraph>
      </section>

      <Row gutter={[16, 16]}>
        {apartmentsState.data?.slice(0, 6).map((apartment) => (
          <Col xs={24} sm={12} lg={8} key={apartment.id}>
            <ApartmentCard apartment={apartment} />
          </Col>
        ))}
      </Row>

      <section className="company-footer-block">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Title level={4} style={{ marginBottom: 6, color: '#564a38' }}>
              CÔNG TY TNHH DỊCH VỤ 360 PLUS
            </Title>
            <Paragraph style={{ color: '#6f624e', marginBottom: 0 }}>
              Giải pháp tìm phòng, quản lý phòng và kết nối khách thuê với dữ liệu cập
              nhật liên tục theo thị trường.
            </Paragraph>
            <Paragraph style={{ color: '#6f624e', marginBottom: 0, marginTop: 8 }}>
              Mã số thuế: 039391686
            </Paragraph>
          </Col>
          <Col xs={24} md={7}>
            <Paragraph style={{ color: '#665946', marginBottom: 8 }}>
              <EnvironmentOutlined /> 180 Phan Huy Ích, phường An Hội Tây, TP HCM
            </Paragraph>
            <Paragraph style={{ color: '#665946', marginBottom: 0 }}>
              360PLUS6868@GMAIL.COM
            </Paragraph>
          </Col>
          <Col xs={24} md={7}>
            <Paragraph style={{ color: '#665946', marginBottom: 8 }}>
              <PhoneOutlined /> HOTLINE: 0927 360 360
            </Paragraph>
            <Paragraph style={{ color: '#6f624e', marginBottom: 0 }}>
              Hỗ trợ tư vấn và xem phòng mỗi ngày
            </Paragraph>
          </Col>
        </Row>
      </section>
    </Space>
  );
}

export default HomePage;
