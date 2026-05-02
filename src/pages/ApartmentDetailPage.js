import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  InputNumber,
  Row,
  Space,
  Statistic,
  Tag,
  Typography
} from 'antd';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const apartmentState = useApartment(apartmentId);
  const buildingState = useBuilding(apartmentState.data?.buildingId);
  const sameBuildingApartmentsState = useApartmentsByBuilding(
    apartmentState.data?.buildingId
  );
  const allApartmentsState = useApartments();
  const [estimatedKwh, setEstimatedKwh] = useState(120);
  const [occupants, setOccupants] = useState(2);

  const apartment = apartmentState.data;

  const monthlyEstimate = useMemo(() => {
    if (!apartment) {
      return 0;
    }

    return (
      apartment.price.base +
      apartment.price.service +
      apartment.price.electric * estimatedKwh +
      apartment.price.water * occupants
    );
  }, [apartment, estimatedKwh, occupants]);

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

  const mapEmbedUrl = useMemo(() => {
    const lat = buildingState.data?.coordinates?.lat;
    const lng = buildingState.data?.coordinates?.lng;

    if (lat === undefined || lng === undefined) {
      return null;
    }

    const offset = 0.005;
    const bbox = [lng - offset, lat - offset, lng + offset, lat + offset]
      .map((item) => item.toFixed(6))
      .join('%2C');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [buildingState.data]);

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
      <Link to={`/buildings/${apartment.buildingId}`}>
        <Button icon={<LeftOutlined />} className="back-button" size="large">
          Quay lại tòa nhà
        </Button>
      </Link>

      <ImageGallery images={apartment.images} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Title level={2}>{apartment.title}</Title>
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
                  <Statistic
                    title="Phí dịch vụ"
                    value={apartment.price.service}
                    formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
                    suffix="VND"
                    prefix={<ThunderboltOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Space wrap>
              {apartment.amenities.map((item) => (
                <Tag key={item} color="cyan">
                  {item}
                </Tag>
              ))}
            </Space>

            <Card title="Thông tin tòa nhà" className="detail-section-card">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tên tòa nhà">
                  {buildingState.data?.name || 'Đang cập nhật...'}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {buildingState.data?.address || 'Đang cập nhật...'}
                </Descriptions.Item>
                <Descriptions.Item label="Tiện ích chung">
                  <Space wrap>
                    {(buildingState.data?.amenities || []).map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </Space>
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
                <Descriptions.Item label="Điện">
                  {formatCurrency(apartment.price.electric)} / kWh
                </Descriptions.Item>
                <Descriptions.Item label="Nước">
                  {formatCurrency(apartment.price.water)} / người
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">
                  {formatCurrency(apartment.price.service)} / tháng
                </Descriptions.Item>
                <Descriptions.Item label="Diện tích">
                  {apartment.area} m2
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text strong>Ước tính chi phí hàng tháng</Text>
                <Row gutter={12}>
                  <Col span={12}>
                    <Text type="secondary">Số kWh ước tính</Text>
                    <InputNumber
                      min={0}
                      step={10}
                      value={estimatedKwh}
                      onChange={(value) => setEstimatedKwh(value || 0)}
                      style={{ width: '100%', marginTop: 6 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Số người ở</Text>
                    <InputNumber
                      min={1}
                      step={1}
                      value={occupants}
                      onChange={(value) => setOccupants(value || 1)}
                      style={{ width: '100%', marginTop: 6 }}
                    />
                  </Col>
                </Row>

                <Card size="small" className="estimate-box">
                  <Text type="secondary">Ước tính thanh toán hàng tháng</Text>
                  <Title level={4} style={{ margin: '6px 0 0' }}>
                    {formatCurrency(monthlyEstimate)}
                  </Title>
                  <Text type="secondary">
                    Công thức: tiền phòng + dịch vụ + (điện × kWh) + (nước × số người)
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
              {mapEmbedUrl ? (
                <>
                  <iframe
                    title="building-map"
                    src={mapEmbedUrl}
                    className="mini-map-frame"
                    loading="lazy"
                  />
                  <Paragraph type="secondary" style={{ marginTop: 10, marginBottom: 0 }}>
                    Tọa độ: {buildingState.data.coordinates.lat},{' '}
                    {buildingState.data.coordinates.lng}
                  </Paragraph>
                </>
              ) : (
                <Empty description="Không có tọa độ bản đồ" />
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
