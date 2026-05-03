import {
  EnvironmentOutlined,
  MessageOutlined,
  PhoneOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

function ContactPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="hero-block">
        <Title style={{ marginBottom: 8 }}>Liên hệ</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Cần tư vấn nhanh về tòa nhà và căn hộ? Hãy liên hệ trực tiếp với đội ngũ hỗ
          trợ.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="entity-card">
            <Space direction="vertical" size={10}>
              <Text strong style={{ fontSize: 16 }}>
                <PhoneOutlined /> Hotline
              </Text>
              <Text>0927 360 360</Text>
              <Button type="primary" icon={<PhoneOutlined />} href="tel:0927360360">
                Gọi ngay
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="entity-card">
            <Space direction="vertical" size={10}>
              <Text strong style={{ fontSize: 16 }}>
                <WechatOutlined /> Zalo
              </Text>
              <Text>zalo.me/0927360360</Text>
              <Button
                icon={<MessageOutlined />}
                href="https://zalo.me/0927360360"
                target="_blank"
                rel="noreferrer"
              >
                Mở Zalo
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default ContactPage;
