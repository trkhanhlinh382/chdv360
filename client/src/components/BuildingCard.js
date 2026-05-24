import { EnvironmentOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Paragraph, Text, Title } = Typography;

function BuildingCard({ building }) {
  return (
    <Card
      hoverable
      cover={
        <img
          alt={building.name}
          src={building.images[0]}
          style={{ height: 220, objectFit: 'cover' }}
        />
      }
      className="entity-card"
    >
      <Title level={4} style={{ marginBottom: 8 }}>
        <Link to={`/buildings/${building.id}`}>{building.name}</Link>
      </Title>
      <Paragraph style={{ marginBottom: 12 }} type="secondary">
        <EnvironmentOutlined /> <Text type="secondary">{building.address}</Text>
      </Paragraph>
      <div>
        {building.amenities.slice(0, 3).map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>
    </Card>
  );
}

export default BuildingCard;
