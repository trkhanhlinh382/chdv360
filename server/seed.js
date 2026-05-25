const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Tenant = require('./models/Tenant');
const Contract = require('./models/Contract');
const Invoice = require('./models/Invoice');
const User = require('./models/User');
const Expense = require('./models/Expense');

const seedDB = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chdv360');
    console.log('Database connected for seeding...');

    // Clear existing data
    await Building.deleteMany();
    await Apartment.deleteMany();
    await Tenant.deleteMany();
    await Contract.deleteMany();
    await Invoice.deleteMany();
    await User.deleteMany();
    await Expense.deleteMany();
    console.log('Existing collections cleared.');


    // 1. Seed Buildings
    const b1 = await Building.create({
      code: 'SR-01',
      name: 'Toà nhà Sunrise Apartment',
      address: '79 Nguyễn Thị Thập, phường Tân Hưng, Quận 7, TP HCM',
      region: 'Quận 7',
      numberOfFloors: 5,
      parkingCapacity: 15,
      description: 'Chung cư mini cao cấp vị trí trung tâm Quận 7, an ninh 24/7, bãi đỗ xe rộng rãi, thang máy di chuyển nhanh.',
      images: [
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Thang máy', 'Bảo vệ 24/7', 'Camera an ninh', 'Internet tốc độ cao', 'Giờ giấc tự do'],
      apartmentTypes: ['Studio', '1PN', '2PN', 'Duplex'],
      defaultFees: {
        electricPrice: 4000,
        waterPrice: 30000,
        serviceFee: 150000,
        parkingFee: 100000
      },
      services: [
        { name: 'Internet cáp quang tốc độ cao', fee: 100000, unit: 'phòng/tháng', active: true },
        { name: 'Phí đổ rác & Vệ sinh công cộng', fee: 50000, unit: 'phòng/tháng', active: true },
        { name: 'Bảo trì thang máy & Điện hành lang', fee: 50000, unit: 'phòng/tháng', active: true }
      ]
    });

    const b2 = await Building.create({
      code: 'EH-02',
      name: 'Toà nhà Eco Home',
      address: '12 Lăng Cha Cả, phường 4, quận Tân Bình, TP HCM',
      region: 'Quận Tân Bình',
      numberOfFloors: 6,
      parkingCapacity: 12,
      description: 'Căn hộ dịch vụ tiện nghi xanh, gần sân bay Tân Sơn Nhất, bảo vệ trực camera an toàn, khu dân cư yên tĩnh.',
      images: [
        'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Camera an ninh', 'Internet tốc độ cao', 'Không chung chủ', 'Hầm để xe rộng'],
      apartmentTypes: ['Studio', '1PN'],
      defaultFees: {
        electricPrice: 3800,
        waterPrice: 25000,
        serviceFee: 120000,
        parkingFee: 80000
      },
      services: [
        { name: 'Internet cáp quang', fee: 80000, unit: 'phòng/tháng', active: true },
        { name: 'Vệ sinh tòa nhà & Rác', fee: 40000, unit: 'phòng/tháng', active: true }
      ]
    });


    console.log('Buildings seeded successfully.');

    // 2. Seed Apartments
    // Sunrise Apartment Rooms
    const a1 = await Apartment.create({
      buildingId: b1._id,
      name: 'Phòng 101',
      code: 'SR-101',
      floor: 'Tầng 1',
      type: 'Studio',
      area: 30,
      maxTenants: 2,
      deposit: 5000000,
      price: 5000000,
      status: 'Occupied',
      amenities: ['Ban công', 'Máy giặt riêng', 'Cửa sổ thoáng'],
      assets: [
        { name: 'Điều hòa Daikin Inverter', status: 'New', serialNumber: 'DK-9812A' },
        { name: 'Tủ lạnh Panasonic 180L', status: 'Good', serialNumber: 'PN-0918B' },
        { name: 'Giường gỗ sồi & Đệm lò xo', status: 'Good' },
        { name: 'Bếp từ đôi Kangaroo', status: 'Good' }
      ],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']
    });

    const a2 = await Apartment.create({
      buildingId: b1._id,
      name: 'Phòng 201',
      code: 'SR-201',
      floor: 'Tầng 2',
      type: '1PN',
      area: 45,
      maxTenants: 3,
      deposit: 7000000,
      price: 7000000,
      status: 'Vacant',
      amenities: ['Có gác', 'Tủ quần áo lớn', 'Ánh sáng tự nhiên'],
      assets: [
        { name: 'Điều hòa Panasonic', status: 'Good', serialNumber: 'PS-12345' },
        { name: 'Máy nước nóng Ariston', status: 'New', serialNumber: 'AR-7788' }
      ],
      images: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80']
    });

    const a3 = await Apartment.create({
      buildingId: b1._id,
      name: 'Phòng 301',
      code: 'SR-301',
      floor: 'Tầng 3',
      type: '2PN',
      area: 60,
      maxTenants: 4,
      deposit: 10000000,
      price: 10000000,
      status: 'Maintenance',
      amenities: ['Thang máy', 'Sân phơi đồ', 'Góc bếp rộng'],
      assets: [
        { name: 'Điều hòa Daikin', status: 'Broken', serialNumber: 'DK-0000' }
      ],
      images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80']
    });

    // Eco Home Rooms
    const a4 = await Apartment.create({
      buildingId: b2._id,
      name: 'Phòng 101',
      code: 'EH-101',
      floor: 'Tầng 1',
      type: 'Studio',
      area: 28,
      maxTenants: 2,
      deposit: 4000000,
      price: 4000000,
      status: 'Occupied',
      amenities: ['Cửa sổ giếng trời', 'Tủ bếp trên dưới'],
      assets: [
        { name: 'Điều hòa LG Inverter', status: 'Good', serialNumber: 'LG-6655' }
      ],
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80']
    });

    const a5 = await Apartment.create({
      buildingId: b2._id,
      name: 'Phòng 102',
      code: 'EH-102',
      floor: 'Tầng 1',
      type: 'Studio',
      area: 28,
      maxTenants: 2,
      deposit: 4000000,
      price: 4000000,
      status: 'Vacant',
      amenities: ['Khu phơi riêng', 'Cửa khóa thẻ từ'],
      assets: [
        { name: 'Điều hòa LG Inverter', status: 'Good', serialNumber: 'LG-6656' }
      ],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']
    });

    console.log('Apartments seeded successfully.');

    // 3. Seed Tenants
    // Tenant for Sunrise 101
    const t1 = await Tenant.create({
      apartmentId: a1._id,
      name: 'Nguyễn Văn Anh',
      phone: '0987654321',
      email: 'vananh.nguyen@gmail.com',
      identityCard: '079096123456',
      birthDate: new Date('1998-05-15'),
      gender: 'Nam',
      permanentAddress: '123 Trần Hưng Đạo, TP Quy Nhơn, Bình Định',
      occupation: 'Kỹ sư phần mềm',
      companyOrSchool: 'FPT Software Quận 9',
      vehicles: [
        { ownerName: 'Nguyễn Văn Anh', brand: 'Honda Vision', color: 'Đỏ đen', licensePlate: '59-P1 123.45' }
      ],
      coResidents: [
        { name: 'Trần Thị Mỹ Duyên', phone: '0912345678', identityCard: '079198654321', relationship: 'Vợ' }
      ],
      depositPaid: 5000000,
      status: 'Active'
    });

    // Tenant for Eco Home 101
    const t2 = await Tenant.create({
      apartmentId: a4._id,
      name: 'Lê Quốc Khánh',
      phone: '0909090909',
      email: 'quockhanh.le@gmail.com',
      identityCard: '045095999888',
      birthDate: new Date('2000-11-20'),
      gender: 'Nam',
      permanentAddress: 'Khu phố 3, Phường 2, TP Tân An, Long An',
      occupation: 'Nhân viên kinh doanh',
      companyOrSchool: 'Masan Group Quận 1',
      vehicles: [
        { ownerName: 'Lê Quốc Khánh', brand: 'Yamaha Exciter', color: 'Xanh GP', licensePlate: '59-S2 999.99' }
      ],
      coResidents: [],
      depositPaid: 4000000,
      status: 'Active'
    });

    console.log('Tenants seeded successfully.');

    // 4. Seed Contracts
    // Contract for Sunrise 101 (Expires soon - within 30 days!)
    const contractEndDate = new Date();
    contractEndDate.setDate(contractEndDate.getDate() + 15); // Expires in 15 days

    const c1 = await Contract.create({
      apartmentId: a1._id,
      tenantId: t1._id,
      contractNumber: 'HD-SR101-01',
      startDate: new Date('2025-06-01'),
      endDate: contractEndDate,
      depositAmount: 5000000,
      rentalPrice: 5000000,
      paymentCycle: 1,
      billingDate: 5,
      status: 'Active',
      terms: 'Người thuê có trách nhiệm giữ gìn vệ sinh chung, nộp tiền phòng đúng hẹn trước ngày 5 hàng tháng. Không nuôi thú cưng lớn gây ồn ào.'
    });

    // Contract for Eco Home 101
    const c2 = await Contract.create({
      apartmentId: a4._id,
      tenantId: t2._id,
      contractNumber: 'HD-EH101-01',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2026-11-01'),
      depositAmount: 4000000,
      rentalPrice: 4000000,
      paymentCycle: 1,
      billingDate: 5,
      status: 'Active',
      terms: 'Không mở nhạc quá lớn sau 22h đêm. Thanh toán tiền điện nước theo chỉ số thực tế sử dụng.'
    });

    console.log('Contracts seeded successfully.');

    // 5. Seed Invoices
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, '0')}`;

    // Paid Invoices for last month
    await Invoice.create({
      apartmentId: a1._id,
      tenantId: t1._id,
      billingMonth: lastMonth,
      roomPrice: 5000000,
      electricity: {
        oldIndex: 1000,
        newIndex: 1120,
        consumption: 120,
        unitPrice: 4000,
        total: 480000
      },
      water: {
        oldIndex: 50,
        newIndex: 55,
        consumption: 5,
        unitPrice: 30000,
        total: 150000
      },
      serviceFee: 150000,
      parkingFee: 100000,
      otherFees: [],
      totalAmount: 5880000,
      status: 'Paid',
      paymentDate: new Date()
    });

    // Current Month Invoice (Sunrise 101 - Paid)
    await Invoice.create({
      apartmentId: a1._id,
      tenantId: t1._id,
      billingMonth: currentMonth,
      roomPrice: 5000000,
      electricity: {
        oldIndex: 1120,
        newIndex: 1250,
        consumption: 130,
        unitPrice: 4000,
        total: 520000
      },
      water: {
        oldIndex: 55,
        newIndex: 61,
        consumption: 6,
        unitPrice: 30000,
        total: 180000
      },
      serviceFee: 150000,
      parkingFee: 100000,
      otherFees: [
        { description: 'Tiền dọn vệ sinh hành lang phát sinh', amount: 50000 }
      ],
      totalAmount: 6000000,
      status: 'Paid',
      paymentDate: new Date()
    });

    // Current Month Invoice (Eco Home 101 - Unpaid)
    await Invoice.create({
      apartmentId: a4._id,
      tenantId: t2._id,
      billingMonth: currentMonth,
      roomPrice: 4000000,
      electricity: {
        oldIndex: 500,
        newIndex: 610,
        consumption: 110,
        unitPrice: 3800,
        total: 418000
      },
      water: {
        oldIndex: 30,
        newIndex: 34,
        consumption: 4,
        unitPrice: 25000,
        total: 100000
      },
      serviceFee: 120000,
      parkingFee: 80000,
      otherFees: [],
      totalAmount: 4718000,
      status: 'Unpaid'
    });

    console.log('Invoices seeded successfully.');

    // 5.5 Seed Expenses
    await Expense.create({
      buildingId: b1._id,
      title: 'Bảo trì thang máy định kỳ',
      amount: 1500000,
      category: 'Maintenance',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      description: 'Bảo dưỡng định kỳ hệ thống thang máy Otis block A.'
    });

    await Expense.create({
      buildingId: b1._id,
      title: 'Thay block máy bơm nước tầng hầm',
      amount: 2800000,
      category: 'Maintenance',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: 'Máy bơm hầm xe bị cháy cuộn đồng, đã thay thế linh kiện chính hãng bảo hành 12 tháng.'
    });

    await Expense.create({
      buildingId: b2._id,
      title: 'Vệ sinh bồn nước sân thượng',
      amount: 800000,
      category: 'Maintenance',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      description: 'Thuê dịch vụ vệ sinh và sục rửa bồn nước dung tích 5000L.'
    });

    await Expense.create({
      buildingId: b2._id,
      title: 'Mua hóa chất dọn dẹp & khử trùng',
      amount: 350000,
      category: 'Operating',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: 'Mua nước lau sàn, cồn khử khuẩn hành lang và sảnh.'
    });

    console.log('Expenses seeded successfully.');

    // 6. Seed Staff User
    // Note: the pre-save hook on UserSchema will hash this password automatically!
    const staffUser = await User.create({
      name: 'Nguyễn Trần Nhân Viên',
      phone: '0888888888',
      password: 'password123',
      role: 'staff',
      assignedBuildings: [b1._id], // Assigned ONLY to Sunrise Apartment!
      active: true
    });

    console.log('Staff User seeded successfully.');
    console.log('\n--- SEED COMPLETE ---');
    console.log('Admin account (from environment):');
    console.log(`- Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`- Password: ${process.env.ADMIN_PASSWORD || 'admin'}`);
    console.log('Staff account (seeded):');
    console.log(`- Phone: ${staffUser.phone}`);
    console.log('- Password: password123');
    console.log(`- Assigned building: ${b1.name}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDB();
