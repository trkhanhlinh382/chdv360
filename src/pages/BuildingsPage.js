import { ApartmentOutlined } from '@ant-design/icons';
import { Card, Col, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useBuildings } from '../services/api/hooks';

const { Paragraph, Title } = Typography;

function BuildingsPage() {
  const { data, error, isLoading, mutate } = useBuildings();
  const [keyword, setKeyword] = useState('');
  const [amenityFilter, setAmenityFilter] = useState();

  const amenityOptions = useMemo(() => {
    const items = data || [];
    return [...new Set(items.flatMap((item) => item.amenities))].map((item) => ({
      label: item,
      value: item
    }));
  }, [data]);

  const filteredBuildings = useMemo(() => {
    const items = data || [];
    return items.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const isKeywordMatch = normalizedKeyword
        ? `${item.name} ${item.address}`.toLowerCase().includes(normalizedKeyword)
        : true;
      const isAmenityMatch = amenityFilter
        ? item.amenities.includes(amenityFilter)
        : true;
      return isKeywordMatch && isAmenityMatch;
    });
  }, [data, keyword, amenityFilter]);

  if (isLoading) {
    return <LoadingView tip="Đang tải danh sách tòa nhà..." />;
  }

  if (error) {
    return <ErrorView message={error.message} onRetry={() => mutate()} />;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="hero-block">
        <Title style={{ marginBottom: 8 }}>
          <ApartmentOutlined /> Danh sách tòa nhà
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Có {data?.length || 0} tòa nhà đang có sẵn. Bấm vào từng thẻ để xem danh sách
          căn hộ.
        </Paragraph>
      </div>

     

      <Row gutter={[16, 16]}>
        {filteredBuildings.map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id}>
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export default BuildingsPage;
