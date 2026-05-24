import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, Row, Col, Typography, message, Popconfirm, Divider, Tag, Drawer, Statistic, Descriptions, Tooltip, Tabs, Alert, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, CalculatorOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, PrinterOutlined, AlertOutlined, HistoryOutlined } from '@ant-design/icons';

import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const InnerCard = Card;

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [dueInvoices, setDueInvoices] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');


  // Watchers to calculate values dynamically on front-end
  const formApartmentId = Form.useWatch('apartmentId', form);
  const formElecOld = Form.useWatch(['electricity', 'oldIndex'], form);
  const formElecNew = Form.useWatch(['electricity', 'newIndex'], form);
  const formWaterOld = Form.useWatch(['water', 'oldIndex'], form);
  const formWaterNew = Form.useWatch(['water', 'newIndex'], form);

  const [currentAptDetail, setCurrentAptDetail] = useState(null);

  const fetchInitialData = async () => {
    try {
      const res = await api.getApartments();
      // Load only occupied rooms since invoices are generated for active tenants
      const occupiedOnly = res.data.filter(apt => apt.status === 'Occupied');
      setApartments(occupiedOnly);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices();
      setInvoices(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const fetchDueInvoices = async () => {
    try {
      const res = await api.getDueInvoices();
      setDueInvoices(res.data);
    } catch (error) {
      console.error('Không thể lấy danh sách phòng cần thu tiền', error);
    }
  };

  const handleQuickCreate = (dueRecord) => {
    setEditingId(null);
    form.resetFields();
    
    // Fetch detailed apartment info to get default building fees
    api.getApartmentById(dueRecord.apartment._id).then(res => {
      setCurrentAptDetail(res.data);
      form.setFieldsValue({
        apartmentId: dueRecord.apartment._id,
        billingMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        roomPrice: dueRecord.apartment.price,
        electricity: {
          oldIndex: dueRecord.oldIndices?.electricity || 0,
          newIndex: dueRecord.oldIndices?.electricity || 0,
          unitPrice: res.data.buildingId?.defaultFees?.electricPrice || 4000
        },
        water: {
          oldIndex: dueRecord.oldIndices?.water || 0,
          newIndex: dueRecord.oldIndices?.water || 0,
          unitPrice: res.data.buildingId?.defaultFees?.waterPrice || 30000
        },
        serviceFee: res.data.buildingId?.defaultFees?.serviceFee || 150000,
        parkingFee: (dueRecord.tenant?.vehiclesCount || 0) * (res.data.buildingId?.defaultFees?.parkingFee || 100000),
        status: 'Unpaid'
      });
      setModalOpen(true);
    }).catch(error => {
      message.error('Không thể tải biểu phí của tòa nhà');
    });
  };

  useEffect(() => {
    fetchInitialData();
    fetchInvoices();
    fetchDueInvoices();
    // Load buildings for filter select
    api.getBuildings().then(res => setBuildings(res.data)).catch(console.error);
  }, []);


  // Fetch building default fees when apartment changes in form
  useEffect(() => {
    if (formApartmentId) {
      const apt = apartments.find(a => a._id === formApartmentId);
      if (apt) {
        // Fetch detailed apartment info to get default building fees
        api.getApartmentById(apt._id).then(res => {
          setCurrentAptDetail(res.data);
          // Pre-populate old indices (if available, e.g. from last invoice or defaults)
          form.setFieldsValue({
            roomPrice: res.data.price,
            electricity: {
              oldIndex: 0,
              unitPrice: res.data.buildingId?.defaultFees?.electricPrice || 4000
            },
            water: {
              oldIndex: 0,
              unitPrice: res.data.buildingId?.defaultFees?.waterPrice || 30000
            },
            serviceFee: res.data.buildingId?.defaultFees?.serviceFee || 150000
          });
        });
      }
    } else {
      setCurrentAptDetail(null);
    }
  }, [formApartmentId, apartments, form]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      apartmentId: record.apartmentId?._id || record.apartmentId,
      billingMonth: record.billingMonth,
      roomPrice: record.roomPrice,
      electricity: {
        oldIndex: record.electricity?.oldIndex,
        newIndex: record.electricity?.newIndex,
        unitPrice: record.electricity?.unitPrice
      },
      water: {
        oldIndex: record.water?.oldIndex,
        newIndex: record.water?.newIndex,
        unitPrice: record.water?.unitPrice
      },
      serviceFee: record.serviceFee,
      parkingFee: record.parkingFee,
      status: record.status
    });
    setModalOpen(true);
  };

  const handleView = (record) => {
    setSelectedInvoice(record);
    setDetailOpen(true);
  };

  const handleTogglePayment = async (record) => {
    try {
      const nextStatus = record.status === 'Paid' ? 'Unpaid' : 'Paid';
      await api.updateInvoice(record._id, {
        ...record,
        status: nextStatus
      });
      message.success(`Đã chuyển trạng thái hóa đơn sang: ${nextStatus === 'Paid' ? 'ĐÃ ĐÓNG' : 'CHƯA ĐÓNG'}`);
      fetchInvoices();
      fetchDueInvoices();
    } catch (error) {
      message.error(error.message || 'Thay đổi trạng thái thất bại');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteInvoice(id);
      message.success('Đã xóa hóa đơn thành công');
      fetchInvoices();
      fetchDueInvoices();
    } catch (error) {
      message.error(error.message || 'Xóa hóa đơn thất bại');
    }
  };

  const onFinish = async (values) => {
    try {
      if (editingId) {
        await api.updateInvoice(editingId, values);
        message.success('Cập nhật hóa đơn điện nước thành công');
      } else {
        await api.createInvoice(values);
        message.success('Khởi tạo hóa đơn tháng thành công');
      }
      setModalOpen(false);
      fetchInvoices();
      fetchDueInvoices();
    } catch (error) {
      message.error(error.message || 'Khởi tạo thất bại. Vui lòng kiểm tra lại chỉ số.');
    }
  };


  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const columns = [
    {
      title: 'Kỳ thanh toán',
      dataIndex: 'billingMonth',
      key: 'billingMonth',
      render: (month) => <Tag color="blue">{month}</Tag>
    },
    {
      title: 'Phòng',
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
      key: 'tenantName'
    },
    {
      title: 'Tổng hóa đơn',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => <Text style={{ color: '#cf1322', fontWeight: 700 }}>{formatCurrency(amount)}</Text>
    },
    {
      title: 'Trạng thái cước',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space>
          <Tag color={status === 'Paid' ? 'green' : 'red'}>
            {status === 'Paid' ? 'Đã đóng tiền' : 'Chưa đóng tiền'}
          </Tag>
          <Button 
            type="dashed" 
            size="small" 
            onClick={() => handleTogglePayment(record)}
            icon={status === 'Paid' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            style={{ fontSize: 11 }}
          >
            {status === 'Paid' ? 'Hủy nhận' : 'Xác nhận đóng'}
          </Button>
        </Space>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined style={{ color: '#9b8451' }} />} onClick={() => handleView(record)}>Xem biên nhận</Button>
          <Button type="text" icon={<EditOutlined style={{ color: '#bda46a' }} />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn chắc chắn muốn xóa hóa đơn này?"
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

  // Filter logic for historical invoices
  const filteredInvoices = invoices.filter(inv => {
    const apt = inv.apartmentId;
    const matchBuilding = filterBuilding === 'all' || apt?.buildingId?._id === filterBuilding || apt?.buildingId === filterBuilding;
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchMonth = !filterMonth || inv.billingMonth.includes(filterMonth);
    const matchSearch = !searchQuery || 
      inv.tenantId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      apt?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBuilding && matchStatus && matchMonth && matchSearch;
  });

  // Table columns for due/overdue rooms
  const dueColumns = [
    {
      title: 'Tòa nhà',
      dataIndex: ['apartment', 'buildingId', 'name'],
      key: 'buildingName',
    },
    {
      title: 'Phòng',
      dataIndex: ['apartment', 'name'],
      key: 'apartmentName',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: 'Khách thuê chính',
      dataIndex: ['tenant', 'name'],
      key: 'tenantName',
    },
    {
      title: 'Liên hệ',
      dataIndex: ['tenant', 'phone'],
      key: 'tenantPhone',
    },
    {
      title: 'Ngày đến hạn thu',
      dataIndex: ['contract', 'dueDate'],
      key: 'dueDate',
      render: (date) => <Tag color="warning">{date}</Tag>
    },
    {
      title: 'Tình trạng',
      key: 'status',
      render: (_, record) => {
        const days = record.daysRemaining;
        if (days < 0) {
          return <Badge status="error" text={`Trễ ${Math.abs(days)} ngày`} />;
        } else if (days === 0) {
          return <Badge status="warning" text="Đến hạn hôm nay" />;
        } else {
          return <Badge status="processing" text={`Còn ${days} ngày`} />;
        }
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          icon={<CalculatorOutlined />} 
          onClick={() => handleQuickCreate(record)}
          style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}
        >
          Lập nhanh hóa đơn
        </Button>
      )
    }
  ];

  return (
    <Card 
      title={
        <Space>
          <CalculatorOutlined style={{ color: '#bda46a' }} />
          <Title level={4} style={{ margin: 0, color: '#524636' }}>Hóa Đơn & Tiền Điện Nước Hàng Tháng</Title>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}
        >
          Tạo hóa đơn thủ công
        </Button>
      }
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: '1',
            label: (
              <span>
                <AlertOutlined />
                Cần Tạo Hóa Đơn ({dueInvoices.length})
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                {dueInvoices.length > 0 ? (
                  <Alert
                    message={`Cảnh báo: Có ${dueInvoices.length} phòng đang đến hạn hoặc quá hạn đóng tiền trong vòng 3 ngày tới mà chưa được tạo hóa đơn!`}
                    type="warning"
                    showIcon
                    icon={<AlertOutlined />}
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                ) : (
                  <Alert
                    message="Tuyệt vời! Tất cả các phòng đã được lập hóa đơn đầy đủ cho tháng này."
                    type="success"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                )}
                <Table 
                  dataSource={dueInvoices} 
                  columns={dueColumns} 
                  rowKey={(record) => record.apartment._id} 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )
          },
          {
            key: '2',
            label: (
              <span>
                <AlertOutlined style={{ color: '#cf1322' }} />
                Trễ Tiền Phòng ({invoices.filter(inv => inv.status === 'Unpaid').length})
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                {invoices.filter(inv => inv.status === 'Unpaid').length > 0 ? (
                  <Alert
                    message={`Cảnh báo hệ thống: Đang có ${invoices.filter(inv => inv.status === 'Unpaid').length} căn hộ chưa đóng tiền phòng & dịch vụ tháng này!`}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                ) : (
                  <Alert
                    message="Tuyệt vời! Tất cả căn hộ đều đã đóng tiền đầy đủ. Không có nợ xấu phát sinh."
                    type="success"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                )}
                <Table 
                  dataSource={invoices.filter(inv => inv.status === 'Unpaid')} 
                  columns={columns} 
                  rowKey="_id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )
          },
          {
            key: '3',
            label: (
              <span>
                <HistoryOutlined />
                Lịch Sử Hóa Đơn ({filteredInvoices.length})
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                {/* Multi-Filters Bar */}
                <Row gutter={[8, 8]} style={{ marginBottom: 16, background: '#fafaf9', padding: '12px', borderRadius: 8 }}>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Tòa nhà:</Text>
                    <Select 
                      value={filterBuilding} 
                      onChange={setFilterBuilding} 
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      <Option value="all">Tất cả tòa nhà</Option>
                      {buildings.map(b => (
                        <Option key={b._id} value={b._id}>{b.name}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái thanh toán:</Text>
                    <Select 
                      value={filterStatus} 
                      onChange={setFilterStatus} 
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      <Option value="all">Tất cả trạng thái</Option>
                      <Option value="Paid">Đã đóng tiền</Option>
                      <Option value="Unpaid">Chưa đóng tiền</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Kỳ thanh toán (Tháng):</Text>
                    <Input 
                      placeholder="Ví dụ: 2026-05" 
                      value={filterMonth} 
                      onChange={e => setFilterMonth(e.target.value)} 
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Tìm kiếm nhanh:</Text>
                    <Input 
                      placeholder="Tìm tên khách, số phòng..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                </Row>

                <Table 
                  dataSource={filteredInvoices} 
                  columns={columns} 
                  rowKey="_id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            )
          }
        ]}
      />



      {/* Calculate & Generate Invoice Modal */}
      <Modal
        title={editingId ? 'Sửa Chỉ Số Điện Nước & Tiền Phòng' : 'Tính Tiền Phòng & Tiền Điện Nước Hàng Tháng'}
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
            billingMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            electricity: { oldIndex: 0, newIndex: 0 },
            water: { oldIndex: 0, newIndex: 0 },
            status: 'Unpaid'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="apartmentId" label="Chọn phòng lập hóa đơn" rules={[{ required: true, message: 'Vui lòng chọn phòng đang có khách ở' }]}>
                <Select placeholder="Chọn căn hộ dịch vụ">
                  {apartments.map(apt => (
                    <Option key={apt._id} value={apt._id}>
                      {apt.buildingId?.name} - {apt.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="billingMonth" label="Kỳ thanh toán (Tháng/Năm)" rules={[{ required: true, message: 'Nhập kỳ thanh toán' }]}>
                <Input placeholder="YYYY-MM (Ví dụ: 2026-05)" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Chỉ Số Điện & Chỉ Số Nước Thực Tế</Divider>

          <Row gutter={16}>
            {/* Electricity block */}
            <Col span={12}>
              <InnerCard size="small" title="Mặt Số Điện" style={{ background: '#fafaf9' }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name={['electricity', 'oldIndex']} label="Số điện cũ" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['electricity', 'newIndex']} label="Số điện mới" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <Text type="secondary">Sử dụng: </Text>
                  <Text strong style={{ color: '#9b8451' }}>
                    {Number(formElecNew) >= Number(formElecOld) ? formElecNew - formElecOld : 0} kWh
                  </Text>
                  <br />
                  <Text type="secondary">Giá điện: </Text>
                  <Text strong>{formatCurrency(currentAptDetail?.buildingId?.defaultFees?.electricPrice)}</Text>
                </div>
              </InnerCard>
            </Col>

            {/* Water block */}
            <Col span={12}>
              <InnerCard size="small" title="Mặt Số Nước" style={{ background: '#fafaf9' }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name={['water', 'oldIndex']} label="Số nước cũ" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['water', 'newIndex']} label="Số nước mới" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <Text type="secondary">Sử dụng: </Text>
                  <Text strong style={{ color: '#9b8451' }}>
                    {Number(formWaterNew) >= Number(formWaterOld) ? formWaterNew - formWaterOld : 0} m³
                  </Text>
                  <br />
                  <Text type="secondary">Giá nước: </Text>
                  <Text strong>{formatCurrency(currentAptDetail?.buildingId?.defaultFees?.waterPrice)}</Text>
                </div>
              </InnerCard>
            </Col>
          </Row>

          <Divider orientation="left" style={{ color: '#bda46a' }}>Tiền phòng & Dịch vụ đi kèm</Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="roomPrice" label="Tiền thuê phòng cố định">
                <InputNumber disabled style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="serviceFee" label="Phí dịch vụ chung">
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="parkingFee" label="Phí giữ xe tổng cộng (Để trống tự tính)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Tự tính theo số xe" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái thu tiền">
                <Select>
                  <Option value="Unpaid">Chưa thu tiền</Option>
                  <Option value="Paid">Đã đóng tiền đủ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Bill Receipt Drawer view */}
      <Drawer
        title="BIÊN NHẬN THANH TOÁN TIỀN PHÒNG"
        placement="right"
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        width={560}
      >
        {selectedInvoice && (
          <div className="receipt-view" style={{ padding: '8px', color: '#524636' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, color: '#524636' }}>CÔNG TY TNHH DỊCH VỤ 360 PLUS</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>180 Phan Huy Ích, phường An Hội Tây, TP HCM</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Hotline: 0927 360 360</Text>
              <Divider style={{ margin: '16px 0' }} />
              <Title level={3} style={{ margin: 0, color: '#9b8451', letterSpacing: 1 }}>PHIẾU THU TIỀN PHÒNG</Title>
              <Text strong style={{ fontSize: 14 }}>Kỳ thanh toán: {selectedInvoice.billingMonth}</Text>
            </div>

            <Descriptions title="Hồ sơ thu cước" column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Khách hàng chính">{selectedInvoice.tenantId?.name}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedInvoice.tenantId?.phone}</Descriptions.Item>
              <Descriptions.Item label="Tòa nhà">{selectedInvoice.apartmentId?.buildingId?.name}</Descriptions.Item>
              <Descriptions.Item label="Phòng">{selectedInvoice.apartmentId?.name}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedInvoice.status === 'Paid' ? 'green' : 'red'}>
                  {selectedInvoice.status === 'Paid' ? 'Đã đóng tiền đủ' : 'Chưa thu tiền'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Bảng tính cước chi tiết" column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="1. Tiền thuê phòng">
                <strong>{formatCurrency(selectedInvoice.roomPrice)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="2. Tiền điện sử dụng">
                {selectedInvoice.electricity?.consumption} kWh × {formatCurrency(selectedInvoice.electricity?.unitPrice)}/kWh = <strong>{formatCurrency(selectedInvoice.electricity?.total)}</strong>
                <br />
                <span style={{ fontSize: 11, color: '#82745f' }}>(Chỉ số: {selectedInvoice.electricity?.oldIndex} ➔ {selectedInvoice.electricity?.newIndex})</span>
              </Descriptions.Item>
              <Descriptions.Item label="3. Tiền nước sử dụng">
                {selectedInvoice.water?.consumption} m³ × {formatCurrency(selectedInvoice.water?.unitPrice)}/m³ = <strong>{formatCurrency(selectedInvoice.water?.total)}</strong>
                <br />
                <span style={{ fontSize: 11, color: '#82745f' }}>(Chỉ số: {selectedInvoice.water?.oldIndex} ➔ {selectedInvoice.water?.newIndex})</span>
              </Descriptions.Item>
              <Descriptions.Item label="4. Phí dịch vụ chung">
                <strong>{formatCurrency(selectedInvoice.serviceFee)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="5. Phí gửi phương tiện">
                <strong>{formatCurrency(selectedInvoice.parkingFee)}</strong>
              </Descriptions.Item>
              {selectedInvoice.otherFees?.map((fee, idx) => (
                <Descriptions.Item label={`6. Phụ phí phát sinh (${fee.description})`} key={idx}>
                  <strong>{formatCurrency(fee.amount)}</strong>
                </Descriptions.Item>
              ))}
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafaf8', padding: '16px', borderRadius: 8, border: '1px solid #f0ecf6' }}>
              <Text strong style={{ fontSize: 18, color: '#524636' }}>TỔNG TIỀN PHÒNG:</Text>
              <Text strong style={{ fontSize: 22, color: '#cf1322' }}>{formatCurrency(selectedInvoice.totalAmount)}</Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}>
                In biên nhận (PDF)
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </Card>
  );
}
