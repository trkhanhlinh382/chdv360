import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Tag, Typography, message, Popconfirm, Divider, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserSwitchOutlined, SafetyOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const fetchBuildings = async () => {
    try {
      const res = await api.getBuildings();
      setBuildings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaff();
      setStaffList(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchStaff();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      password: '', // Keep empty when editing unless reset
      assignedBuildings: record.assignedBuildings?.map(b => b._id || b) || [],
      active: record.active
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteStaff(id);
      message.success('Đã xóa tài khoản nhân viên thành công');
      fetchStaff();
    } catch (error) {
      message.error(error.message || 'Xóa nhân viên thất bại');
    }
  };

  const onFinish = async (values) => {
    try {
      // Create payload. If editing and password is empty, don't submit password field
      const payload = {
        name: values.name,
        phone: values.phone,
        assignedBuildings: values.assignedBuildings,
        active: values.active
      };
      if (values.password) {
        payload.password = values.password;
      }

      if (editingId) {
        await api.updateStaff(editingId, payload);
        message.success('Cập nhật nhân viên thành công');
      } else {
        if (!values.password) {
          message.error('Mật khẩu là bắt buộc khi tạo tài khoản mới!');
          return;
        }
        await api.createStaff(payload);
        message.success('Đã cấp tài khoản quản lý tòa nhà mới');
      }
      setModalOpen(false);
      fetchStaff();
    } catch (error) {
      message.error(error.message || 'Thao tác thất bại');
    }
  };

  const columns = [
    {
      title: 'Họ tên nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong style={{ color: '#524636' }}>{text}</Text>
    },
    {
      title: 'Số điện thoại / Login',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: 'Tòa nhà quản lý',
      dataIndex: 'assignedBuildings',
      key: 'assignedBuildings',
      render: (assigned) => (
        <Space wrap>
          {assigned && assigned.length > 0 ? (
            assigned.map((b) => (
              <Tag key={b._id} color="gold">{b.name}</Tag>
            ))
          ) : (
            <Tag color="red">Chưa gán tòa nhà</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Đang hoạt động' : 'Tạm khóa'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined style={{ color: '#bda46a' }} />} onClick={() => handleEdit(record)}>Sửa / Đổi mật khẩu</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài khoản nhân viên này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card 
      title={
        <Space>
          <UserSwitchOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Quản Lý Tài Khoản Nhân Viên (Quản lý tòa nhà)</Title>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}
        >
          Cấp tài khoản nhân viên
        </Button>
      }
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <Table 
        dataSource={staffList} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Tài Khoản Nhân Viên' : 'Cấp Tài Khoản Quản Lý Mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={640}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            active: true,
            assignedBuildings: []
          }}
        >
          <Form.Item name="name" label="Họ tên nhân viên" rules={[{ required: true, message: 'Nhập họ tên nhân viên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại đăng nhập" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                <Input placeholder="0888888888" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="password" 
                label={editingId ? "Đổi mật khẩu mới (Để trống nếu giữ cũ)" : "Mật khẩu ban đầu"} 
                rules={editingId ? [] : [{ required: true, message: 'Nhập mật khẩu ban đầu' }]}
              >
                <Input.Password placeholder={editingId ? "Bỏ qua để giữ nguyên mật khẩu" : "••••••••"} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedBuildings" label="Gán toà nhà đảm nhận quản lý (Có thể chọn nhiều)">
            <Select mode="multiple" style={{ width: '100%' }} placeholder="Chọn các toà nhà đảm trách">
              {buildings.map(b => (
                <Option key={b._id} value={b._id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="active" label="Trạng thái tài khoản">
            <Select>
              <Option value={true}>Đang hoạt động</Option>
              <Option value={false}>Tạm ngưng hoạt động / Khóa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
