import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, Tag, Row, Col, Typography, message, Popconfirm, Divider, Badge, Tooltip, Upload } from 'antd';

import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined, InfoCircleOutlined, ToolOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ApartmentManagement() {
  const [apartments, setApartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  const fetchBuildings = async () => {
    try {
      const res = await api.getBuildings();
      setBuildings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const res = await api.getApartments();
      setApartments(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách căn hộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchApartments();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setUploadedImages([]);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setUploadedImages(record.images || []);
    form.setFieldsValue({
      buildingId: record.buildingId?._id || record.buildingId,
      name: record.name,
      code: record.code,
      floor: record.floor,
      type: record.type,
      area: record.area,
      maxTenants: record.maxTenants,
      deposit: record.deposit,
      price: record.price,
      status: record.status,
      amenities: record.amenities,
      assets: record.assets || []
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteApartment(id);
      message.success('Đã xóa căn hộ thành công');
      fetchApartments();
    } catch (error) {
      message.error(error.message || 'Xóa căn hộ thất bại');
    }
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      images: uploadedImages
    };
    try {
      if (editingId) {
        await api.updateApartment(editingId, payload);
        message.success('Cập nhật căn hộ thành công');
      } else {
        await api.createApartment(payload);
        message.success('Thêm căn hộ mới thành công');
      }
      setModalOpen(false);
      fetchApartments();
    } catch (error) {
      message.error(error.message || 'Thao tác thất bại');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = [
    {
      title: 'Mã phòng',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Tòa nhà',
      dataIndex: ['buildingId', 'name'],
      key: 'buildingName'
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const hasImg = record.images && record.images.length > 0;
        return (
          <Space>
            {hasImg ? (
              <img 
                src={record.images[0]} 
                alt="Apartment" 
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #f0edf6' }} 
              />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#faf8f5', border: '1px solid #f0edf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bda46a' }}>
                <ApartmentOutlined style={{ fontSize: 20 }} />
              </div>
            )}
            <Text>{text}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Tầng',
      dataIndex: 'floor',
      key: 'floor'
    },
    {
      title: 'Loại / Diện tích',
      key: 'info',
      render: (_, record) => `${record.type} / ${record.area}m²`
    },
    {
      title: 'Giá thuê phòng',
      dataIndex: 'price',
      key: 'price',
      render: (p) => <Text style={{ color: '#bda46a', fontWeight: 600 }}>{formatCurrency(p)}</Text>
    },
    {
      title: 'Tiền cọc',
      dataIndex: 'deposit',
      key: 'deposit',
      render: (d) => formatCurrency(d)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let label = 'Trống';
        if (status === 'Occupied') {
          color = 'gold';
          label = 'Đã thuê';
        } else if (status === 'Maintenance') {
          color = 'red';
          label = 'Đang bảo trì';
        }
        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Kiểm kê tài sản',
      key: 'assets',
      render: (_, record) => {
        const total = record.assets?.length || 0;
        const broken = record.assets?.filter(a => a.status === 'Broken').length || 0;
        return (
          <Tooltip title={`Có ${total} thiết bị. ${broken} thiết bị hỏng.`}>
            <Badge 
              count={broken > 0 ? broken : 0} 
              color="red"
              offset={[8, 0]}
            >
              <Tag color={broken > 0 ? 'red' : 'blue'} icon={<ToolOutlined />}>
                {total} tài sản
              </Tag>
            </Badge>
          </Tooltip>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined style={{ color: '#bda46a' }} />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn chắc chắn muốn xóa căn hộ này?"
            onConfirm={() => handleDelete(record._id)}
            disabled={record.status === 'Occupied'}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger disabled={record.status === 'Occupied'} icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const assetStatuses = [
    { value: 'New', label: 'Mới 100%' },
    { value: 'Good', label: 'Tốt' },
    { value: 'Degraded', label: 'Hao mòn/Cũ' },
    { value: 'Broken', label: 'Hỏng' }
  ];

  return (
    <Card 
      title={
        <Space>
          <ApartmentOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Quản Lý Căn Hộ</Title>
        </Space>
      }
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}>Thêm căn hộ</Button>}
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <Table 
        dataSource={apartments} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Thông Tin Căn Hộ' : 'Thêm Căn Hộ Mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            floor: 'Tầng 1',
            type: 'Studio',
            maxTenants: 2,
            status: 'Vacant',
            assets: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="buildingId" label="Tòa nhà" rules={[{ required: true, message: 'Chọn tòa nhà' }]}>
                <Select placeholder="Chọn tòa nhà sở tại">
                  {buildings.map(b => (
                    <Option key={b._id} value={b._id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="code" label="Mã phòng" rules={[{ required: true, message: 'Nhập mã phòng (Ví dụ: SR-101)' }]}>
                <Input placeholder="SR-101" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: 'Nhập tên phòng' }]}>
                <Input placeholder="Phòng 101" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="floor" label="Tầng" rules={[{ required: true }]}>
                <Input placeholder="Tầng 1" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="type" label="Loại phòng" rules={[{ required: true }]}>
                <Select>
                  <Option value="Studio">Studio</Option>
                  <Option value="1PN">1 Phòng Ngủ</Option>
                  <Option value="2PN">2 Phòng Ngủ</Option>
                  <Option value="Duplex">Duplex (Gác lửng)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="area" label="Diện tích (m²)" rules={[{ required: true, message: 'Nhập diện tích' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maxTenants" label="Số người ở tối đa" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="price" label="Đơn giá phòng/tháng (VND)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deposit" label="Tiền đặt cọc phòng (VND)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái hiện tại" rules={[{ required: true }]}>
                <Select disabled={editingId && form.getFieldValue('status') === 'Occupied'}>
                  <Option value="Vacant">Trống (Sẵn sàng cho thuê)</Option>
                  <Option value="Occupied" disabled>Đã cho thuê (Cập nhật qua khách thuê)</Option>
                  <Option value="Maintenance">Đang sửa chữa / Bảo trì</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="amenities" label="Tiện nghi đi kèm (Chọn nhiều)">
            <Select mode="tags" style={{ width: '100%' }} placeholder="Chọn hoặc nhập tiện ích phòng">
              <Option value="Ban công">Ban công</Option>
              <Option value="Cửa sổ thoáng">Cửa sổ thoáng</Option>
              <Option value="Máy giặt riêng">Máy giặt riêng</Option>
              <Option value="Cực kỳ yên tĩnh">Cực kỳ yên tĩnh</Option>
              <Option value="Khóa vân tay">Khóa vân tay</Option>
              <Option value="Cho phép nuôi thú cưng">Cho phép nuôi thú cưng</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Hình Ảnh Căn Hộ</Divider>

          <Form.Item label="Tải ảnh căn hộ lên (Tối đa 2MB mỗi ảnh)">
            <Upload
              accept="image/*"
              multiple
              beforeUpload={async (file) => {
                try {
                  const compressed = await compressImage(file);
                  setUploadedImages(prev => [...prev, compressed]);
                } catch (error) {
                  message.error('Lỗi khi xử lý ảnh: ' + error.message);
                }
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<PlusOutlined />}>Chọn tệp ảnh</Button>
            </Upload>

            {uploadedImages.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                {uploadedImages.map((img, index) => (
                  <Col span={6} key={index}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                      <img 
                        src={img} 
                        alt="Preview" 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                        style={{ position: 'absolute', top: 5, right: 5, zIndex: 5, opacity: 0.85 }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>
            <ToolOutlined /> Bàn Giao Nội Thất & Thiết Bị (Room Inventory Check)
          </Divider>

          <Form.List name="assets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Nhập tên thiết bị (Ví dụ: Máy lạnh Daikin)' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Tên thiết bị (Ví dụ: Máy lạnh Daikin 1.5HP)" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'serialNumber']}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Mã Serial / Ký hiệu" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'status']}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select>
                          {assetStatuses.map(status => (
                            <Option key={status.value} value={status.value}>{status.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                    </Col>
                  </Row>
                ))}
                <Form.Item style={{ marginTop: 12 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm thiết bị bàn giao phòng
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}
