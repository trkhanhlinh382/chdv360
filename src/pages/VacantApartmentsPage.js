import { ApartmentOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Input, Row, Select, Space, Tag, Typography } from 'antd';
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

function VacantApartmentsPage() {
  const apartmentsState = useApartments();
  const buildingsState = useBuildings();
  const [keyword, setKeyword] = useState('');
  const [areaFilter, setAreaFilter] = useState();
  const [buildingFilter, setBuildingFilter] = useState();

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
    const normalizedKeyword = normalizeText(keyword);

    return vacantApartments.filter((item) => {
      const building = buildingMap.get(String(item.buildingId));
      const area = extractAreaFromAddress(building?.address);

      const isAreaMatch = areaFilter ? area === areaFilter : true;
      const isBuildingMatch = buildingFilter ? String(item.buildingId) === buildingFilter : true;
      const isKeywordMatch = normalizedKeyword
        ? normalizeText(`${item.title} ${building?.name || ''} ${building?.address || ''}`).includes(
            normalizedKeyword
          )
        : true;

      return isAreaMatch && isBuildingMatch && isKeywordMatch;
    });
  }, [vacantApartments, buildingMap, areaFilter, buildingFilter, keyword]);

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
        <Title style={{ marginBottom: 8 }}>
          <ApartmentOutlined /> Phòng trống sẵn
        </Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Xem nhanh các căn hộ đang trống, lọc theo khu vực và tòa nhà để tìm phòng phù hợp.
        </Paragraph>
      </div>

      <Card className="filter-card" bordered={false}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={10} lg={9}>
            <Input
              placeholder="Tìm theo tên phòng, tòa nhà, địa chỉ"
              size="large"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Col>
          <Col xs={24} md={7} lg={6}>
            <Select
              allowClear
              placeholder="Lọc theo khu vực"
              size="large"
              style={{ width: '100%' }}
              options={areaOptions}
              value={areaFilter}
              onChange={(value) => setAreaFilter(value)}
            />
          </Col>
          <Col xs={24} md={7} lg={6}>
            <Select
              allowClear
              placeholder="Lọc theo tòa nhà"
              size="large"
              style={{ width: '100%' }}
              options={buildingOptions}
              value={buildingFilter}
              onChange={(value) => setBuildingFilter(value)}
            />
          </Col>
          <Col xs={24} lg={3}>
            <Tag color="gold" style={{ width: '100%', textAlign: 'center', padding: 8 }}>
              {filteredApartments.length} kết quả
            </Tag>
          </Col>
        </Row>
      </Card>

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
              <Col xs={24} sm={12} lg={8} key={apartment.id}>
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
  );
}

export default VacantApartmentsPage;
