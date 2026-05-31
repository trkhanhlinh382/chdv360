import { ApartmentOutlined } from '@ant-design/icons';
import { Col, Row, Space, Typography, Pagination } from 'antd';
import { useState } from 'react';
import BuildingCard from '../components/BuildingCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useBuildings } from '../services/api/hooks';

const { Paragraph, Title } = Typography;

function BuildingsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const { data: buildings, total, error, isLoading, mutate } = useBuildings({
    page: currentPage,
    limit: pageSize
  });

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
          Có {total || 0} tòa nhà đang có sẵn. Bấm vào từng thẻ để xem danh sách
          căn hộ.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {buildings.map((building) => (
          <Col xs={24} sm={24} md={12} lg={8} key={building.id}>
            <BuildingCard building={building} />
          </Col>
        ))}
      </Row>

      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </Space>
  );
}

export default BuildingsPage;
