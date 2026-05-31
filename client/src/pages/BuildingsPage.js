import { ApartmentOutlined } from '@ant-design/icons';
import { Col, Row, Space, Typography, Pagination } from 'antd';
import { useMemo, useState } from 'react';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useBuildings } from '../services/api/hooks';

const { Paragraph, Title } = Typography;

function BuildingsPage() {
  const { data, error, isLoading, mutate } = useBuildings();
  const [keyword] = useState('');
  const [amenityFilter] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

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

  const activePage = Math.min(currentPage, Math.ceil(filteredBuildings.length / pageSize) || 1);

  const paginatedBuildings = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return filteredBuildings.slice(startIndex, startIndex + pageSize);
  }, [filteredBuildings, activePage]);

  if (isLoading) {
    return <LoadingView tip="Đang tải danh sách tòa nhà..." />;
  }

  if (error) {
    return <ErrorView message={error.message} onRetry={() => mutate()} />;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="hero-block">
        <Title level={2} style={{ marginBottom: 8 }}>
          <ApartmentOutlined /> Danh sách tòa nhà
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Có {data?.length || 0} tòa nhà đang có sẵn. Bấm vào từng thẻ để xem danh sách
          căn hộ.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {paginatedBuildings.map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id}>
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>

      {filteredBuildings.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={activePage}
            pageSize={pageSize}
            total={filteredBuildings.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </Space>
  );
}

export default BuildingsPage;
