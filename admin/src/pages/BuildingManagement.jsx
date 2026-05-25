import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Typography, message, Popconfirm, Divider, Badge, Row, Col, Drawer, List, Tag, Upload, Tabs, Select, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, EnvironmentOutlined, SettingOutlined, InfoCircleOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';
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

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsBuilding, setDetailsBuilding] = useState(null);
  const [detailsApartments, setDetailsApartments] = useState([]);
  const [servicesDrawerOpen, setServicesDrawerOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [serviceForm] = Form.useForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  
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

  const handleViewDetails = async (record) => {
    setDetailsBuilding(record);
    setDetailsDrawerOpen(true);
    try {
      const res = await api.getApartments({ buildingId: record._id });
      setDetailsApartments(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách căn hộ của tòa nhà');
    }
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
    setUploadedImages([]);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setUploadedImages(record.images || []);
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
      parkingFee: record.defaultFees?.parkingFee || 100000,
      amenities: record.amenities || []
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
      images: uploadedImages,
      amenities: values.amenities || [],
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
      render: (text, record) => {
        const hasImg = record.images && record.images.length > 0;
        return (
          <Space>
            {hasImg ? (
              <img 
                src={record.images[0]} 
                alt="Building" 
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #f0edf6' }} 
              />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#faf8f5', border: '1px solid #f0edf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bda46a' }}>
                <ShopOutlined style={{ fontSize: 20 }} />
              </div>
            )}
            <Text style={{ color: '#524636', fontWeight: 600 }}>{text}</Text>
          </Space>
        );
      }
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
      render: (_, record) => {
        const items = [
          {
            key: 'detail',
            label: 'Chi tiết',
            icon: <InfoCircleOutlined style={{ color: '#9b8451' }} />,
            onClick: () => handleViewDetails(record)
          }
        ];

        if (isAdmin) {
          items.push(
            {
              key: 'services',
              label: `Dịch vụ (${record.services?.length || 0})`,
              icon: <SettingOutlined style={{ color: '#bda46a' }} />,
              onClick: () => handleManageServices(record)
            },
            {
              key: 'edit',
              label: 'Chỉnh sửa',
              icon: <EditOutlined style={{ color: '#bda46a' }} />,
              onClick: () => handleEdit(record)
            },
            {
              key: 'delete',
              label: 'Xóa tòa nhà',
              danger: true,
              icon: <DeleteOutlined />,
              onClick: () => {
                Modal.confirm({
                  title: 'Xác nhận xóa tòa nhà',
                  content: 'Bạn có chắc chắn muốn xóa tòa nhà này? Tất cả các phòng liên quan phải được xóa sạch trước.',
                  okText: 'Xóa',
                  okType: 'danger',
                  cancelText: 'Hủy',
                  onOk: () => handleDelete(record._id)
                });
              }
            }
          );
        }

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

  const uniqueRegions = Array.from(new Set(buildings.map(b => b.region).filter(Boolean)));

  const filteredBuildings = buildings.filter(b => {
    const matchesSearch = 
      !searchQuery ||
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.region?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = filterRegion === 'all' || b.region === filterRegion;
    
    return matchesSearch && matchesRegion;
  });

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
      <div style={{ marginBottom: 20, padding: 16, background: '#fafaf9', borderRadius: 10, border: '1px solid #f0edf6' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Input 
              placeholder="Tìm theo tên, mã, địa chỉ hoặc khu vực..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: '#82745f' }} />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select 
              style={{ width: '100%' }} 
              value={filterRegion} 
              onChange={setFilterRegion}
            >
              <Option value="all">Tất cả Khu vực</Option>
              {uniqueRegions.map(r => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      <Table 
        dataSource={filteredBuildings} 
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

          <Form.Item name="amenities" label="Tiện ích & Tiện nghi chung của Tòa nhà (Chọn sẵn hoặc tự gõ rồi Enter)">
            <Select mode="tags" style={{ width: '100%' }} placeholder="Ví dụ: Thang máy, Bảo vệ 24/7, Giờ giấc tự do...">
              <Option value="Thang máy">Thang máy</Option>
              <Option value="Bảo vệ 24/7">Bảo vệ 24/7</Option>
              <Option value="Camera an ninh">Camera an ninh</Option>
              <Option value="Internet tốc độ cao">Internet tốc độ cao</Option>
              <Option value="Giờ giấc tự do">Giờ giấc tự do</Option>
              <Option value="Không chung chủ">Không chung chủ</Option>
              <Option value="Hầm để xe rộng">Hầm để xe rộng</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Hình Ảnh Tòa Nhà</Divider>

          <Form.Item label="Tải ảnh tòa nhà lên (Tối đa 2MB mỗi ảnh)">
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

      {/* Immersive Building Details Drawer */}
      <Drawer
        title={<Title level={4} style={{ margin: 0, color: '#524636' }}>Chi Tiết Tòa Nhà - {detailsBuilding?.name}</Title>}
        placement="right"
        width={850}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setDetailsBuilding(null);
          setDetailsApartments([]);
        }}
        open={detailsDrawerOpen}
        destroyOnClose
      >
        {detailsBuilding && (
          <Tabs defaultActiveKey="1" style={{ marginTop: -12 }}>
            <Tabs.TabPane tab="Tổng quan & Hình ảnh" key="1">
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <div style={{ padding: 8, border: '1px solid #f0edf6', borderRadius: 12, backgroundColor: '#faf8f5' }}>
                    {detailsBuilding.images && detailsBuilding.images.length > 0 ? (
                      <Row gutter={[8, 8]} justify="center">
                        {detailsBuilding.images.map((img, i) => (
                          <Col span={8} key={i}>
                            <img 
                              src={img} 
                              alt="Building scan" 
                              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0edf6', cursor: 'zoom-in' }}
                              onClick={() => {
                                Modal.info({
                                  title: 'Ảnh Tòa Nhà',
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
                        <ShopOutlined style={{ fontSize: 48, display: 'block', margin: '0 auto 12px' }} />
                        <Text type="secondary">Tòa nhà này chưa được tải ảnh lên.</Text>
                      </div>
                    )}
                  </div>
                </Col>

                <Col span={14}>
                  <Card title="Thông Tin Cơ Bản" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph><strong>Mã tòa nhà:</strong> <Tag color="gold">{detailsBuilding.code}</Tag></Paragraph>
                    <Paragraph><strong>Tên tòa nhà:</strong> <Text strong style={{ color: '#524636' }}>{detailsBuilding.name}</Text></Paragraph>
                    <Paragraph><strong>Khu vực:</strong> {detailsBuilding.region}</Paragraph>
                    <Paragraph><strong>Địa chỉ:</strong> {detailsBuilding.address}</Paragraph>
                    <Paragraph><strong>Số lượng tầng:</strong> {detailsBuilding.numberOfFloors} tầng</Paragraph>
                    <Paragraph><strong>Sức chứa xe tối đa:</strong> {detailsBuilding.parkingCapacity} xe</Paragraph>
                    <Paragraph>
                      <strong>Mô tả chi tiết:</strong>
                      <br />
                      <Text type="secondary" italic>{detailsBuilding.description || 'Không có mô tả chi tiết.'}</Text>
                    </Paragraph>
                  </Card>
                </Col>

                <Col span={10}>
                  <Card title="Biểu Phí Mặc Định" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Giá Điện</Text>
                        <br />
                        <Text strong style={{ fontSize: 16, color: '#524636' }}>{formatCurrency(detailsBuilding.defaultFees?.electricPrice)}/kWh</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Giá Nước</Text>
                        <br />
                        <Text strong style={{ fontSize: 16, color: '#524636' }}>{formatCurrency(detailsBuilding.defaultFees?.waterPrice)}/m³</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Phí dịch vụ mặc định</Text>
                        <br />
                        <Text strong style={{ fontSize: 16, color: '#524636' }}>{formatCurrency(detailsBuilding.defaultFees?.serviceFee)}/phòng</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Phí gửi xe mặc định</Text>
                        <br />
                        <Text strong style={{ fontSize: 16, color: '#524636' }}>{formatCurrency(detailsBuilding.defaultFees?.parkingFee)}/xe</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Danh sách phòng (${detailsApartments.length})`} key="2">
              <Table
                dataSource={detailsApartments}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Mã phòng',
                    dataIndex: 'code',
                    key: 'code',
                    render: (text) => <Text strong>{text}</Text>
                  },
                  {
                    title: 'Tên phòng',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: 'Tầng',
                    dataIndex: 'floor',
                    key: 'floor'
                  },
                  {
                    title: 'Loại / Diện tích',
                    key: 'type',
                    render: (_, r) => `${r.type} / ${r.area}m²`
                  },
                  {
                    title: 'Giá thuê',
                    dataIndex: 'price',
                    key: 'price',
                    render: (p) => <Text strong style={{ color: '#bda46a' }}>{formatCurrency(p)}</Text>
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
                        label = 'Bảo trì';
                      }
                      return <Tag color={color}>{label}</Tag>;
                    }
                  }
                ]}
              />
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Dịch vụ tòa nhà (${detailsBuilding.services?.length || 0})`} key="3">
              <List
                dataSource={detailsBuilding.services || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong style={{ color: '#524636' }}>{item.name}</Text>}
                      description={
                        <Space>
                          <Tag color="gold">{formatCurrency(item.fee)} / {item.unit}</Tag>
                          {item.active ? <Tag color="green">Đang kích hoạt</Tag> : <Tag color="gray">Tạm ngưng</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'Chưa có cấu hình dịch vụ bổ sung nào cho tòa nhà này.' }}
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </Card>

  );
}
