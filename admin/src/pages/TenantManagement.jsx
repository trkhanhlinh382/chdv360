import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, DatePicker, Row, Col, Typography, message, Popconfirm, Divider, List, Badge, Tag, InputNumber, Upload, Dropdown, Tabs, Descriptions, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CarOutlined, PlusOutlined as AddIcon, PhoneOutlined, SolutionOutlined, InfoCircleOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
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

export default function TenantManagement() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploadedFront, setUploadedFront] = useState(null);
  const [uploadedBack, setUploadedBack] = useState(null);
  const [previewFrontModal, setPreviewFrontModal] = useState(null);
  const [previewBackModal, setPreviewBackModal] = useState(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsTenant, setDetailsTenant] = useState(null);
  const [detailsContract, setDetailsContract] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [buildings, setBuildings] = useState([]);

  const fetchBuildings = async () => {
    try {
      const res = await api.getBuildings();
      setBuildings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchApartments = async () => {
    try {
      const res = await api.getApartments();
      // Only load vacant apartments for adding new tenants, but allow editing existing ones
      setApartments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.getTenants();
      setTenants(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách khách thuê');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (record) => {
    setDetailsTenant(record);
    setDetailsDrawerOpen(true);
    try {
      const contractRes = await api.getContracts();
      const activeContract = contractRes.data.find(c => (c.tenantId?._id || c.tenantId) === record._id);
      setDetailsContract(activeContract || null);
    } catch (error) {
      console.error('Không thể tải thông tin hợp đồng của khách thuê', error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchApartments();
    fetchTenants();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setUploadedFront(null);
    setUploadedBack(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setUploadedFront(record.identityCardFront || null);
    setUploadedBack(record.identityCardBack || null);
    form.setFieldsValue({
      apartmentId: record.apartmentId?._id || record.apartmentId,
      name: record.name,
      phone: record.phone,
      email: record.email,
      identityCard: record.identityCard,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
      gender: record.gender,
      permanentAddress: record.permanentAddress,
      occupation: record.occupation,
      companyOrSchool: record.companyOrSchool,
      vehicles: record.vehicles || [],
      coResidents: record.coResidents || [],
      depositPaid: record.depositPaid,
      status: record.status
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTenant(id);
      message.success('Đã xóa khách thuê thành công, phòng chuyển sang trạng thái Trống');
      fetchTenants();
      fetchApartments();
    } catch (error) {
      message.error(error.message || 'Xóa khách thuê thất bại');
    }
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      birthDate: values.birthDate ? values.birthDate.toDate() : null,
      identityCardFront: uploadedFront,
      identityCardBack: uploadedBack
    };

    try {
      let res;
      if (editingId) {
        res = await api.updateTenant(editingId, payload);
        message.success('Cập nhật thông tin khách thuê thành công');
      } else {
        res = await api.createTenant(payload);
        message.success('Đăng ký khách thuê thành công');
      }

      if (res.parkingWarning) {
        Modal.warning({
          title: 'CẢNH BÁO QUÁ TẢI BÃI GIỮ XE',
          content: res.parkingWarning,
          okText: 'Tôi hiểu và tiếp tục'
        });
      }

      setModalOpen(false);
      fetchTenants();
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
      title: 'Khách thuê (Chính)',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#524636' }}>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.phone}
          </Text>
        </div>
      )
    },
    {
      title: 'Căn hộ',
      key: 'apartment',
      render: (_, record) => {
        const apt = record.apartmentId;
        if (!apt) return 'N/A';
        return `${apt.buildingId?.name || ''} - Phòng ${apt.name || ''}`;
      }
    },
    {
      title: 'Thông tin cá nhân',
      key: 'profile',
      render: (_, record) => {
        const hasFront = !!record.identityCardFront;
        const hasBack = !!record.identityCardBack;
        return (
          <div style={{ fontSize: 12 }}>
            • CCCD: {record.identityCard}
            {record.occupation && <><br />• Nghề: {record.occupation}</>}
            {(hasFront || hasBack) && (
              <div style={{ marginTop: 4, display: 'flex', gap: '8px' }}>
                {hasFront && (
                  <Button type="link" size="small" onClick={() => setPreviewFrontModal(record.identityCardFront)} style={{ padding: 0, height: 'auto', fontSize: 11 }}>
                    Mặt trước
                  </Button>
                )}
                {hasBack && (
                  <Button type="link" size="small" onClick={() => setPreviewBackModal(record.identityCardBack)} style={{ padding: 0, height: 'auto', fontSize: 11 }}>
                    Mặt sau
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Đăng ký xe máy',
      key: 'vehicles',
      render: (_, record) => {
        const vCount = record.vehicles?.length || 0;
        return <Tag icon={<CarOutlined />} color={vCount > 0 ? 'gold' : 'default'}>{vCount} xe</Tag>;
      }
    },
    {
      title: 'Người ở cùng',
      key: 'coResidents',
      render: (_, record) => {
        const count = record.coResidents?.length || 0;
        return <Tag color={count > 0 ? 'cyan' : 'default'}>{count} thành viên</Tag>;
      }
    },
    {
      title: 'Tiền cọc đã đóng',
      dataIndex: 'depositPaid',
      key: 'depositPaid',
      render: (d) => formatCurrency(d)
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
            label: 'Xóa khách thuê',
            danger: true,
            icon: <DeleteOutlined />,
            onClick: () => {
              Modal.confirm({
                title: 'Xác nhận xóa khách thuê',
                content: 'Xóa khách thuê sẽ giải phóng phòng và tự động xóa hợp đồng liên quan?',
                okText: 'Đồng ý xóa',
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

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      !searchQuery ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.identityCard?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const buildingIdOfTenant = t.apartmentId?.buildingId?._id || t.apartmentId?.buildingId || '';
    const matchesBuilding = filterBuilding === 'all' || buildingIdOfTenant.toString() === filterBuilding.toString();
    
    return matchesSearch && matchesBuilding;
  });

  return (
    <Card 
      title={
        <Space>
          <UserOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Quản Lý Khách Thuê</Title>
        </Space>
      }
      extra={
        <Space>
          <Button 
            type="primary" 
            ghost
            icon={<PlusOutlined />} 
            onClick={() => navigate('/checkin')}
          >
            Quy trình Nhận phòng
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}
          >
            Đăng ký khách thuê
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <div style={{ marginBottom: 20, padding: 16, background: '#fafaf9', borderRadius: 10, border: '1px solid #f0edf6' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Input 
              placeholder="Tìm theo tên khách, SĐT hoặc số CCCD..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: '#82745f' }} />}
            />
          </Col>
          <Col xs={24} md={8}>
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
        </Row>
      </div>

      <Table 
        dataSource={filteredTenants} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Hồ Sơ Khách Thuê' : 'Đăng Ký Hồ Sơ Khách Thuê'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            gender: 'Nam',
            vehicles: [],
            coResidents: [],
            status: 'Active',
            depositPaid: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="apartmentId" label="Gán vào căn hộ" rules={[{ required: true, message: 'Chọn căn hộ trống' }]}>
                <Select placeholder="Chọn căn hộ trống hoặc đã thuê">
                  {apartments.map(apt => (
                    <Option key={apt._id} value={apt._id} disabled={apt.status === 'Occupied' && editingId === null}>
                      {apt.buildingId?.name} - {apt.name} ({apt.status === 'Occupied' ? 'Đang thuê' : 'Còn trống'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Họ tên người đại diện (Ký hợp đồng)" rules={[{ required: true, message: 'Nhập tên khách thuê chính' }]}>
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="Số điện thoại liên lạc" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                <Input placeholder="0987654321" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="identityCard" label="Số CCCD / Hộ chiếu" rules={[{ required: true, message: 'Nhập số định danh cá nhân' }]}>
                <Input placeholder="079096123456" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="Địa chỉ Email">
                <Input type="email" placeholder="vananh@gmail.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="gender" label="Giới tính">
                <Select>
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="birthDate" label="Ngày tháng năm sinh">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="occupation" label="Nghề nghiệp">
                <Input placeholder="Kỹ sư, học sinh..." />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="depositPaid" label="Tiền cọc thực đóng (VND)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="permanentAddress" label="Địa chỉ thường trú (Hộ khẩu)">
            <Input placeholder="Số 123 Trần Hưng Đạo, TP Quy Nhơn, Bình Định" />
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Ảnh CCCD Khách Thuê</Divider>

          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Form.Item label="CCCD Mặt trước (Tối đa 2MB)">
                <Upload
                  accept="image/*"
                  beforeUpload={async (file) => {
                    try {
                      const compressed = await compressImage(file);
                      setUploadedFront(compressed);
                    } catch (error) {
                      message.error('Lỗi khi nén ảnh: ' + error.message);
                    }
                    return false;
                  }}
                  showUploadList={false}
                >
                  <Button icon={<PlusOutlined />} style={{ width: '100%' }}>Tải ảnh mặt trước</Button>
                </Upload>
                {uploadedFront && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '63%', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <img 
                      src={uploadedFront} 
                      alt="CCCD Front" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <Button
                      type="primary"
                      danger
                      shape="circle"
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => setUploadedFront(null)}
                      style={{ position: 'absolute', top: 5, right: 5, zIndex: 5 }}
                    />
                  </div>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CCCD Mặt sau (Tối đa 2MB)">
                <Upload
                  accept="image/*"
                  beforeUpload={async (file) => {
                    try {
                      const compressed = await compressImage(file);
                      setUploadedBack(compressed);
                    } catch (error) {
                      message.error('Lỗi khi nén ảnh: ' + error.message);
                    }
                    return false;
                  }}
                  showUploadList={false}
                >
                  <Button icon={<PlusOutlined />} style={{ width: '100%' }}>Tải ảnh mặt sau</Button>
                </Upload>
                {uploadedBack && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '63%', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <img 
                      src={uploadedBack} 
                      alt="CCCD Back" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <Button
                      type="primary"
                      danger
                      shape="circle"
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => setUploadedBack(null)}
                      style={{ position: 'absolute', top: 5, right: 5, zIndex: 5 }}
                    />
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            {/* Vehicles list */}
            <Col span={12}>
              <Divider orientation="left" style={{ color: '#bda46a' }}>
                <CarOutlined /> Đăng Ký Gửi Xe Máy / Ô Tô
              </Divider>
              <Form.List name="vehicles">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafaf8', padding: 8, borderRadius: 8, marginBottom: 8, border: '1px solid #f0ecf6' }}>
                        <Row gutter={8}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'brand']} rules={[{ required: true, message: 'Hiệu xe' }]} style={{ marginBottom: 0 }}>
                              <Input placeholder="Honda Vision" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item {...restField} name={[name, 'color']} style={{ marginBottom: 0 }}>
                              <Input placeholder="Màu đỏ" />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'licensePlate']} rules={[{ required: true, message: 'Biển số' }]} style={{ marginBottom: 0 }}>
                              <Input placeholder="59-P1 123.45" />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ padding: 0 }} />
                          </Col>
                        </Row>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                      Đăng ký phương tiện gửi xe
                    </Button>
                  </>
                )}
              </Form.List>
            </Col>

            {/* Co-Residents list */}
            <Col span={12}>
              <Divider orientation="left" style={{ color: '#bda46a' }}>
                <UserOutlined /> Thành Viên Sống Cùng (Co-Residents)
              </Divider>
              <Form.List name="coResidents">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ background: '#fafaf8', padding: 8, borderRadius: 8, marginBottom: 8, border: '1px solid #f0ecf6' }}>
                        <Row gutter={8}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Họ tên' }]} style={{ marginBottom: 0 }}>
                              <Input placeholder="Trần Văn B" />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item {...restField} name={[name, 'phone']} style={{ marginBottom: 0 }}>
                              <Input placeholder="SĐT phụ" />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item {...restField} name={[name, 'relationship']} rules={[{ required: true, message: 'Quan hệ' }]} style={{ marginBottom: 0 }}>
                              <Select placeholder="Quan hệ">
                                <Option value="Bạn">Bạn bè</Option>
                                <Option value="Vợ">Vợ</Option>
                                <Option value="Chồng">Chồng</Option>
                                <Option value="Anh em">Anh chị em</Option>
                                <Option value="Con">Con cái</Option>
                                <Option value="Bố mẹ">Bố mẹ</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ padding: 0 }} />
                          </Col>
                        </Row>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                      Thêm thành viên ở cùng phòng
                    </Button>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Immersive Tenant Details Drawer */}
      <Drawer
        title={<Title level={4} style={{ margin: 0, color: '#524636' }}>Hồ Sơ Khách Thuê - {detailsTenant?.name}</Title>}
        placement="right"
        width={800}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setDetailsTenant(null);
          setDetailsContract(null);
        }}
        open={detailsDrawerOpen}
        destroyOnClose
      >
        {detailsTenant && (
          <Tabs defaultActiveKey="1" style={{ marginTop: -12 }}>
            <Tabs.TabPane tab="Tổng quan & CCCD" key="1">
              <Row gutter={[24, 24]}>
                <Col span={14}>
                  <Card title="Hồ Sơ Cá Nhân" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph><strong>Họ và tên:</strong> <Text strong style={{ color: '#524636' }}>{detailsTenant.name}</Text></Paragraph>
                    <Paragraph><strong>Số điện thoại:</strong> {detailsTenant.phone}</Paragraph>
                    <Paragraph><strong>Địa chỉ Email:</strong> {detailsTenant.email || 'Không cung cấp'}</Paragraph>
                    <Paragraph><strong>Số CCCD / Hộ chiếu:</strong> {detailsTenant.identityCard}</Paragraph>
                    <Paragraph><strong>Giới tính:</strong> {detailsTenant.gender}</Paragraph>
                    <Paragraph><strong>Ngày sinh:</strong> {detailsTenant.birthDate ? new Date(detailsTenant.birthDate).toLocaleDateString('vi-VN') : 'N/A'}</Paragraph>
                    <Paragraph><strong>Nghề nghiệp:</strong> {detailsTenant.occupation || 'N/A'}</Paragraph>
                    <Paragraph><strong>Hộ khẩu thường trú:</strong> {detailsTenant.permanentAddress || 'N/A'}</Paragraph>
                    <Paragraph><strong>Căn hộ gán:</strong> {detailsTenant.apartmentId?.buildingId?.name} - Phòng {detailsTenant.apartmentId?.name}</Paragraph>
                    <Paragraph><strong>Tiền cọc thực đóng:</strong> <Text type="warning" strong>{formatCurrency(detailsTenant.depositPaid)}</Text></Paragraph>
                  </Card>
                </Col>
                <Col span={10}>
                  <Card title="Trạng Thái Vận Hành" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph>
                      <strong>Trạng thái hồ sơ:</strong>{' '}
                      {detailsTenant.status === 'Active' ? <Tag color="green">Đang hiệu lực</Tag> : <Tag color="red">Đã ngưng</Tag>}
                    </Paragraph>
                    <Paragraph><strong>Ngày đăng ký:</strong> {new Date(detailsTenant.createdAt || Date.now()).toLocaleDateString('vi-VN')}</Paragraph>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card title="Ảnh CCCD Đính Kèm" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Row gutter={16}>
                      {detailsTenant.identityCardFront && (
                        <Col span={12} style={{ textAlign: 'center' }}>
                          <Text type="secondary" block style={{ marginBottom: 8 }}>Mặt trước CCCD</Text>
                          <img 
                            src={detailsTenant.identityCardFront} 
                            alt="CCCD Front" 
                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #f0edf6', cursor: 'zoom-in' }}
                            onClick={() => setPreviewFrontModal(detailsTenant.identityCardFront)}
                          />
                        </Col>
                      )}
                      {detailsTenant.identityCardBack && (
                        <Col span={12} style={{ textAlign: 'center' }}>
                          <Text type="secondary" block style={{ marginBottom: 8 }}>Mặt sau CCCD</Text>
                          <img 
                            src={detailsTenant.identityCardBack} 
                            alt="CCCD Back" 
                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #f0edf6', cursor: 'zoom-in' }}
                            onClick={() => setPreviewBackModal(detailsTenant.identityCardBack)}
                          />
                        </Col>
                      )}
                      {!detailsTenant.identityCardFront && !detailsTenant.identityCardBack && (
                        <Col span={24} style={{ textAlign: 'center', padding: 12 }}>
                          <Text type="secondary" italic>Chưa tải lên hình ảnh định danh cá nhân.</Text>
                        </Col>
                      )}
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Thành viên & Xe máy (${detailsTenant.coResidents?.length || 0} / ${detailsTenant.vehicles?.length || 0})`} key="2">
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Card title="Danh Sách Phương Tiện Gửi Xe" size="small">
                    {detailsTenant.vehicles && detailsTenant.vehicles.length > 0 ? (
                      <List
                        dataSource={detailsTenant.vehicles}
                        renderItem={(item, i) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Badge count={i + 1} color="#bda46a" />}
                              title={<Text strong>{item.brand} ({item.color})</Text>}
                              description={`Biển số: ${item.licensePlate}`}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ padding: 24, textAlign: 'center' }}><Text type="secondary">Chưa đăng ký gửi xe.</Text></div>
                    )}
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title="Danh Sách Thành Viên Ở Cùng" size="small">
                    {detailsTenant.coResidents && detailsTenant.coResidents.length > 0 ? (
                      <List
                        dataSource={detailsTenant.coResidents}
                        renderItem={(item, i) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Badge count={i + 1} color="cyan" />}
                              title={<Text strong>{item.name}</Text>}
                              description={`Quan hệ: ${item.relationship} | SĐT: ${item.phone || 'Không có'}`}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ padding: 24, textAlign: 'center' }}><Text type="secondary">Ở một mình (Không có thành viên phụ).</Text></div>
                    )}
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Hợp đồng liên kết" key="3">
              {detailsContract ? (
                <Card title={`Số Hợp Đồng: ${detailsContract.contractNumber}`} bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Giá thuê căn hộ">{formatCurrency(detailsContract.rentalPrice)}/tháng</Descriptions.Item>
                    <Descriptions.Item label="Đặt cọc">{formatCurrency(detailsContract.depositAmount)}</Descriptions.Item>
                    <Descriptions.Item label="Thời hạn">Từ {new Date(detailsContract.startDate).toLocaleDateString('vi-VN')} đến {new Date(detailsContract.endDate).toLocaleDateString('vi-VN')}</Descriptions.Item>
                    <Descriptions.Item label="Kỳ đóng tiền">{detailsContract.paymentCycle} tháng/lần</Descriptions.Item>
                    <Descriptions.Item label="Ngày xuất hoá đơn">Ngày {detailsContract.billingDate || 5} hàng tháng</Descriptions.Item>
                    <Descriptions.Item label="Quy định & Điều khoản">{detailsContract.terms || 'N/A'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ) : (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Text type="secondary" italic>Không tìm thấy thông tin Hợp đồng hoạt động gắn với khách thuê này.</Text>
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Front CCCD Preview Modal */}
      <Modal
        title="Mặt Trước CCCD"
        open={!!previewFrontModal}
        onCancel={() => setPreviewFrontModal(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewFrontModal(null)}>Đóng</Button>
        ]}
        destroyOnClose
        centered
        width={550}
      >
        <div style={{ textAlign: 'center', padding: 8 }}>
          <img 
            src={previewFrontModal} 
            alt="CCCD Front" 
            style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
        </div>
      </Modal>

      {/* Back CCCD Preview Modal */}
      <Modal
        title="Mặt Sau CCCD"
        open={!!previewBackModal}
        onCancel={() => setPreviewBackModal(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewBackModal(null)}>Đóng</Button>
        ]}
        destroyOnClose
        centered
        width={550}
      >
        <div style={{ textAlign: 'center', padding: 8 }}>
          <img 
            src={previewBackModal} 
            alt="CCCD Back" 
            style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
        </div>
      </Modal>
    </Card>
  );
}
