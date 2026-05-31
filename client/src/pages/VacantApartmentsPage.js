import { ApartmentOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Row, Select, Space, Tag, Typography, Pagination } from 'antd';
import { useMemo, useState } from 'react';
import ApartmentCard from '../components/ApartmentCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartments, useBuildings } from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;

function extractAreaFromBuilding(building) {
  const region = (building?.region || '').trim();
  return region || 'Khác';
}

const PRICE_RANGE_OPTIONS = [
  { label: 'Dưới 5 triệu', value: 'under-5' },
  { label: '5 - 8 triệu', value: '5-8' },
  { label: '8 - 12 triệu', value: '8-12' },
  { label: 'Trên 12 triệu', value: 'over-12' }
];

const AREA_RANGE_OPTIONS = [
  { label: 'Dưới 20 m2', value: 'under-20' },
  { label: '20 - 30 m2', value: '20-30' },
  { label: '30 - 45 m2', value: '30-45' },
  { label: 'Trên 45 m2', value: 'over-45' }
];

const PRICE_SORT_OPTIONS = [
  { label: 'Giá thấp đến cao', value: 'price-asc' },
  { label: 'Giá cao đến thấp', value: 'price-desc' }
];

function VacantApartmentsPage() {
  const [keyword, setKeyword] = useState('');
  const [areaFilter, setAreaFilter] = useState();
  const [buildingFilter, setBuildingFilter] = useState();
  const [priceRangeFilter, setPriceRangeFilter] = useState();
  const [areaRangeFilter, setAreaRangeFilter] = useState();
  const [priceSort, setPriceSort] = useState('price-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // applied state — results only update when user clicks "Áp dụng"
  const [applied, setApplied] = useState({
    keyword: '',
    areaFilter: undefined,
    buildingFilter: undefined,
    priceRangeFilter: undefined,
    areaRangeFilter: undefined,
    priceSort: 'price-asc'
  });

  const apartmentsState = useApartments({
    page: currentPage,
    limit: pageSize,
    status: 'Vacant',
    keyword: applied.keyword,
    buildingId: applied.buildingFilter,
    priceRange: applied.priceRangeFilter,
    areaRange: applied.areaRangeFilter,
    sort: applied.priceSort,
    area: applied.areaFilter
  });
  const buildingsState = useBuildings();

  const applyFilters = () => {
    setApplied({ keyword, areaFilter, buildingFilter, priceRangeFilter, areaRangeFilter, priceSort });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setKeyword('');
    setAreaFilter(undefined);
    setBuildingFilter(undefined);
    setPriceRangeFilter(undefined);
    setAreaRangeFilter(undefined);
    setPriceSort('price-asc');
    setApplied({ keyword: '', areaFilter: undefined, buildingFilter: undefined, priceRangeFilter: undefined, areaRangeFilter: undefined, priceSort: 'price-asc' });
    setCurrentPage(1);
  };

  const buildingMap = useMemo(() => {
    return new Map((buildingsState.data || []).map((item) => [String(item.id), item]));
  }, [buildingsState.data]);

  const areaOptions = useMemo(() => {
    const areas = (buildingsState.data || [])
      .map((b) => b.region)
      .filter(Boolean);

    return [...new Set(areas)].sort().map((item) => ({
      label: item,
      value: item
    }));
  }, [buildingsState.data]);

  const buildingOptions = useMemo(() => {
    return (buildingsState.data || [])
      .map((b) => ({
        label: b.name,
        value: String(b.id)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [buildingsState.data]);

  const apartments = apartmentsState.data || [];
  const total = apartmentsState.total || 0;

  if (apartmentsState.isLoading || buildingsState.isLoading) {
    return <LoadingView tip="Đang tải danh sách phòng trống..." />;
  }

  if (apartmentsState.error) {
    return (
      <ErrorView
        message={apartmentsState.error.message}
        onRetry={() => apartmentsState.mutate()}
      />
    );
  }

  if (buildingsState.error) {
    return (
      <ErrorView
        message={buildingsState.error.message}
        onRetry={() => buildingsState.mutate()}
      />
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="hero-block">
        <Title level={2} style={{ marginBottom: 8 }}>
          <ApartmentOutlined /> Phòng trống sẵn
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Xem nhanh các căn hộ đang trống, lọc theo khu vực và tòa nhà để tìm phòng phù hợp.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={8} xl={7}>
          <Card className="filter-card sticky-contact-card" bordered={false}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text strong>Bộ lọc phòng trống</Text>

              <Input
                placeholder="Tìm theo tên phòng, tòa nhà, địa chỉ"
                size="large"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              <Select
                allowClear
                placeholder="Lọc theo khu vực"
                size="large"
                style={{ width: '100%' }}
                options={areaOptions}
                value={areaFilter}
                onChange={(value) => setAreaFilter(value)}
              />

              <Select
                allowClear
                placeholder="Lọc theo tòa nhà"
                size="large"
                style={{ width: '100%' }}
                options={buildingOptions}
                value={buildingFilter}
                onChange={(value) => setBuildingFilter(value)}
              />

              <Select
                allowClear
                placeholder="Khoảng giá"
                size="large"
                style={{ width: '100%' }}
                options={PRICE_RANGE_OPTIONS}
                value={priceRangeFilter}
                onChange={(value) => setPriceRangeFilter(value)}
              />

              <Select
                allowClear
                placeholder="Diện tích"
                size="large"
                style={{ width: '100%' }}
                options={AREA_RANGE_OPTIONS}
                value={areaRangeFilter}
                onChange={(value) => setAreaRangeFilter(value)}
              />

              <Select
                placeholder="Sắp xếp theo giá"
                size="large"
                style={{ width: '100%' }}
                options={PRICE_SORT_OPTIONS}
                value={priceSort}
                onChange={(value) => setPriceSort(value)}
              />

              <Button type="primary" onClick={applyFilters} size="large" block>
                Áp dụng bộ lọc
              </Button>
              <Button onClick={resetFilters} size="large" block>
                Xóa bộ lọc
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16} xl={17}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Tag color="gold" style={{ width: 'fit-content', padding: '6px 12px' }}>
              {total} kết quả
            </Tag>

            {apartments.length === 0 ? (
              <div className="center-box">
                <Empty description="Không tìm thấy phòng trống phù hợp" />
              </div>
            ) : (
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  {apartments.map((apartment) => {
                    const building = buildingMap.get(String(apartment.buildingId));
                    const area = extractAreaFromBuilding(building);

                    return (
                      <Col xs={24} sm={12} xl={8} key={apartment.id}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <ApartmentCard apartment={apartment} />
                          <Text type="secondary">
                            <EnvironmentOutlined /> {building?.name || 'Không rõ tòa nhà'} - {area}
                          </Text>
                        </Space>
                      </Col>
                    );
                  })}
                </Row>
                {total > pageSize && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
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
            )}
          </Space>
        </Col>
      </Row>
    </Space>
  );
}

export default VacantApartmentsPage;
