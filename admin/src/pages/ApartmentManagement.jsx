import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, Tag, Row, Col, Typography, message, Popconfirm, Divider, Badge, Tooltip, Upload, Tabs, Drawer, Dropdown } from 'antd';

import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined, InfoCircleOutlined, ToolOutlined, CheckCircleOutlined, CloseCircleOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;
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
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsApartment, setDetailsApartment] = useState(null);
  const [detailsTenant, setDetailsTenant] = useState(null);
  const [detailsContract, setDetailsContract] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const selectedBuildingId = Form.useWatch('buildingId', form);
  const selectedBuilding = buildings.find(b => b._id === selectedBuildingId);
  const buildingAmenities = selectedBuilding?.amenities || [];
  const defaultRoomAmenities = ["Ban công", "Cửa sổ thoáng", "Máy giặt riêng", "Cực kỳ yên tĩnh", "Khóa vân tay", "Cho phép nuôi thú cưng"];
  const mergedAmenities = Array.from(new Set([...buildingAmenities, ...defaultRoomAmenities]));

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

  const handleViewDetails = async (record) => {
    setDetailsApartment(record);
    setDetailsDrawerOpen(true);

    if (record.status === 'Occupied') {
      try {
        const tenantRes = await api.getTenants();
        const activeTenant = tenantRes.data.find(t => (t.apartmentId?._id || t.apartmentId) === record._id);
        setDetailsTenant(activeTenant || null);

        const contractRes = await api.getContracts();
        const activeContract = contractRes.data.find(c => (c.apartmentId?._id || c.apartmentId) === record._id);
        setDetailsContract(activeContract || null);
      } catch (error) {
        console.error('Không thể tải thông tin hợp đồng và khách thuê', error);
      }
    }
  };

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
      render: (_, record) => {
        const items = [
          {
            key: 'detail',
            label: 'Chi tiết',
            icon: <InfoCircleOutlined style={{ color: '#9b8451' }} />,
            onClick: () => handleViewDetails(record)
          },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined style={{ color: '#bda46a' }} />,
            onClick: () => handleEdit(record)
          },
          {
            key: 'delete',
            label: 'Xóa căn hộ',
            danger: true,
            icon: <DeleteOutlined />,
            disabled: record.status === 'Occupied',
            onClick: () => {
              Modal.confirm({
                title: 'Xác nhận xóa căn hộ',
                content: 'Bạn chắc chắn muốn xóa căn hộ này?',
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: () => handleDelete(record._id)
              });
            }
          }
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="primary" size="small" style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none', borderRadius: 6 }}>
              Thao tác <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        );
      }
    }
  ];

  const assetStatuses = [
    { value: 'New', label: 'Mới 100%' },
    { value: 'Good', label: 'Tốt' },
    { value: 'Degraded', label: 'Hao mòn/Cũ' },
    { value: 'Broken', label: 'Hỏng' }
  ];

  const filteredApartments = apartments.filter(apt => {
    const matchesSearch = 
      !searchQuery ||
      apt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBuilding = filterBuilding === 'all' || (apt.buildingId?._id || apt.buildingId) === filterBuilding;
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    
    return matchesSearch && matchesBuilding && matchesStatus;
  });

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
      <div style={{ marginBottom: 20, padding: 16, background: '#fafaf9', borderRadius: 10, border: '1px solid #f0edf6' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input 
              placeholder="Tìm theo tên hoặc mã phòng..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: '#82745f' }} />}
            />
          </Col>
          <Col xs={12} md={8}>
            <Select 
              style={{ width: '100%' }} 
              value={filterBuilding} 
              onChange={setFilterBuilding}
            >
              <Option value="all">Tất cả Tòa nhà</Option>
              {buildings.map(b => (
                <Option key={b._id} value={b._id}>{b.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={8}>
            <Select 
              style={{ width: '100%' }} 
              value={filterStatus} 
              onChange={setFilterStatus}
            >
              <Option value="all">Tất cả Trạng thái</Option>
              <Option value="Vacant">Trống</Option>
              <Option value="Occupied">Đã thuê</Option>
              <Option value="Maintenance">Bảo trì</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table 
        dataSource={filteredApartments} 
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

          <Form.Item name="amenities" label="Tiện nghi đi kèm (Chọn sẵn từ Tòa nhà hoặc nhập tự do)">
            <Select mode="tags" style={{ width: '100%' }} placeholder="Chọn hoặc nhập tiện ích phòng">
              {mergedAmenities.map(amenity => (
                <Option key={amenity} value={amenity}>{amenity}</Option>
              ))}
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

      {/* Immersive Apartment Details Drawer */}
      <Drawer
        title={<Title level={4} style={{ margin: 0, color: '#524636' }}>Chi Tiết Căn Hộ - {detailsApartment?.name}</Title>}
        placement="right"
        width={800}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setDetailsApartment(null);
          setDetailsTenant(null);
          setDetailsContract(null);
        }}
        open={detailsDrawerOpen}
        destroyOnClose
      >
        {detailsApartment && (
          <Tabs defaultActiveKey="1" style={{ marginTop: -12 }}>
            <Tabs.TabPane tab="Tổng quan & Tiện nghi" key="1">
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <div style={{ padding: 8, border: '1px solid #f0edf6', borderRadius: 12, backgroundColor: '#faf8f5' }}>
                    {detailsApartment.images && detailsApartment.images.length > 0 ? (
                      <Row gutter={[8, 8]} justify="center">
                        {detailsApartment.images.map((img, i) => (
                          <Col span={8} key={i}>
                            <img 
                              src={img} 
                              alt="Room interior" 
                              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0edf6', cursor: 'zoom-in' }}
                              onClick={() => {
                                Modal.info({
                                  title: 'Ảnh Căn Hộ',
                                  width: 600,
                                  maskClosable: true,
                                  content: <img src={img} style={{ width: '100%', borderRadius: 8 }} />,
                                  footer: null
                                });
                              }}
                            />
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#bda46a' }}>
                        <ApartmentOutlined style={{ fontSize: 48, display: 'block', margin: '0 auto 12px' }} />
                        <Text type="secondary">Căn hộ này chưa được tải ảnh lên.</Text>
                      </div>
                    )}
                  </div>
                </Col>

                <Col span={12}>
                  <Card title="Thông Tin Căn Hộ" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph><strong>Tên phòng:</strong> {detailsApartment.name}</Paragraph>
                    <Paragraph><strong>Mã phòng:</strong> <Tag color="gold">{detailsApartment.code}</Tag></Paragraph>
                    <Paragraph><strong>Tòa nhà:</strong> {detailsApartment.buildingId?.name}</Paragraph>
                    <Paragraph><strong>Tầng:</strong> {detailsApartment.floor}</Paragraph>
                    <Paragraph><strong>Loại căn hộ:</strong> {detailsApartment.type}</Paragraph>
                    <Paragraph><strong>Diện tích:</strong> {detailsApartment.area} m²</Paragraph>
                    <Paragraph><strong>Sức chứa tối đa:</strong> {detailsApartment.maxTenants} người</Paragraph>
                    <Paragraph>
                      <strong>Trạng thái:</strong>{' '}
                      {detailsApartment.status === 'Occupied' ? (
                        <Tag color="gold">Đã cho thuê</Tag>
                      ) : detailsApartment.status === 'Maintenance' ? (
                        <Tag color="red">Bảo trì</Tag>
                      ) : (
                        <Tag color="green">Còn trống</Tag>
                      )}
                    </Paragraph>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title="Giá Thuê & Tiền Cọc" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">Đơn Giá Thuê</Text>
                      <br />
                      <Text strong style={{ fontSize: 20, color: '#bda46a' }}>{formatCurrency(detailsApartment.price)}</Text><Text type="secondary">/tháng</Text>
                    </div>
                    <div>
                      <Text type="secondary">Tiền Đặt Cọc Phòng</Text>
                      <br />
                      <Text strong style={{ fontSize: 18, color: '#524636' }}>{formatCurrency(detailsApartment.deposit)}</Text>
                    </div>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card title="Tiện Nghi Đi Kèm" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    {detailsApartment.amenities && detailsApartment.amenities.length > 0 ? (
                      <Space size={[8, 8]} wrap>
                        {detailsApartment.amenities.map((item, idx) => (
                          <Tag color="gold" key={idx} style={{ padding: '4px 8px', borderRadius: 4 }}>{item}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary" italic>Chưa cấu hình danh sách tiện nghi.</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Khách thuê & Hợp đồng" key="2">
              {detailsApartment.status === 'Occupied' ? (
                <Row gutter={[16, 16]}>
                  {detailsTenant ? (
                    <Col span={12}>
                      <Card title="Hồ Sơ Khách Thuê (Chính)" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                        <Paragraph><strong>Họ tên:</strong> <Text strong style={{ color: '#524636' }}>{detailsTenant.name}</Text></Paragraph>
                        <Paragraph><strong>Số điện thoại:</strong> {detailsTenant.phone}</Paragraph>
                        <Paragraph><strong>Số CCCD:</strong> {detailsTenant.identityCard}</Paragraph>
                        <Paragraph><strong>Nghề nghiệp:</strong> {detailsTenant.occupation || 'N/A'}</Paragraph>
                        <Paragraph><strong>Cọc thực đóng:</strong> {formatCurrency(detailsTenant.depositPaid)}</Paragraph>
                        
                        {(detailsTenant.identityCardFront || detailsTenant.identityCardBack) && (
                          <div style={{ marginTop: 12 }}>
                            <Text strong style={{ display: 'block', marginBottom: 6 }}>Ảnh chụp CCCD:</Text>
                            <Row gutter={8}>
                              {detailsTenant.identityCardFront && (
                                <Col span={12}>
                                  <img 
                                    src={detailsTenant.identityCardFront} 
                                    alt="CCCD Front" 
                                    style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0edf6', cursor: 'pointer' }}
                                    onClick={() => Modal.info({ title: 'Mặt trước CCCD', content: <img src={detailsTenant.identityCardFront} style={{ width: '100%' }} />, footer: null, maskClosable: true })}
                                  />
                                </Col>
                              )}
                              {detailsTenant.identityCardBack && (
                                <Col span={12}>
                                  <img 
                                    src={detailsTenant.identityCardBack} 
                                    alt="CCCD Back" 
                                    style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0edf6', cursor: 'pointer' }}
                                    onClick={() => Modal.info({ title: 'Mặt sau CCCD', content: <img src={detailsTenant.identityCardBack} style={{ width: '100%' }} />, footer: null, maskClosable: true })}
                                  />
                                </Col>
                              )}
                            </Row>
                          </div>
                        )}
                      </Card>
                    </Col>
                  ) : (
                    <Col span={12}>
                      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                        <Text type="secondary" italic>Không tìm thấy hồ sơ khách thuê chính.</Text>
                      </Card>
                    </Col>
                  )}

                  {detailsContract ? (
                    <Col span={12}>
                      <Card title="Hợp Đồng Thuê Căn Hộ" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                        <Paragraph><strong>Số hợp đồng:</strong> <Text strong style={{ color: '#9b8451' }}>{detailsContract.contractNumber}</Text></Paragraph>
                        <Paragraph><strong>Đơn giá thuê:</strong> {formatCurrency(detailsContract.rentalPrice)}/tháng</Paragraph>
                        <Paragraph><strong>Tiền cọc:</strong> {formatCurrency(detailsContract.depositAmount)}</Paragraph>
                        <Paragraph><strong>Chu kỳ đóng:</strong> {detailsContract.paymentCycle} tháng/lần</Paragraph>
                        <Paragraph><strong>Ngày lập hóa đơn:</strong> Ngày {detailsContract.billingDate} hàng tháng</Paragraph>
                        <Paragraph><strong>Thời hạn hợp đồng:</strong> Từ {new Date(detailsContract.startDate).toLocaleDateString('vi-VN')} đến {new Date(detailsContract.endDate).toLocaleDateString('vi-VN')}</Paragraph>
                        
                        {detailsContract.attachments && detailsContract.attachments.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <Button 
                              type="primary" 
                              ghost 
                              size="small" 
                              onClick={() => Modal.info({
                                title: 'Xem các bản quét hợp đồng',
                                width: 650,
                                content: (
                                  <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    {detailsContract.attachments.map((att, idx) => (
                                      <img key={idx} src={att} alt={`Page ${idx + 1}`} style={{ width: '100%', marginBottom: 12, borderRadius: 4 }} />
                                    ))}
                                  </div>
                                ),
                                footer: null,
                                maskClosable: true
                              })}
                            >
                              Xem {detailsContract.attachments.length} trang đính kèm
                            </Button>
                          </div>
                        )}
                      </Card>
                    </Col>
                  ) : (
                    <Col span={12}>
                      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                        <Text type="secondary" italic>Không tìm thấy thông tin hợp đồng hoạt động.</Text>
                      </Card>
                    </Col>
                  )}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#faf8f5', borderRadius: 8, border: '1px solid #f0edf6' }}>
                  <InfoCircleOutlined style={{ fontSize: 36, color: '#bda46a', marginBottom: 12 }} />
                  <br />
                  <Text type="secondary">Căn hộ này đang trống. Hãy đăng ký khách thuê hoặc hợp đồng mới để hiển thị thông tin.</Text>
                </div>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Kiểm kê nội thất (${detailsApartment.assets?.length || 0})`} key="3">
              <Table 
                dataSource={detailsApartment.assets || []}
                rowKey="_id"
                pagination={false}
                columns={[
                  {
                    title: 'Tên thiết bị / Nội thất',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => <Text strong style={{ color: '#524636' }}>{text}</Text>
                  },
                  {
                    title: 'Mã Serial / Ký hiệu',
                    dataIndex: 'serialNumber',
                    key: 'serialNumber',
                    render: (text) => text || <Text type="secondary" italic>N/A</Text>
                  },
                  {
                    title: 'Trạng thái bàn giao',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      let color = 'blue';
                      let label = 'Tốt';
                      if (status === 'New') {
                        color = 'green';
                        label = 'Mới 100%';
                      } else if (status === 'Degraded') {
                        color = 'orange';
                        label = 'Cũ/Hao mòn';
                      } else if (status === 'Broken') {
                        color = 'red';
                        label = 'Đã hỏng';
                      }
                      return <Tag color={color}>{label}</Tag>;
                    }
                  }
                ]}
                locale={{ emptyText: 'Chưa lập danh sách kiểm kê bàn giao nội thất cho phòng này.' }}
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </Card>
  );
}
