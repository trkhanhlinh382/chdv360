import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Typography, message, Popconfirm, Divider, Badge, Row, Col, Drawer, List, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, EnvironmentOutlined, SettingOutlined } from '@ant-design/icons';
import { api } from '../services/api';


const { Title, Text, Paragraph } = Typography;

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [servicesDrawerOpen, setServicesDrawerOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [serviceForm] = Form.useForm();
  
  const currentUser = api.getCurrentUser();

  const isAdmin = currentUser?.role === 'admin';

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await api.getBuildings();
      setBuildings(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách tòa nhà');
    } finally {
      setLoading(false);
    }
  };

  const handleManageServices = (record) => {
    setSelectedBuilding(record);
    setServicesDrawerOpen(true);
  };

  const handleAddService = async (values) => {
    try {
      const updatedServices = [...(selectedBuilding.services || []), {
        name: values.name,
        fee: values.fee,
        unit: values.unit || 'phòng/tháng',
        active: true
      }];
      const updatedBuilding = await api.updateBuilding(selectedBuilding._id, {
        ...selectedBuilding,
        services: updatedServices
      });
      setSelectedBuilding(updatedBuilding.data);
      message.success('Đã thêm dịch vụ mới thành công');
      serviceForm.resetFields();
      fetchBuildings();
    } catch (error) {
      message.error(error.message || 'Thêm dịch vụ thất bại');
    }
  };

  const handleDeleteService = async (index) => {
    try {
      const updatedServices = (selectedBuilding.services || []).filter((_, i) => i !== index);
      const updatedBuilding = await api.updateBuilding(selectedBuilding._id, {
        ...selectedBuilding,
        services: updatedServices
      });
      setSelectedBuilding(updatedBuilding.data);
      message.success('Đã xóa dịch vụ thành công');
      fetchBuildings();
    } catch (error) {
      message.error(error.message || 'Xóa dịch vụ thất bại');
    }
  };


  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      address: record.address,
      region: record.region,
      numberOfFloors: record.numberOfFloors,
      parkingCapacity: record.parkingCapacity,
      description: record.description,
      electricPrice: record.defaultFees?.electricPrice || 4000,
      waterPrice: record.defaultFees?.waterPrice || 30000,
      serviceFee: record.defaultFees?.serviceFee || 150000,
      parkingFee: record.defaultFees?.parkingFee || 100000
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBuilding(id);
      message.success('Đã xóa tòa nhà thành công');
      fetchBuildings();
    } catch (error) {
      message.error(error.message || 'Xóa tòa nhà thất bại');
    }
  };

  const onFinish = async (values) => {
    const payload = {
      code: values.code,
      name: values.name,
      address: values.address,
      region: values.region,
      numberOfFloors: values.numberOfFloors,
      parkingCapacity: values.parkingCapacity,
      description: values.description,
      defaultFees: {
        electricPrice: values.electricPrice,
        waterPrice: values.waterPrice,
        serviceFee: values.serviceFee,
        parkingFee: values.parkingFee
      }
    };

    try {
      if (editingId) {
        await api.updateBuilding(editingId, payload);
        message.success('Cập nhật tòa nhà thành công');
      } else {
        await api.createBuilding(payload);
        message.success('Thêm tòa nhà thành công');
      }
      setModalOpen(false);
      fetchBuildings();
    } catch (error) {
      message.error(error.message || 'Thao tác thất bại');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Tên tòa nhà',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text style={{ color: '#524636', fontWeight: 600 }}>{text}</Text>
    },
    {
      title: 'Khu vực / Địa chỉ',
      key: 'address',
      render: (_, record) => (
        <div>
          <Badge status="processing" text={record.region} />
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {record.address}
          </Text>
        </div>
      )
    },
    {
      title: 'Số tầng',
      dataIndex: 'numberOfFloors',
      key: 'numberOfFloors'
    },
    {
      title: 'Bãi giữ xe',
      dataIndex: 'parkingCapacity',
      key: 'parkingCapacity',
      render: (cap) => `${cap} xe`
    },
    {
      title: 'Biểu phí mặc định',
      key: 'fees',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          • Điện: {formatCurrency(record.defaultFees?.electricPrice)}/kWh
          <br />
          • Nước: {formatCurrency(record.defaultFees?.waterPrice)}/m³
          <br />
          • Phí DV: {formatCurrency(record.defaultFees?.serviceFee)}/phòng
          <br />
          • Phí xe: {formatCurrency(record.defaultFees?.parkingFee)}/xe
        </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {isAdmin ? (
            <>
              <Button type="text" icon={<SettingOutlined style={{ color: '#9b8451' }} />} onClick={() => handleManageServices(record)}>Dịch vụ ({record.services?.length || 0})</Button>
              <Button type="text" icon={<EditOutlined style={{ color: '#bda46a' }} />} onClick={() => handleEdit(record)}>Sửa</Button>
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa tòa nhà này?"
                description="Tất cả các phòng liên quan phải được xóa sạch trước."
                onConfirm={() => handleDelete(record._id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            </>
          ) : (
            <Text type="secondary" italic>Chỉ đọc</Text>
          )}

        </Space>
      )
    }
  ];

  return (
    <Card 
      title={
        <Space>
          <ShopOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Quản Lý Tòa Nhà</Title>
        </Space>
      }
      extra={isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}>Thêm tòa nhà</Button>}
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <Table 
        dataSource={buildings} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Thông Tin Tòa Nhà' : 'Thêm Tòa Nhà Mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={720}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            numberOfFloors: 1,
            parkingCapacity: 20,
            electricPrice: 4000,
            waterPrice: 30000,
            serviceFee: 150000,
            parkingFee: 100000
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã tòa nhà" rules={[{ required: true, message: 'Nhập mã tòa nhà (Ví dụ: SR-01)' }]}>
                <Input placeholder="SR-01" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên tòa nhà" rules={[{ required: true, message: 'Nhập tên tòa nhà' }]}>
                <Input placeholder="Tòa nhà Sunrise Apartment" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="address" label="Địa chỉ chính xác" rules={[{ required: true, message: 'Nhập địa chỉ tòa nhà' }]}>
                <Input placeholder="Số 79 Nguyễn Thị Thập, P. Tân Hưng" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="region" label="Khu vực (Quận/Huyện)" rules={[{ required: true, message: 'Nhập quận huyện' }]}>
                <Input placeholder="Quận 7" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numberOfFloors" label="Số lượng tầng" rules={[{ required: true, message: 'Nhập số tầng' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parkingCapacity" label="Sức chứa xe tối đa (Cảnh báo quá tải)" rules={[{ required: true, message: 'Nhập sức chứa xe' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả chi tiết tòa nhà">
            <Input.TextArea rows={2} placeholder="Nhập tiện ích chung, vị trí, khoảng cách đến trường học/chợ..." />
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Cấu Hình Biểu Phí Mặc Định Của Tòa Nhà</Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="electricPrice" label="Giá điện (VND/kWh)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="waterPrice" label="Giá nước (VND/m³)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="serviceFee" label="Phí DV (VND/phòng)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="parkingFee" label="Phí giữ xe (VND/xe)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Dynamic Services Drawer */}
      <Drawer
        title={`Quản Lý Dịch Vụ - ${selectedBuilding?.name}`}
        placement="right"
        width={500}
        onClose={() => {
          setServicesDrawerOpen(false);
          setSelectedBuilding(null);
        }}
        open={servicesDrawerOpen}
        destroyOnClose
      >
        <div style={{ marginBottom: 20 }}>
          <Title level={5} style={{ color: '#524636', marginBottom: 12 }}>Thêm Dịch Vụ Mới</Title>
          <Form
            form={serviceForm}
            layout="vertical"
            onFinish={handleAddService}
          >
            <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true, message: 'Nhập tên dịch vụ (ví dụ: Internet cáp quang)' }]}>
              <Input placeholder="Ví dụ: Dịch vụ giặt ủi, Wifi..." />
            </Form.Item>
            <Row gutter={8}>
              <Col span={14}>
                <Form.Item name="fee" label="Mức phí (VND)" rules={[{ required: true, message: 'Nhập mức phí' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="unit" label="Đơn vị tính" initialValue="phòng/tháng">
                  <Input placeholder="phòng/tháng" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none', width: '100%' }}>
                Thêm vào hệ thống
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Divider style={{ color: '#bda46a' }}>Danh Sách Dịch Vụ Hiện Tại</Divider>

        <List
          dataSource={selectedBuilding?.services || []}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Bạn muốn xóa dịch vụ này?"
                  onConfirm={() => handleDeleteService(index)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger size="small">Xóa</Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<Text strong style={{ color: '#524636' }}>{item.name}</Text>}
                description={
                  <Space style={{ marginTop: 4 }}>
                    <Tag color="gold">{formatCurrency(item.fee)} / {item.unit}</Tag>
                    {item.active ? <Tag color="green">Hoạt động</Tag> : <Tag color="gray">Tạm ngưng</Tag>}
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Chưa có dịch vụ bổ sung nào. Hãy thêm ở trên!' }}
        />
      </Drawer>
    </Card>

  );
}
