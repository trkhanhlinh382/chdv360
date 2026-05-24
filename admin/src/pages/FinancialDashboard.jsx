import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Form, Input, InputNumber, Select, Space, Typography, message, Popconfirm, Divider, Progress, Tag, Drawer, Modal } from 'antd';

import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, AreaChartOutlined, PlusOutlined, DeleteOutlined, ToolOutlined, ShopOutlined, AlertOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function FinancialDashboard() {
  const [financialData, setFinancialData] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  const currentUser = api.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await api.getFinancials();
      setFinancialData(res.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu báo cáo dòng tiền');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await api.getBuildings();
      setBuildings(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    fetchFinancials();
    fetchBuildings();
  }, []);

  const handleAddExpense = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date ? new Date(values.date) : new Date()
      };
      await api.createExpense(payload);
      message.success('Đã ghi nhận khoản chi chi phí thành công');
      setExpenseModalOpen(false);
      form.resetFields();
      fetchFinancials();
    } catch (error) {
      message.error(error.message || 'Ghi nhận chi phí thất bại');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      message.success('Đã xóa khoản chi thành công');
      fetchFinancials();
    } catch (error) {
      message.error(error.message || 'Xóa khoản chi thất bại');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Overall Financial Stats Summaries
  const summary = financialData?.summary || {
    totalCollected: 0,
    totalUnpaid: 0,
    totalExpenses: 0,
    totalVacantOpportunityCost: 0,
    netProfit: 0
  };

  const totalPossibleCollected = (summary.totalCollected + summary.totalUnpaid);
  const collectionRate = totalPossibleCollected > 0 
    ? Math.round((summary.totalCollected / totalPossibleCollected) * 100) 
    : 0;

  // Columns for Building Profitability breakdown
  const buildingColumns = [
    {
      title: 'Tòa nhà',
      key: 'building',
      render: (_, record) => (
        <Space>
          <ShopOutlined style={{ color: '#bda46a' }} />
          <div>
            <Text strong style={{ color: '#524636' }}>{record.name}</Text>
            <br />
            <Tag color="blue" style={{ fontSize: 10 }}>{record.code}</Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'Doanh thu thực tế (Đã thu)',
      dataIndex: 'collected',
      key: 'collected',
      render: (val) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Dòng tiền chưa thu (Chưa đóng)',
      dataIndex: 'unpaid',
      key: 'unpaid',
      render: (val) => <Text style={{ color: '#ff4d4f', fontWeight: 500 }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Chi phí bảo dưỡng & vận hành',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (val) => <Text style={{ color: '#1890ff' }}>{formatCurrency(val)}</Text>
    },
    {
      title: 'Tổn thất phòng trống',
      dataIndex: 'vacantOpportunityCost',
      key: 'vacantOpportunityCost',
      render: (val) => (
        <Space>
          <Text style={{ color: '#fa8c16' }}>{formatCurrency(val)}</Text>
          {val > 0 && <Tag color="orange" style={{ fontSize: 10 }}>Thất thoát</Tag>}
        </Space>
      )
    },
    {
      title: 'Lợi nhuận ròng thực tế',
      dataIndex: 'netProfit',
      key: 'netProfit',
      render: (val) => (
        <Text strong style={{ color: val >= 0 ? '#bda46a' : '#cf1322', fontSize: 15 }}>
          {formatCurrency(val)}
        </Text>
      )
    }
  ];

  // Columns for Expenses Table
  const expenseColumns = [
    {
      title: 'Tòa nhà',
      dataIndex: 'buildingName',
      key: 'buildingName'
    },
    {
      title: 'Nội dung chi phí',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <Text strong style={{ color: '#524636' }}>{title}</Text>
    },
    {
      title: 'Số tiền chi',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong style={{ color: '#cf1322' }}>{formatCurrency(amount)}</Text>
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const labels = {
          Maintenance: { text: 'Bảo dưỡng & Sửa chữa', color: 'orange' },
          Operating: { text: 'Vận hành & Dịch vụ', color: 'blue' },
          Administrative: { text: 'Hành chính & Quản lý', color: 'purple' },
          Others: { text: 'Phụ phí khác', color: 'default' }
        };
        const conf = labels[cat] || { text: cat, color: 'default' };
        return <Tag color={conf.color}>{conf.text}</Tag>;
      }
    },
    {
      title: 'Ngày chi',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date)
    },
    {
      title: 'Chi tiết mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Bạn muốn xóa khoản chi này?"
          onConfirm={() => handleDeleteExpense(record._id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#524636' }}>Báo Cáo Dòng Tiền & Doanh Thu Doanh Nghiệp</Title>
          <Text type="secondary">Phân tích chuyên sâu doanh thu thực tế, chi phí bảo trì, hao hụt công suất phòng trống và lợi nhuận ròng.</Text>
        </div>
        {isAdmin && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setExpenseModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}
          >
            Ghi nhận khoản chi vận hành
          </Button>
        )}
      </div>

      {/* KPI Stats Cards Row */}
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: 'none', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#237804', fontWeight: 600 }}>1. Doanh Thu Thực Tế</span>}
              value={summary.totalCollected}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#237804', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success" size="small"><ArrowUpOutlined /> Tiền mặt đã thu vào</Text>
            </div>
          </Card>
        </Col>

        <Col span={5}>
          <Card style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', border: 'none', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#a8071a', fontWeight: 600 }}>2. Dòng Tiền Chưa Thu</span>}
              value={summary.totalUnpaid}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#a8071a', fontWeight: 800 }}
              prefix={<AlertOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="danger" size="small"><ArrowDownOutlined /> Khoản nợ khách thuê</Text>
            </div>
          </Card>
        </Col>

        <Col span={5}>
          <Card style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: 'none', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#0050b3', fontWeight: 600 }}>3. Chi Phí Bảo Trì & Vận Hành</span>}
              value={summary.totalExpenses}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#0050b3', fontWeight: 800 }}
              prefix={<ToolOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="warning" size="small">Chi phí hoạt động thực tế</Text>
            </div>
          </Card>
        </Col>

        <Col span={5}>
          <Card style={{ background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)', border: 'none', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#ad6800', fontWeight: 600 }}>4. Tổn Thất Phòng Trống</span>}
              value={summary.totalVacantOpportunityCost}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#ad6800', fontWeight: 800 }}
              prefix={<ShopOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="warning" size="small">Chi phí cơ hội bị thất thoát</Text>
            </div>
          </Card>
        </Col>

        <Col span={5}>
          <Card style={{ background: 'linear-gradient(135deg, #f9f5ec 0%, #e8dec9 100%)', border: 'none', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#524636', fontWeight: 600 }}>5. LỢI NHUẬN RÒNG</span>}
              value={summary.netProfit}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#9b8451', fontWeight: 800, fontSize: 24 }}
              prefix={<AreaChartOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" size="small">Doanh thu thu về - Chi phí</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Cash Flow Visualizer Progress Card */}
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
        <Title level={5} style={{ color: '#524636', margin: 0 }}>Tỷ Lệ Đã Thu Hồi Dòng Tiền Dịch Vụ</Title>
        <Progress 
          percent={collectionRate} 
          status="active" 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          style={{ marginTop: 12 }}
        />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">Đã thu hồi: <strong>{formatCurrency(summary.totalCollected)}</strong> ({collectionRate}%)</Text>
          <Text type="secondary">Cần thu hồi thêm: <strong>{formatCurrency(summary.totalUnpaid)}</strong> ({100 - collectionRate}%)</Text>
        </div>
      </Card>

      {/* Building breakdown section */}
      <Card 
        title={
          <Space>
            <AreaChartOutlined style={{ color: '#bda46a' }} />
            <Text strong style={{ color: '#524636', fontSize: 16 }}>Báo Cáo Tài Chính Chi Tiết Từng Tòa Nhà</Text>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
      >
        <Table
          dataSource={financialData?.buildingBreakdowns || []}
          columns={buildingColumns}
          rowKey="buildingId"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* Expenses management log section */}
      <Card
        title={
          <Space>
            <ToolOutlined style={{ color: '#bda46a' }} />
            <Text strong style={{ color: '#524636', fontSize: 16 }}>Sổ Nhật Ký Ghi Nhận Khoản Chi Vận Hành & Sửa Chữa</Text>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
      >
        <Table
          dataSource={financialData?.expenses || []}
          columns={expenseColumns}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
        />
      </Card>

      {/* Expense Modal Record Creation */}
      <Modal
        title="Ghi Nhận Khoản Chi Vận Hành / Bảo Trì Tòa Nhà"
        open={expenseModalOpen}
        onCancel={() => setExpenseModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0' }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddExpense}
          initialValues={{
            category: 'Maintenance',
            date: new Date().toISOString().split('T')[0]
          }}
        >
          <Form.Item name="buildingId" label="Chọn tòa nhà phát sinh khoản chi" rules={[{ required: true, message: 'Vui lòng chọn tòa nhà' }]}>
            <Select placeholder="Chọn tòa nhà">
              {Array.isArray(buildings) && buildings.map(b => (
                <Option key={b._id} value={b._id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item name="title" label="Nội dung khoản chi" rules={[{ required: true, message: 'Nhập nội dung khoản chi' }]}>
            <Input placeholder="Ví dụ: Thay block máy bơm nước, Bảo trì thang máy..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Số tiền thanh toán (VND)" rules={[{ required: true, message: 'Nhập số tiền chi' }]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Phân nhóm chi phí" rules={[{ required: true }]}>
                <Select>
                  <Option value="Maintenance">Bảo dưỡng & Sửa chữa</Option>
                  <Option value="Operating">Vận hành & Dịch vụ</Option>
                  <Option value="Administrative">Hành chính & Quản lý</Option>
                  <Option value="Others">Phụ phí khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="date" label="Ngày thực hiện giao dịch chi">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú chi tiết">
            <Input.TextArea rows={3} placeholder="Mô tả lý do chi, thông tin nhà thầu, tình trạng bảo hành linh kiện..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
