import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Row,
  Space,
  Statistic,
  Typography
} from 'antd';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ApartmentCard from '../components/ApartmentCard';
import ContactButtons from '../components/ContactButtons';
import ImageGallery from '../components/ImageGallery';
import { ErrorView, LoadingView } from '../components/StateView';
import {
  useApartment,
  useApartments,
  useApartmentsByBuilding,
  useBuilding
} from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;

function formatCurrency(value) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`;
}

function ApartmentDetailPage() {
  const { apartmentId } = useParams();
  const navigate = useNavigate();
  const apartmentState = useApartment(apartmentId);
  const buildingState = useBuilding(apartmentState.data?.buildingId);
  const sameBuildingApartmentsState = useApartmentsByBuilding(
    apartmentState.data?.buildingId
  );
  const allApartmentsState = useApartments();
  const estimatedKwh = 120;
  const occupants = 2;

  const apartment = apartmentState.data;

  const monthlyEstimate = useMemo(() => {
    if (!apartment) {
      return 0;
    }

    const buildingFees = (buildingState.data?.fees || []).reduce((sum, f) => {
      if (f.unit === 'Người') return sum + f.price * occupants;
      return sum + f.price; // Phòng, Tháng, or other flat fees
    }, 0);

    return (
      apartment.price.base +
      buildingFees +
      apartment.price.electric * estimatedKwh +
      apartment.price.water * occupants
    );
  }, [apartment, buildingState.data, estimatedKwh, occupants]);

  const similarApartments = useMemo(() => {
    if (!apartment) {
      return [];
    }

    const sameBuilding = (sameBuildingApartmentsState.data || []).filter(
      (item) => item.id !== apartment.id
    );

    if (sameBuilding.length > 0) {
      return sameBuilding.slice(0, 3);
    }

    return (allApartmentsState.data || [])
      .filter((item) => item.id !== apartment.id)
      .sort(
        (a, b) =>
          Math.abs(a.price.base - apartment.price.base) -
          Math.abs(b.price.base - apartment.price.base)
      )
      .slice(0, 3);
  }, [
    allApartmentsState.data,
    apartment,
    sameBuildingApartmentsState.data
  ]);

  const googleMapsSearchUrl = useMemo(() => {
    const mapsSearchUrl = buildingState.data?.mapsSearchUrl;
    if (mapsSearchUrl) {
      return mapsSearchUrl;
    }

    const address = buildingState.data?.address;
    if (!address) {
      return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }, [buildingState.data]);

  const googleMapsEmbedUrl = useMemo(() => {
    const address = buildingState.data?.address;
    if (!address) {
      return null;
    }

    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }, [buildingState.data?.address]);

  if (apartmentState.isLoading) {
    return <LoadingView tip="Đang tải thông tin căn hộ..." />;
  }

  if (apartmentState.error) {
    return (
      <ErrorView
        message={apartmentState.error.message}
        onRetry={() => apartmentState.mutate()}
      />
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ImageGallery images={apartment.images} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            
            <Title level={2}>
              <Button
              className="back-button"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
            >
            </Button>
            {apartment.title}
            </Title>
            <Paragraph>
              Tòa nhà:{' '}
              <Link to={`/buildings/${apartment.buildingId}`}>
                {buildingState.data?.name || 'Đang tải tên tòa nhà...'}
              </Link>
            </Paragraph>

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card className="detail-metric-card" bordered={false}>
                  <Statistic
                    title="Diện tích"
                    value={apartment.area}
                    suffix="m2"
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="detail-metric-card" bordered={false}>
                  <Statistic
                    title="Tiền phòng"
                    value={apartment.price.base}
                    formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
                    suffix="VND"
                    prefix={<BankOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="detail-metric-card" bordered={false}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Phí dịch vụ tòa nhà</Text>
                  {buildingState.data?.fees?.length > 0 ? (
                    <Space direction="vertical" size={2} style={{ marginTop: 6, width: '100%' }}>
                      {buildingState.data.fees.map((fee) => (
                        <Text key={fee.id} style={{ fontSize: 12 }}>
                          <ThunderboltOutlined style={{ marginRight: 4 }} />
                          {fee.name}: {new Intl.NumberFormat('vi-VN').format(fee.price)} /{fee.unit}
                        </Text>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">Đang cập nhật...</Text>
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="Thông tin căn hộ" className="detail-section-card">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Loại phòng">
                  {apartment.type?.name || 'Đang cập nhật...'}
                </Descriptions.Item>
                <Descriptions.Item label="Vị trí tầng">
                  {apartment.floor?.name || 'Đang cập nhật...'}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng người ở tối đa">
                  {apartment.maxTenants || 0} người
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {apartment.status?.title || 'Đang cập nhật...'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Alert
              type="info"
              showIcon
              message="Lưu ý khi thuê phòng"
              description="Thông tin phí điện nước được tính theo mức sử dụng thực tế hàng tháng. Liên hệ để nhận báo giá chốt theo nhu cầu ở của bạn."
            />
          </Space>
        </Col>

        <Col xs={24} lg={10}>
          <Space direction="vertical" size={16} style={{ width: '100%' }} className="sticky-contact-card">
            <Card title="Chi tiết giá thuê và tiện ích" className="price-card detail-section-card">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tiền phòng">
                  {formatCurrency(apartment.price.base)} / tháng
                </Descriptions.Item>
               
                {(buildingState.data?.fees || []).map((fee) => (
                  <Descriptions.Item key={fee.id} label={fee.name}>
                    {new Intl.NumberFormat('vi-VN').format(fee.price)} VND / {fee.unit}
                  </Descriptions.Item>
                ))}
                
              </Descriptions>

              <Divider />

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text strong>Ước tính chi phí hàng tháng</Text>
              

                <Card size="small" className="estimate-box">
                  <Text type="secondary">Ước tính thanh toán hàng tháng</Text>
                  <Title level={4} style={{ margin: '6px 0 0' }}>
                    {formatCurrency(monthlyEstimate)}
                  </Title>
                  <Text type="secondary">
                    Công thức: tiền phòng + dịch vụ 
                  </Text>
                </Card>
              </Space>
            </Card>

            <Card title="Liên hệ chủ nhà" className="detail-section-card">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text type="secondary">
                  Đặt lịch xem phòng hoặc trao đổi thông tin hợp đồng nhanh qua
                  phone/Zalo.
                </Text>
                <ContactButtons
                  phone={apartment.contact.phone}
                  zalo={apartment.contact.zalo}
                />
              </Space>
            </Card>

            <Card title="Bản đồ" className="detail-section-card">
              {googleMapsSearchUrl ? (
                <>
                  {googleMapsEmbedUrl ? (
                    <iframe
                      title="google-map-mini"
                      src={googleMapsEmbedUrl}
                      className="mini-map-frame"
                      loading="lazy"
                    />
                  ) : null}
                  <Paragraph style={{ marginBottom: 10 }}>
                    {buildingState.data?.address || 'Đang cập nhật địa chỉ...'}
                  </Paragraph>
                  
                </>
              ) : (
                <Empty description="Không có địa chỉ để mở bản đồ" />
              )}
            </Card>

            <Card title="Chính sách thuê phòng" className="detail-section-card">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text>
                  <CalendarOutlined /> Thời gian thuê tối thiểu đề xuất: 6 tháng
                </Text>
                <Text>
                  <UserOutlined /> Phù hợp cho 1-3 người tùy theo cách bố trí
                </Text>
                <Text>
                  <CheckCircleOutlined /> Hỗ trợ xem phòng mỗi ngày từ 08:00 đến
                  21:00
                </Text>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          Căn hộ tương tự
        </Title>
        <Text type="secondary">
          Các lựa chọn gần với căn hộ bạn đang xem để so sánh nhanh giá và diện tích.
        </Text>
        {similarApartments.length > 0 ? (
          <Row gutter={[16, 16]}>
            {similarApartments.map((item) => (
              <Col xs={24} md={12} lg={8} key={item.id}>
                <ApartmentCard apartment={item} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Chưa có căn hộ tương tự" />
        )}
      </Space>
    </Space>
  );
}

export default ApartmentDetailPage;
