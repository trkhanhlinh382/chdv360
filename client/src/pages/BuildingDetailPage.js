import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  InputNumber,
  Row,
  Slider,
  Space,
  Tag,
  Typography
} from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApartmentCard from '../components/ApartmentCard';
import ImageGallery from '../components/ImageGallery';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartmentsByBuilding, useBuilding } from '../services/api/hooks';

const { Text, Title } = Typography;

function BuildingDetailPage() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const [maxPrice, setMaxPrice] = useState();
  const [minArea, setMinArea] = useState();
  const [appliedMaxPrice, setAppliedMaxPrice] = useState();
  const [appliedMinArea, setAppliedMinArea] = useState();

  const buildingState = useBuilding(buildingId);
  const apartmentsState = useApartmentsByBuilding(buildingId);

  const filteredApartments = useMemo(
    () => {
      const apartments = apartmentsState.data || [];
      return apartments.filter((item) => {
        const isPriceMatched = appliedMaxPrice ? item.price.base <= appliedMaxPrice : true;
        const isAreaMatched = appliedMinArea ? item.area >= appliedMinArea : true;
        return isPriceMatched && isAreaMatched;
      });
    },
    [apartmentsState.data, appliedMaxPrice, appliedMinArea]
  );

  const priceMaxBound = useMemo(() => {
    const apartments = apartmentsState.data || [];
    if (apartments.length === 0) {
      return 15000000;
    }
    return Math.max(...apartments.map((item) => item.price.base), 15000000);
  }, [apartmentsState.data]);

  if (buildingState.isLoading || apartmentsState.isLoading) {
    return <LoadingView tip="Đang tải thông tin tòa nhà..." />;
  }

  if (buildingState.error) {
    return (
      <ErrorView
        message={buildingState.error.message}
        onRetry={() => buildingState.mutate()}
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
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      

      <ImageGallery images={buildingState.data.images} />

      <div>
        <Title level={2}>
          <Button
            className="back-button"
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
          />
          {buildingState.data.name}
        </Title>
        <Card title="Thông tin tòa nhà" size="small" bordered={false} className="detail-section-card">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tên tòa nhà">
              {buildingState.data.name}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {buildingState.data.address}
            </Descriptions.Item>
            <Descriptions.Item label="Số phòng">
              {buildingState.data.numberRooms || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {buildingState.data.active ? 'Đang hoạt động' : 'Tạm ngưng'}
            </Descriptions.Item>
            {buildingState.data.paymentDay ? (
              <Descriptions.Item label="Ngày thanh toán">
                Hằng tháng ngày {buildingState.data.paymentDay}
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        </Card>
        
      </div>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={8} xl={7}>
          <Space direction="vertical" size={16} style={{ width: '100%' }} className="sticky-contact-card">
            <Card className="filter-card" bordered={false}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text strong>Bộ lọc căn hộ</Text>

                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Text strong>Giá thuê tối đa (VND)</Text>
                  <Slider
                    min={3000000}
                    max={priceMaxBound}
                    step={500000}
                    value={maxPrice || priceMaxBound}
                    onChange={(value) => setMaxPrice(value || undefined)}
                  />
                </Space>

                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text strong>Giá thuê tối đa</Text>
                  <InputNumber
                    min={0}
                    step={500000}
                    placeholder="VD: 9000000"
                    value={maxPrice}
                    onChange={(value) => setMaxPrice(value || undefined)}
                    style={{ width: '100%' }}
                  />
                </Space>

                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text strong>Diện tích tối thiểu (m²)</Text>
                  <InputNumber
                    min={0}
                    step={1}
                    placeholder="VD: 30"
                    value={minArea}
                    onChange={(value) => setMinArea(value || undefined)}
                    style={{ width: '100%' }}
                  />
                </Space>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    setAppliedMaxPrice(maxPrice);
                    setAppliedMinArea(minArea);
                  }}
                >
                  Áp dụng bộ lọc
                </Button>
                <Button
                  size="large"
                  block
                  onClick={() => {
                    setMaxPrice(undefined);
                    setMinArea(undefined);
                    setAppliedMaxPrice(undefined);
                    setAppliedMinArea(undefined);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </Space>
            </Card>

            {buildingState.data.address ? (
              <Card title="Bản đồ vị trí" className="detail-section-card" bordered={false}>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <iframe
                    title="building-google-map-mini"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(buildingState.data.address)}&output=embed`}
                    className="mini-map-frame"
                    loading="lazy"
                  />
                  
                </Space>
              </Card>
            ) : null}
          </Space>
        </Col>

        <Col xs={24} lg={16} xl={17}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Tag color="gold" style={{ width: 'fit-content', padding: '6px 12px' }}>
              {filteredApartments.length} kết quả
            </Tag>

            {filteredApartments.length === 0 ? (
              <Empty description="Không có căn hộ nào phù hợp với bộ lọc" />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredApartments.map((apartment) => (
                  <Col xs={24} md={12} xl={8} key={apartment.id}>
                    <ApartmentCard apartment={apartment} />
                  </Col>
                ))}
              </Row>
            )}
          </Space>
        </Col>
      </Row>
    </Space>
  );
}

export default BuildingDetailPage;
