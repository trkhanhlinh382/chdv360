import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Steps, 
  Button, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Row, 
  Col, 
  Typography, 
  message, 
  Divider, 
  Upload, 
  Space, 
  Badge, 
  Descriptions,
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckCircleOutlined,
  HomeOutlined, 
  UserOutlined, 
  CarOutlined, 
  FileTextOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Image compression utility
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

export default function CheckinWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramApartmentId = searchParams.get('apartmentId');

  const [currentStep, setCurrentStep] = useState(0);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form references for each step
  const [formStep1] = Form.useForm();
  const [formStep2] = Form.useForm();
  const [formStep3] = Form.useForm();
  const [formStep4] = Form.useForm();

  // Images state
  const [uploadedFront, setUploadedFront] = useState(null);
  const [uploadedBack, setUploadedBack] = useState(null);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);

  // Combined Wizard state for display and submit
  const [wizardData, setWizardData] = useState({
    step1: {},
    step2: {},
    step3: { vehicles: [], coResidents: [] },
    step4: {}
  });

  // Load buildings and apartments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const buildRes = await api.getBuildings();
        setBuildings(buildRes.data);
        const aptRes = await api.getApartments();
        setApartments(aptRes.data);

        // If apartmentId is passed in URL, auto-fill Step 1
        if (paramApartmentId) {
          const selectedApt = aptRes.data.find(a => a._id === paramApartmentId);
          if (selectedApt) {
            formStep1.setFieldsValue({
              buildingId: selectedApt.buildingId?._id || selectedApt.buildingId,
              apartmentId: selectedApt._id,
              price: selectedApt.price,
              deposit: selectedApt.deposit
            });
          }
        }
      } catch (error) {
        message.error('Không thể tải danh sách dữ liệu ban đầu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paramApartmentId]);

  // Watchers for Step 1
  const selectedBuildingId = Form.useWatch('buildingId', formStep1);
  const selectedApartmentId = Form.useWatch('apartmentId', formStep1);

  // Filter apartments belonging to selected building
  const filteredApartments = apartments.filter(apt => {
    const bId = apt.buildingId?._id || apt.buildingId;
    return bId === selectedBuildingId && (apt.status === 'Vacant' || apt._id === paramApartmentId);
  });

  // Handle change in apartment selection to auto-fill prices
  const handleApartmentChange = (aptId) => {
    const apt = apartments.find(a => a._id === aptId);
    if (apt) {
      formStep1.setFieldsValue({
        price: apt.price,
        deposit: apt.deposit
      });
    }
  };

  // Next / Previous Navigation with validation
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        const values = await formStep1.validateFields();
        setWizardData(prev => ({ ...prev, step1: values }));
        setCurrentStep(1);
      } else if (currentStep === 1) {
        const values = await formStep2.validateFields();
        setWizardData(prev => ({ ...prev, step2: values }));
        setCurrentStep(2);
      } else if (currentStep === 2) {
        const values = await formStep3.validateFields();
        setWizardData(prev => ({ ...prev, step3: values }));
        setCurrentStep(3);
      } else if (currentStep === 3) {
        const values = await formStep4.validateFields();
        setWizardData(prev => ({ ...prev, step4: values }));
        setCurrentStep(4);
      }
    } catch (error) {
      message.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc');
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Submit flow
  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // 1. Prepare Tenant Payload
      const tenantPayload = {
        apartmentId: wizardData.step1.apartmentId,
        name: wizardData.step2.name,
        phone: wizardData.step2.phone,
        email: wizardData.step2.email,
        identityCard: wizardData.step2.identityCard,
        gender: wizardData.step2.gender,
        birthDate: wizardData.step2.birthDate ? wizardData.step2.birthDate.toDate() : null,
        occupation: wizardData.step2.occupation,
        permanentAddress: wizardData.step2.permanentAddress,
        depositPaid: wizardData.step1.deposit, // actual deposit paid
        identityCardFront: uploadedFront,
        identityCardBack: uploadedBack,
        vehicles: wizardData.step3.vehicles || [],
        coResidents: wizardData.step3.coResidents || [],
        status: 'Active'
      };

      // 2. Call API to create Tenant (this sets apartment to Occupied)
      const tenantRes = await api.createTenant(tenantPayload);
      const tenantId = tenantRes.data._id;

      // 3. Prepare Contract Payload
      const contractPayload = {
        contractNumber: wizardData.step4.contractNumber,
        apartmentId: wizardData.step1.apartmentId,
        tenantId: tenantId,
        startDate: wizardData.step4.startDate ? wizardData.step4.startDate.toDate() : null,
        endDate: wizardData.step4.endDate ? wizardData.step4.endDate.toDate() : null,
        rentalPrice: wizardData.step1.price,
        depositAmount: wizardData.step1.deposit,
        paymentCycle: wizardData.step4.paymentCycle,
        billingDate: wizardData.step4.billingDate,
        terms: wizardData.step4.terms,
        attachments: uploadedAttachments,
        status: 'Active'
      };

      // 4. Call API to create Contract
      await api.createContract(contractPayload);

      // Display warning if any, else success
      if (tenantRes.parkingWarning) {
        message.warning('Đã hoàn tất quy trình nhận phòng. Tuy nhiên: ' + tenantRes.parkingWarning, 8);
      } else {
        message.success('Đã hoàn tất quy trình nhận phòng thành công');
      }

      // Redirect to contracts management
      navigate('/contracts');
    } catch (error) {
      message.error(error.message || 'Lỗi hệ thống khi làm thủ tục nhận phòng. Vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper variables for review step
  const selectedBuildingObj = buildings.find(b => b._id === wizardData.step1.buildingId);
  const selectedApartmentObj = apartments.find(a => a._id === wizardData.step1.apartmentId);

  const stepsItems = [
    { title: 'Căn Hộ & Giá', icon: <HomeOutlined /> },
    { title: 'Khách Thuê', icon: <UserOutlined /> },
    { title: 'Xe & Người Ở Cùng', icon: <CarOutlined /> },
    { title: 'Hợp Đồng', icon: <FileTextOutlined /> },
    { title: 'Xác Nhận', icon: <FileSearchOutlined /> }
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#bda46a', fontSize: 22 }} />
            <Title level={4} style={{ margin: 0, color: '#524636' }}>Quy Trình Nhận Phòng Tích Hợp (Check-in Wizard)</Title>
          </Space>
          <Button onClick={() => navigate('/apartments')} icon={<ArrowLeftOutlined />}>Quay lại</Button>
        </div>
      }
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
    >
      <Steps 
        current={currentStep} 
        items={stepsItems} 
        style={{ marginBottom: 32, padding: '0 16px' }}
      />

      <Spin spinning={loading}>
        {/* STEP 1: CHỌN CĂN HỘ & ĐIỀU KHOẢN GIÁ */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <Alert 
            message="Bước 1: Thiết lập Căn hộ & Biểu phí Thuê"
            description="Lựa chọn tòa nhà và phòng còn trống để bắt đầu làm thủ tục. Giá phòng và tiền cọc sẽ được lấy tự động theo cài đặt mặc định của căn hộ, bạn có thể tùy chỉnh lại cho phù hợp với thỏa thuận thực tế."
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Form
            form={formStep1}
            layout="vertical"
            initialValues={{
              price: 0,
              deposit: 0
            }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="buildingId" label="Lựa chọn Tòa nhà" rules={[{ required: true, message: 'Vui lòng chọn tòa nhà' }]}>
                  <Select placeholder="Chọn tòa nhà để xem phòng trống" onChange={() => formStep1.setFieldValue('apartmentId', undefined)}>
                    {buildings.map(b => (
                      <Option key={b._id} value={b._id}>{b.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="apartmentId" label="Chọn Căn hộ Trống" rules={[{ required: true, message: 'Vui lòng chọn căn hộ' }]}>
                  <Select 
                    placeholder={selectedBuildingId ? "Chọn căn hộ" : "Vui lòng chọn Tòa nhà trước"} 
                    disabled={!selectedBuildingId}
                    onChange={handleApartmentChange}
                  >
                    {filteredApartments.map(apt => (
                      <Option key={apt._id} value={apt._id}>
                        {apt.name} (Tầng {apt.floor} - {apt.type})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="price" label="Giá thuê phòng thỏa thuận (VND/tháng)" rules={[{ required: true, message: 'Nhập giá thuê phòng' }]}>
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value.replace(/\$\s?|(,*)/g, '')} 
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="deposit" label="Tiền đặt cọc gốc thực nhận (VND)" rules={[{ required: true, message: 'Nhập tiền đặt cọc' }]}>
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value.replace(/\$\s?|(,*)/g, '')} 
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        {/* STEP 2: THÔNG TIN KHÁCH THUÊ CHÍNH */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <Alert 
            message="Bước 2: Thông tin Khách thuê & Ảnh chụp CCCD"
            description="Vui lòng nhập chính xác thông tin của khách hàng đại diện ký hợp đồng thuê căn hộ. Bản quét/ảnh CCCD hỗ trợ tải định dạng ảnh tối đa 2MB."
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Form
            form={formStep2}
            layout="vertical"
            initialValues={{
              gender: 'Nam'
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Họ tên Khách thuê (Chính)" rules={[{ required: true, message: 'Nhập đầy đủ họ tên khách thuê' }]}>
                  <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Số điện thoại liên hệ" rules={[{ required: true, message: 'Nhập số điện thoại liên hệ' }]}>
                  <Input placeholder="0901234567" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="identityCard" label="Số CCCD / Hộ chiếu" rules={[{ required: true, message: 'Nhập số CCCD' }]}>
                  <Input placeholder="079096001234" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="email" label="Địa chỉ Email (Không bắt buộc)">
                  <Input type="email" placeholder="khachthue@gmail.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="gender" label="Giới tính">
                  <Select>
                    <Option value="Nam">Nam</Option>
                    <Option value="Nữ">Nữ</Option>
                    <Option value="Khác">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="birthDate" label="Ngày tháng năm sinh">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="occupation" label="Nghề nghiệp / Nơi làm việc">
                  <Input placeholder="Kỹ sư phần mềm, Nhân viên văn phòng..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="permanentAddress" label="Địa chỉ thường trú (Theo sổ hộ khẩu/CCCD)">
              <Input placeholder="Số nhà 45, Đường Lê Lợi, Phường 1, Quận Gò Vấp, TP.HCM" />
            </Form.Item>

            <Divider orientation="left" style={{ color: '#bda46a' }}>Hình ảnh thẻ CCCD</Divider>

            <Row gutter={24}>
              <Col xs={24} md={12}>
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
                    <div style={{ position: 'relative', width: '100%', paddingTop: '63%', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6' }}>
                      <img src={uploadedFront} alt="CCCD Front" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <Col xs={24} md={12}>
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
                    <div style={{ position: 'relative', width: '100%', paddingTop: '63%', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6' }}>
                      <img src={uploadedBack} alt="CCCD Back" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
          </Form>
        </div>

        {/* STEP 3: THÀNH VIÊN Ở CÙNG & PHƯƠNG TIỆN */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <Alert 
            message="Bước 3: Thành viên sống cùng & Phương tiện giữ xe"
            description="Đăng ký trước số lượng xe máy gửi và danh sách người ở cùng phòng để hệ thống kiểm soát tải trọng bãi xe và chuẩn bị hồ sơ tạm trú."
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Form
            form={formStep3}
            layout="vertical"
            initialValues={{
              vehicles: [],
              coResidents: []
            }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Divider orientation="left" style={{ color: '#bda46a', marginTop: 0 }}>
                  <CarOutlined /> Đăng ký xe máy gửi
                </Divider>
                <Form.List name="vehicles">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card key={key} size="small" style={{ marginBottom: 8, backgroundColor: '#fafaf9', border: '1px solid #f0edf6' }}>
                          <Row gutter={8} align="middle">
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'brand']} rules={[{ required: true, message: 'Nhập hãng xe' }]} style={{ marginBottom: 0 }}>
                                <Input placeholder="Honda Vision" />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'licensePlate']} rules={[{ required: true, message: 'Nhập biển số' }]} style={{ marginBottom: 0 }}>
                                <Input placeholder="59-B1 123.45" />
                              </Form.Item>
                            </Col>
                            <Col span={4} style={{ textAlign: 'center' }}>
                              <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                        Đăng ký thêm xe máy
                      </Button>
                    </>
                  )}
                </Form.List>
              </Col>

              <Col xs={24} md={12}>
                <Divider orientation="left" style={{ color: '#bda46a', marginTop: 0 }}>
                  <UserOutlined /> Thành viên sống cùng phòng
                </Divider>
                <Form.List name="coResidents">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card key={key} size="small" style={{ marginBottom: 8, backgroundColor: '#fafaf9', border: '1px solid #f0edf6' }}>
                          <Row gutter={8}>
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Nhập họ tên' }]} style={{ marginBottom: 0 }}>
                                <Input placeholder="Họ tên thành viên" />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'relationship']} rules={[{ required: true, message: 'Mối quan hệ' }]} style={{ marginBottom: 0 }}>
                                <Select placeholder="Mối quan hệ">
                                  <Option value="Bạn">Bạn bè</Option>
                                  <Option value="Vợ">Vợ</Option>
                                  <Option value="Chồng">Chồng</Option>
                                  <Option value="Anh em">Anh em</Option>
                                  <Option value="Chị em">Chị em</Option>
                                  <Option value="Bố mẹ">Bố mẹ</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4} style={{ textAlign: 'center' }}>
                              <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                        Thêm thành viên phụ
                      </Button>
                    </>
                  )}
                </Form.List>
              </Col>
            </Row>
          </Form>
        </div>

        {/* STEP 4: LẬP HỢP ĐỒNG THUÊ */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <Alert 
            message="Bước 4: Điều khoản hợp đồng & File đính kèm"
            description="Tạo số hợp đồng pháp lý, quy định chu kỳ đóng tiền và thời hạn thuê phòng. Bạn có thể tải lên các bản chụp ảnh quét tài liệu hợp đồng đã ký kết."
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Form
            form={formStep4}
            layout="vertical"
            initialValues={{
              paymentCycle: 1,
              billingDate: 5
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="contractNumber" label="Mã/Số hợp đồng thuê" rules={[{ required: true, message: 'Nhập mã số hợp đồng' }]}>
                  <Input placeholder="Ví dụ: HD-SR101" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="paymentCycle" label="Chu kỳ đóng tiền (tháng/lần)" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="billingDate" label="Ngày lập hóa đơn hàng tháng" rules={[{ required: true }]}>
                  <InputNumber min={1} max={31} style={{ width: '100%' }} placeholder="Ngày 5" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="startDate" label="Ngày bắt đầu hiệu lực" rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày bắt đầu" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="endDate" label="Ngày hết hạn hợp đồng" rules={[{ required: true, message: 'Chọn ngày kết thúc' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="terms" label="Điều khoản bổ sung / Ghi chú đặc biệt">
              <Input.TextArea rows={4} placeholder="Nhập các điều khoản quy định về đền bù hư hỏng thiết bị, quy tắc ra vào tòa nhà..." />
            </Form.Item>

            <Divider orientation="left" style={{ color: '#bda46a' }}>Bản quét Hợp đồng đính kèm</Divider>

            <Form.Item label="Tải ảnh quét hợp đồng (Tối đa 2MB mỗi ảnh)">
              <Upload
                accept="image/*"
                multiple
                beforeUpload={async (file) => {
                  try {
                    const compressed = await compressImage(file);
                    setUploadedAttachments(prev => [...prev, compressed]);
                  } catch (error) {
                    message.error('Lỗi khi nén ảnh: ' + error.message);
                  }
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<PlusOutlined />}>Tải ảnh hợp đồng</Button>
              </Upload>

              {uploadedAttachments.length > 0 && (
                <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                  {uploadedAttachments.map((img, index) => (
                    <Col span={6} key={index}>
                      <div style={{ position: 'relative', width: '100%', paddingTop: '133%', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0edf6' }}>
                        <img src={img} alt={`Scan page ${index + 1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
        </div>

        {/* STEP 5: XÁC NHẬN & TỔNG KẾT */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <Alert 
            message="Bước 5: Xác nhận toàn bộ thông tin làm thủ tục"
            description="Vui lòng kiểm tra kỹ lưỡng các thông tin bên dưới trước khi bấm xác nhận lưu. Hệ thống sẽ tự động cập nhật trạng thái phòng thành Đã thuê, tạo hồ sơ khách thuê và lập hợp đồng thuê chính thức."
            type="warning"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />

          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Apartment Section */}
            <Card title={<Space><HomeOutlined style={{ color: '#bda46a' }} /> Thông tin Căn Hộ & Biểu Phí</Space>} size="small">
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Tòa nhà">{selectedBuildingObj?.name || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Số/Mã phòng">{selectedApartmentObj?.name || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Giá thuê thỏa thuận">
                  <Text type="danger" strong>{formatCurrency(wizardData.step1.price)}/tháng</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tiền đặt cọc thực đóng">
                  <Text type="warning" strong>{formatCurrency(wizardData.step1.deposit)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Tenant Section */}
            <Card title={<Space><UserOutlined style={{ color: '#bda46a' }} /> Thông tin Khách Thuê Chính</Space>} size="small">
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Họ tên">{wizardData.step2.name}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{wizardData.step2.phone}</Descriptions.Item>
                <Descriptions.Item label="Số CCCD">{wizardData.step2.identityCard}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ Email">{wizardData.step2.email || 'Không cung cấp'}</Descriptions.Item>
                <Descriptions.Item label="Giới tính">{wizardData.step2.gender}</Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  {wizardData.step2.birthDate ? wizardData.step2.birthDate.format('DD/MM/YYYY') : 'Chưa cập nhật'}
                </Descriptions.Item>
                <Descriptions.Item label="Nghề nghiệp">{wizardData.step2.occupation || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Thường trú">{wizardData.step2.permanentAddress || 'N/A'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Co-residents & Vehicles Section */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card title={<Space><CarOutlined style={{ color: '#bda46a' }} /> Đăng ký xe ({wizardData.step3.vehicles?.length || 0} xe)</Space>} size="small">
                  {wizardData.step3.vehicles && wizardData.step3.vehicles.length > 0 ? (
                    wizardData.step3.vehicles.map((v, i) => (
                      <div key={i} style={{ padding: '4px 8px', borderBottom: '1px solid #f0edf6' }}>
                        {i + 1}. Xe <strong>{v.brand}</strong> - Biển số: <strong>{v.licensePlate}</strong>
                      </div>
                    ))
                  ) : (
                    <Text type="secondary" italic>Không đăng ký xe máy</Text>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title={<Space><UserOutlined style={{ color: '#bda46a' }} /> Người ở cùng ({wizardData.step3.coResidents?.length || 0} thành viên)</Space>} size="small">
                  {wizardData.step3.coResidents && wizardData.step3.coResidents.length > 0 ? (
                    wizardData.step3.coResidents.map((c, i) => (
                      <div key={i} style={{ padding: '4px 8px', borderBottom: '1px solid #f0edf6' }}>
                        {i + 1}. Họ tên: <strong>{c.name}</strong> - Mối quan hệ: <strong>{c.relationship}</strong>
                      </div>
                    ))
                  ) : (
                    <Text type="secondary" italic>Không có người ở cùng</Text>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Contract Section */}
            <Card title={<Space><FileTextOutlined style={{ color: '#bda46a' }} /> Thông tin Hợp Đồng Thuê</Space>} size="small">
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Số hợp đồng">{wizardData.step4.contractNumber}</Descriptions.Item>
                <Descriptions.Item label="Kỳ thanh toán">{wizardData.step4.paymentCycle} tháng/lần</Descriptions.Item>
                <Descriptions.Item label="Ngày xuất hóa đơn">Ngày {wizardData.step4.billingDate} hàng tháng</Descriptions.Item>
                <Descriptions.Item label="Thời gian hiệu lực">
                  Từ {wizardData.step4.startDate ? wizardData.step4.startDate.format('DD/MM/YYYY') : ''} đến {wizardData.step4.endDate ? wizardData.step4.endDate.format('DD/MM/YYYY') : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Tài liệu tải lên">{uploadedAttachments.length} bản chụp hợp đồng</Descriptions.Item>
                <Descriptions.Item label="Điều khoản & ghi chú">{wizardData.step4.terms || 'N/A'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        </div>

        {/* NAVIGATIONS BUTTONS */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {currentStep > 0 && (
            <Button onClick={handlePrev} size="large" icon={<ArrowLeftOutlined />}>
              Quay lại bước trước
            </Button>
          )}

          {currentStep < 4 ? (
            <Button type="primary" onClick={handleNext} size="large" icon={<ArrowRightOutlined />} style={{ background: 'linear-gradient(135deg, #bda46a 0%, #9b8451 100%)', border: 'none' }}>
              Tiếp tục
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleFinish} 
              size="large" 
              loading={submitting}
              icon={<CheckCircleOutlined />} 
              style={{ background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none' }}
            >
              Xác nhận hoàn tất nhận phòng
            </Button>
          )}
        </div>
      </Spin>
    </Card>
  );
}
