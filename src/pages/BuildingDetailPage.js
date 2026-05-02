import { LeftOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  InputNumber,
  Row,
  Slider,
  Space,
  Tag,
  Typography
} from 'antd';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApartmentCard from '../components/ApartmentCard';
import ImageGallery from '../components/ImageGallery';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartmentsByBuilding, useBuilding } from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;

function BuildingDetailPage() {
  const { buildingId } = useParams();
  const [maxPrice, setMaxPrice] = useState();
  const [minArea, setMinArea] = useState();

  const buildingState = useBuilding(buildingId);
  const apartmentsState = useApartmentsByBuilding(buildingId);

  const filteredApartments = useMemo(
    () => {
      const apartments = apartmentsState.data || [];
      return apartments.filter((item) => {
        const isPriceMatched = maxPrice ? item.price.base <= maxPrice : true;
        const isAreaMatched = minArea ? item.area >= minArea : true;
        return isPriceMatched && isAreaMatched;
      });
    },
    [apartmentsState.data, maxPrice, minArea]
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
      <Link to="/toa-nha">
        <Button icon={<LeftOutlined />} className="back-button" size="large">
          Quay lại tòa nhà
        </Button>
      </Link>

      <ImageGallery images={buildingState.data.images} />

      <div>
        <Title level={2}>{buildingState.data.name}</Title>
        <Paragraph>{buildingState.data.address}</Paragraph>
        <Space wrap>
          {buildingState.data.amenities.map((item) => (
            <Tag key={item} color="blue">
              {item}
            </Tag>
          ))}
        </Space>
      </div>

      <Card className="filter-card" bordered={false}>
        <Row gutter={[20, 18]} align="middle">
          <Col xs={24} lg={10}>
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
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text strong>Giá thuê tối đa</Text>
            <InputNumber
              min={0}
              step={500000}
              placeholder="VD: 9000000"
              value={maxPrice}
              onChange={(value) => setMaxPrice(value || undefined)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>Diện tích tối thiểu (m²)</Text>
            <InputNumber
              min={0}
              step={1}
              placeholder="VD: 30"
              value={minArea}
              onChange={(value) => setMinArea(value || undefined)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} lg={4}>
            <Button
              block
              onClick={() => {
                setMaxPrice(undefined);
                setMinArea(undefined);
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {filteredApartments.length === 0 ? (
        <Empty description="Không có căn hộ nào phù hợp với bộ lọc" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredApartments.map((apartment) => (
            <Col xs={24} md={12} lg={8} key={apartment.id}>
              <ApartmentCard apartment={apartment} />
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}

export default BuildingDetailPage;
