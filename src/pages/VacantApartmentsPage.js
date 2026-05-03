import { ApartmentOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import ApartmentCard from '../components/ApartmentCard';
import { ErrorView, LoadingView } from '../components/StateView';
import { useApartments, useBuildings } from '../services/api/hooks';

const { Paragraph, Text, Title } = Typography;

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function extractAreaFromAddress(address) {
  const parts = (address || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return 'Khac';
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

function isPriceInRange(price, range) {
  if (!range) {
    return true;
  }

  if (range === 'under-5') {
    return price < 5000000;
  }

  if (range === '5-8') {
    return price >= 5000000 && price <= 8000000;
  }

  if (range === '8-12') {
    return price > 8000000 && price <= 12000000;
  }

  if (range === 'over-12') {
    return price > 12000000;
  }

  return true;
}

function isAreaInRange(area, range) {
  if (!range) {
    return true;
  }

  if (range === 'under-20') {
    return area < 20;
  }

  if (range === '20-30') {
    return area >= 20 && area <= 30;
  }

  if (range === '30-45') {
    return area > 30 && area <= 45;
  }

  if (range === 'over-45') {
    return area > 45;
  }

  return true;
}

function VacantApartmentsPage() {
  const apartmentsState = useApartments();
  const buildingsState = useBuildings();
  const [keyword, setKeyword] = useState('');
  const [areaFilter, setAreaFilter] = useState();
  const [buildingFilter, setBuildingFilter] = useState();
  const [priceRangeFilter, setPriceRangeFilter] = useState();
  const [areaRangeFilter, setAreaRangeFilter] = useState();
  const [priceSort, setPriceSort] = useState('price-asc');

  // applied state — results only update when user clicks "Áp dụng"
  const [applied, setApplied] = useState({
    keyword: '',
    areaFilter: undefined,
    buildingFilter: undefined,
    priceRangeFilter: undefined,
    areaRangeFilter: undefined,
    priceSort: 'price-asc'
  });

  const applyFilters = () => {
    setApplied({ keyword, areaFilter, buildingFilter, priceRangeFilter, areaRangeFilter, priceSort });
  };

  const resetFilters = () => {
    setKeyword('');
    setAreaFilter(undefined);
    setBuildingFilter(undefined);
    setPriceRangeFilter(undefined);
    setAreaRangeFilter(undefined);
    setPriceSort('price-asc');
    setApplied({ keyword: '', areaFilter: undefined, buildingFilter: undefined, priceRangeFilter: undefined, areaRangeFilter: undefined, priceSort: 'price-asc' });
  };

  const buildingMap = useMemo(() => {
    return new Map((buildingsState.data || []).map((item) => [String(item.id), item]));
  }, [buildingsState.data]);

  const vacantApartments = useMemo(() => {
    return (apartmentsState.data || []).filter((item) => isVacantApartment(item));
  }, [apartmentsState.data]);

  const areaOptions = useMemo(() => {
    const areas = vacantApartments
      .map((item) => extractAreaFromAddress(buildingMap.get(String(item.buildingId))?.address))
      .filter(Boolean);

    return [...new Set(areas)].sort().map((item) => ({
      label: item,
      value: item
    }));
  }, [vacantApartments, buildingMap]);

  const buildingOptions = useMemo(() => {
    const buildingIds = [...new Set(vacantApartments.map((item) => String(item.buildingId)))];

    return buildingIds
      .map((id) => {
        const building = buildingMap.get(id);
        if (!building) {
          return null;
        }

        return {
          label: building.name,
          value: id
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vacantApartments, buildingMap]);

  const filteredApartments = useMemo(() => {
    const normalizedKeyword = normalizeText(applied.keyword);

    const filtered = vacantApartments.filter((item) => {
      const building = buildingMap.get(String(item.buildingId));
      const area = extractAreaFromAddress(building?.address);
      const price = item.price?.base || 0;
      const roomArea = item.area || 0;

      const isAreaMatch = applied.areaFilter ? area === applied.areaFilter : true;
      const isBuildingMatch = applied.buildingFilter ? String(item.buildingId) === applied.buildingFilter : true;
      const isPriceMatch = isPriceInRange(price, applied.priceRangeFilter);
      const isRoomAreaMatch = isAreaInRange(roomArea, applied.areaRangeFilter);
      const isKeywordMatch = normalizedKeyword
        ? normalizeText(`${item.title} ${building?.name || ''} ${building?.address || ''}`).includes(
            normalizedKeyword
          )
        : true;

      return (
        isAreaMatch &&
        isBuildingMatch &&
        isPriceMatch &&
        isRoomAreaMatch &&
        isKeywordMatch
      );
    });

    return filtered.sort((a, b) => {
      const priceA = a.price?.base || 0;
      const priceB = b.price?.base || 0;
      return applied.priceSort === 'price-desc' ? priceB - priceA : priceA - priceB;
    });
  }, [vacantApartments, buildingMap, applied]);

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
              {filteredApartments.length} kết quả
            </Tag>

            {filteredApartments.length === 0 ? (
              <div className="center-box">
                <Empty description="Không tìm thấy phòng trống phù hợp" />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredApartments.map((apartment) => {
                  const building = buildingMap.get(String(apartment.buildingId));
                  const area = extractAreaFromAddress(building?.address);

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
            )}
          </Space>
        </Col>
      </Row>
    </Space>
  );
}

export default VacantApartmentsPage;
