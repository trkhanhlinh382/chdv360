import { AreaChartOutlined, DollarOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Text, Title } = Typography;

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function ApartmentCard({ apartment }) {
  return (
    <Card
      hoverable
      cover={
        <img
          alt={apartment.title}
          src={apartment.images[0]}
          style={{ height: 220, objectFit: 'cover' }}
        />
      }
      className="entity-card"
    >
      <Title level={5} style={{ marginBottom: 10 }}>
        <Link to={`/apartments/${apartment.id}`}>{apartment.title}</Link>
      </Title>
      <Space direction="vertical" size={6} style={{ marginBottom: 10 }}>
        <Text>
          <DollarOutlined /> {formatCurrency(apartment.price.base)} VND/tháng
        </Text>
        <Text>
          <AreaChartOutlined /> {apartment.area} m2
        </Text>
      </Space>
      <div>
        {apartment.amenities.slice(0, 3).map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>
    </Card>
  );
}

export default ApartmentCard;
