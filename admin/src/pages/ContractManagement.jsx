import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Typography, message, Popconfirm, Divider, Tag, Upload, Dropdown, Tabs, Descriptions, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, DollarOutlined, DownOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
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

export default function ContractManagement() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAttachments, setPreviewAttachments] = useState([]);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsContract, setDetailsContract] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Watch fields for dynamic tenant loading
  const formApartmentId = Form.useWatch('apartmentId', form);

  const fetchInitialData = async () => {
    try {
      const aptRes = await api.getApartments();
      setApartments(aptRes.data);
      const tenantRes = await api.getTenants();
      setTenants(tenantRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.getContracts();
      setContracts(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchContracts();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setUploadedAttachments([]);
    form.resetFields();
    setModalOpen(true);
  };

  const handleViewDetails = (record) => {
    setDetailsContract(record);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setUploadedAttachments(record.attachments || []);
    form.setFieldsValue({
      apartmentId: record.apartmentId?._id || record.apartmentId,
      tenantId: record.tenantId?._id || record.tenantId,
      contractNumber: record.contractNumber,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      depositAmount: record.depositAmount,
      rentalPrice: record.rentalPrice,
      paymentCycle: record.paymentCycle,
      billingDate: record.billingDate,
      status: record.status,
      terms: record.terms
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteContract(id);
      message.success('Đã xóa hợp đồng thuê thành công');
      fetchContracts();
    } catch (error) {
      message.error(error.message || 'Xóa hợp đồng thất bại');
    }
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.toDate() : null,
      endDate: values.endDate ? values.endDate.toDate() : null,
      attachments: uploadedAttachments
    };

    try {
      if (editingId) {
        await api.updateContract(editingId, payload);
        message.success('Cập nhật hợp đồng thuê thành công');
      } else {
        await api.createContract(payload);
        message.success('Đăng ký hợp đồng thuê mới thành công');
      }
      setModalOpen(false);
      fetchContracts();
    } catch (error) {
      message.error(error.message || 'Thao tác thất bại');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Filter tenants who belong to the selected apartment
  const filteredTenants = tenants.filter(t => {
    if (!formApartmentId) return false;
    return t.apartmentId?._id === formApartmentId || t.apartmentId === formApartmentId;
  });

  const columns = [
    {
      title: 'Số hợp đồng',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      render: (text) => <Text strong style={{ color: '#9b8451' }}>{text}</Text>
    },
    {
      title: 'Căn hộ',
      key: 'room',
      render: (_, record) => {
        const apt = record.apartmentId;
        if (!apt) return 'N/A';
        return `${apt.buildingId?.name || ''} - Phòng ${apt.name}`;
      }
    },
    {
      title: 'Khách thuê',
      dataIndex: ['tenantId', 'name'],
      key: 'tenantName',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            SĐT: {record.tenantId?.phone || 'N/A'}
          </Text>
        </div>
      )
    },
    {
      title: 'Giá thuê & Đặt cọc',
      key: 'pricing',
      render: (_, record) => (
        <div>
          <Text style={{ color: '#bda46a', fontWeight: 600 }}>Giá: {formatCurrency(record.rentalPrice)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>Cọc: {formatCurrency(record.depositAmount)}</Text>
        </div>
      )
    },
    {
      title: 'Thời hạn thuê',
      key: 'duration',
      render: (_, record) => {
        const start = new Date(record.startDate).toLocaleDateString('vi-VN');
        const end = new Date(record.endDate).toLocaleDateString('vi-VN');
        return (
          <div style={{ fontSize: 12 }}>
            Từ: {start}
            <br />
            Đến: {end}
          </div>
        );
      }
    },
    {
      title: 'Kỳ đóng tiền',
      key: 'billing',
      render: (_, record) => `Đóng ngày ${record.billingDate || 5} hàng tháng`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let label = 'Đang hiệu lực';
        if (status === 'Expired') {
          color = 'orange';
          label = 'Đã hết hạn';
        } else if (status === 'Terminated') {
          color = 'red';
          label = 'Đã thanh lý';
        }
        return <Tag color={color}>{label}</Tag>;
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
            label: 'Xóa hợp đồng',
            danger: true,
            icon: <DeleteOutlined />,
            onClick: () => {
              Modal.confirm({
                title: 'Xác nhận xóa hợp đồng thuê',
                content: 'Bạn chắc chắn muốn xóa hợp đồng thuê này?',
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

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      !searchQuery ||
      c.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tenantId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apartmentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apartmentId?.code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isExpired = new Date(c.endDate) <= new Date();
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && !isExpired) || 
      (filterStatus === 'expired' && isExpired);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Quản Lý Hợp Đồng Thuê</Title>
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
            Lập hợp đồng thuê
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <div style={{ marginBottom: 20, padding: 16, background: '#fafaf9', borderRadius: 10, border: '1px solid #f0edf6' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Input 
              placeholder="Tìm theo số HĐ, tên khách, hoặc phòng..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: '#82745f' }} />}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select 
              style={{ width: '100%' }} 
              value={filterStatus} 
              onChange={setFilterStatus}
            >
              <Option value="all">Tất cả Trạng thái</Option>
              <Option value="active">Còn hiệu lực</Option>
              <Option value="expired">Hết hiệu lực</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table 
        dataSource={filteredContracts} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Hợp Đồng Thuê' : 'Lập Hợp Đồng Thuê Căn Hộ'}
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
            paymentCycle: 1,
            billingDate: 5,
            status: 'Active'
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contractNumber" label="Số hợp đồng" rules={[{ required: true, message: 'Nhập số hợp đồng (Ví dụ: HD-SR101)' }]}>
                <Input placeholder="HD-SR101" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="apartmentId" label="Gán vào căn hộ" rules={[{ required: true, message: 'Chọn căn hộ' }]}>
                <Select placeholder="Chọn căn hộ thuê" onChange={() => form.setFieldValue('tenantId', undefined)}>
                  {apartments.map(apt => (
                    <Option key={apt._id} value={apt._id}>
                      {apt.buildingId?.name} - Phòng {apt.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tenantId" label="Đại diện khách thuê" rules={[{ required: true, message: 'Chọn khách thuê' }]}>
                <Select placeholder={formApartmentId ? "Chọn khách thuê chính" : "Vui lòng chọn căn hộ trước"} disabled={!formApartmentId}>
                  {filteredTenants.map(t => (
                    <Option key={t._id} value={t._id}>{t.name} ({t.phone})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu hợp đồng" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày bắt đầu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Ngày hết hạn hợp đồng" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="rentalPrice" label="Giá thuê phòng (VND/tháng)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="depositAmount" label="Tiền đặt cọc gốc (VND)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="billingDate" label="Ngày đóng tiền hàng tháng" rules={[{ required: true }]}>
                <InputNumber min={1} max={31} style={{ width: '100%' }} placeholder="Ngày 5" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái hợp đồng">
                <Select>
                  <Option value="Active">Đang hiệu lực</Option>
                  <Option value="Expired">Đã hết hạn</Option>
                  <Option value="Terminated">Đã thanh lý</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="terms" label="Điều khoản & Thỏa thuận hợp đồng">
            <Input.TextArea rows={4} placeholder="Nhập các điều khoản quy định về đền bù hư hỏng, quy tắc tiếng ồn, vệ sinh..." />
          </Form.Item>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Bản Quét Hợp Đồng / Đính Kèm</Divider>

          <Form.Item label="Tải bản quét/ảnh chụp hợp đồng lên (Tối đa 2MB mỗi ảnh)">
            <Upload
              accept="image/*"
              multiple
              beforeUpload={async (file) => {
                try {
                  const compressed = await compressImage(file);
                  setUploadedAttachments(prev => [...prev, compressed]);
                } catch (error) {
                  message.error('Lỗi khi xử lý ảnh: ' + error.message);
                }
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<PlusOutlined />}>Tải tệp đính kèm</Button>
            </Upload>

            {uploadedAttachments.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                {uploadedAttachments.map((img, index) => (
                  <Col span={6} key={index}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '133%', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                      <img 
                        src={img} 
                        alt="Preview scan" 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => setUploadedAttachments(prev => prev.filter((_, i) => i !== index))}
                        style={{ position: 'absolute', top: 5, right: 5, zIndex: 5, opacity: 0.85 }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Contract Scan Slideshow Modal */}
      <Modal
        title="Bản Quét Hợp Đồng & Tài Liệu Đính Kèm"
        open={previewModalOpen}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewAttachments([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewModalOpen(false);
            setPreviewAttachments([]);
          }}>
            Đóng
          </Button>
        ]}
        width={720}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        {previewAttachments.length > 0 ? (
          <Row gutter={[16, 16]} justify="center">
            {previewAttachments.map((img, index) => (
              <Col span={24} key={index} style={{ textAlign: 'center' }}>
                <div style={{ padding: 8, border: '1px solid #f0edf6', borderRadius: 8, backgroundColor: '#faf8f5', marginBottom: 12 }}>
                  <Text type="secondary" block style={{ marginBottom: 8, fontWeight: 500 }}>
                    Trang {index + 1}
                  </Text>
                  <img 
                    src={img} 
                    alt={`Attachment ${index + 1}`} 
                    style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                  />
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Text type="secondary">Không tìm thấy tài liệu đính kèm nào.</Text>
          </div>
        )}
      </Modal>

      {/* Immersive Contract Details Drawer */}
      <Drawer
        title={<Title level={4} style={{ margin: 0, color: '#524636' }}>Chi Tiết Hợp Đồng - {detailsContract?.contractNumber}</Title>}
        placement="right"
        width={800}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setDetailsContract(null);
        }}
        open={detailsDrawerOpen}
        destroyOnClose
      >
        {detailsContract && (
          <Tabs defaultActiveKey="1" style={{ marginTop: -12 }}>
            <Tabs.TabPane tab="Điều khoản & Thanh toán" key="1">
              <Row gutter={[24, 24]}>
                <Col span={14}>
                  <Card title="Thông Tin Tài Chính & Thời Hạn" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph><strong>Mã số Hợp đồng:</strong> <Text strong style={{ color: '#9b8451' }}>{detailsContract.contractNumber}</Text></Paragraph>
                    <Paragraph>
                      <strong>Đơn giá thuê:</strong>{' '}
                      <Text type="danger" strong style={{ fontSize: 16 }}>{formatCurrency(detailsContract.rentalPrice)}/tháng</Text>
                    </Paragraph>
                    <Paragraph>
                      <strong>Tiền đặt cọc:</strong>{' '}
                      <Text type="warning" strong>{formatCurrency(detailsContract.depositAmount)}</Text>
                    </Paragraph>
                    <Paragraph><strong>Chu kỳ đóng tiền:</strong> {detailsContract.paymentCycle} tháng/lần</Paragraph>
                    <Paragraph><strong>Ngày chốt hoá đơn:</strong> Ngày {detailsContract.billingDate || 5} hàng tháng</Paragraph>
                    <Paragraph><strong>Ngày bắt đầu hiệu lực:</strong> {new Date(detailsContract.startDate).toLocaleDateString('vi-VN')}</Paragraph>
                    <Paragraph><strong>Ngày kết thúc hiệu lực:</strong> {new Date(detailsContract.endDate).toLocaleDateString('vi-VN')}</Paragraph>
                  </Card>
                </Col>
                <Col span={10}>
                  <Card title="Trạng Thái Vận Hành" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph>
                      <strong>Trạng thái hợp đồng:</strong>{' '}
                      {detailsContract.status === 'Active' ? (
                        <Tag color="green">Đang hiệu lực</Tag>
                      ) : detailsContract.status === 'Expired' ? (
                        <Tag color="orange">Đã hết hạn</Tag>
                      ) : (
                        <Tag color="red">Đã thanh lý</Tag>
                      )}
                    </Paragraph>
                    <Paragraph><strong>Ngày lập hồ sơ:</strong> {new Date(detailsContract.createdAt || Date.now()).toLocaleDateString('vi-VN')}</Paragraph>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card title="Điều Khoản & Quy Định Thỏa Thuận" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Paragraph style={{ whiteSpace: 'pre-line', fontStyle: 'italic', color: '#5f5140' }}>
                      {detailsContract.terms || 'Không có ghi chú điều khoản đặc biệt nào.'}
                    </Paragraph>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Khách thuê & Căn hộ" key="2">
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Card title="Đại Diện Khách Thuê" size="small">
                    {detailsContract.tenantId ? (
                      <Descriptions column={1} bordered>
                        <Descriptions.Item label="Họ tên">{detailsContract.tenantId.name}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{detailsContract.tenantId.phone}</Descriptions.Item>
                        <Descriptions.Item label="Số CCCD">{detailsContract.tenantId.identityCard}</Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Text type="secondary">N/A (Chưa liên kết hồ sơ khách thuê)</Text>
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Căn Hộ Thuê" size="small">
                    {detailsContract.apartmentId ? (
                      <Descriptions column={1} bordered>
                        <Descriptions.Item label="Tòa nhà">{detailsContract.apartmentId.buildingId?.name}</Descriptions.Item>
                        <Descriptions.Item label="Mã phòng">{detailsContract.apartmentId.code}</Descriptions.Item>
                        <Descriptions.Item label="Tên phòng">Phòng {detailsContract.apartmentId.name}</Descriptions.Item>
                        <Descriptions.Item label="Tầng">{detailsContract.apartmentId.floor}</Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Text type="secondary">N/A (Chưa liên kết căn hộ)</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Tài liệu đính kèm (${detailsContract.attachments?.length || 0} trang)`} key="3">
              {detailsContract.attachments && detailsContract.attachments.length > 0 ? (
                <Row gutter={[16, 16]} justify="center">
                  {detailsContract.attachments.map((img, index) => (
                    <Col span={24} key={index} style={{ textAlign: 'center' }}>
                      <div style={{ padding: 8, border: '1px solid #f0edf6', borderRadius: 8, backgroundColor: '#faf8f5', marginBottom: 12 }}>
                        <Text type="secondary" block style={{ marginBottom: 8, fontWeight: 500 }}>
                          Trang {index + 1}
                        </Text>
                        <img 
                          src={img} 
                          alt={`Attachment Page ${index + 1}`} 
                          style={{ maxWidth: '100%', maxHeight: 450, objectFit: 'contain', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Text type="secondary" italic>Không tìm thấy file ảnh bản quét hợp đồng đính kèm.</Text>
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </Card>
  );
}
