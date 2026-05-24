import { MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

function ContactButtons({ phone, zalo }) {
  return (
    <Space wrap>
      <Button
        type="primary"
        icon={<PhoneOutlined />}
        href={`tel:${phone}`}
        size="large"
      >
        Gọi {phone}
      </Button>
      {zalo ? (
        <Button
          icon={<MessageOutlined />}
          href={zalo}
          target="_blank"
          rel="noopener noreferrer"
          size="large"
        >
          Nhắn Zalo
        </Button>
      ) : null}
    </Space>
  );
}

export default ContactButtons;
