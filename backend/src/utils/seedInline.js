const QRCode = require('qrcode');
const User = require('../models/User');
const Device = require('../models/Device');
const Pickup = require('../models/Pickup');
const Inspection = require('../models/Inspection');
const Repair = require('../models/Repair');
const Reuse = require('../models/Reuse');
const Recycling = require('../models/Recycling');
const Reward = require('../models/Reward');
const getTrackingUrl = require('./trackingUrl');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

const generateQR = async (deviceId) => {
  return await QRCode.toDataURL(getTrackingUrl(deviceId), {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#0f3d2e', light: '#ffffff' },
  });
};

const seedDatabaseInline = async () => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Demo seeding is only available in development.');
  }
  if (typeof DEMO_PASSWORD !== 'string' || DEMO_PASSWORD.length < 12) {
    throw new Error('Set a development-only DEMO_PASSWORD of at least 12 characters before seeding.');
  }

  // 1. Create Core Users
  const userPriya = await User.create({
    name: 'Priya Sharma',
    email: 'user@retech.com',
    phone: '+91 9876543210',
    password: DEMO_PASSWORD,
    address: { street: '42, 2nd Main Road', city: 'Anna Nagar, Chennai', state: 'Tamil Nadu', pincode: '600040' },
    role: 'user',
    rewardPoints: 375,
  });

  const userArun = await User.create({
    name: 'Arun Kumar',
    email: 'arun@example.com',
    phone: '+91 9876543211',
    password: DEMO_PASSWORD,
    address: { street: '15, Gandhi Road', city: 'T. Nagar, Chennai', state: 'Tamil Nadu', pincode: '600017' },
    role: 'user',
    rewardPoints: 120,
  });

  const userSneha = await User.create({
    name: 'Sneha R',
    email: 'sneha@example.com',
    phone: '+91 9876543212',
    password: DEMO_PASSWORD,
    address: { street: '8, Lake View St', city: 'Velachery, Chennai', state: 'Tamil Nadu', pincode: '600042' },
    role: 'user',
    rewardPoints: 210,
  });

  const userKarthik = await User.create({
    name: 'Karthik M',
    email: 'karthik@example.com',
    phone: '+91 9876543213',
    password: DEMO_PASSWORD,
    address: { street: '27, Beach Avenue', city: 'Adyar, Chennai', state: 'Tamil Nadu', pincode: '600020' },
    role: 'user',
    rewardPoints: 80,
  });

  const collectorRamesh = await User.create({
    name: 'Ramesh Kumar',
    email: 'collector@retech.com',
    phone: '+91 9876543214',
    password: DEMO_PASSWORD,
    address: { street: 'Hub 12, South District', city: 'Chennai', state: 'Tamil Nadu', pincode: '600032' },
    role: 'collector',
  });

  const technicianArvind = await User.create({
    name: 'Arvind Swaminathan',
    email: 'technician@retech.com',
    phone: '+91 9876543215',
    password: DEMO_PASSWORD,
    address: { street: 'Lab 4, Central Workshop', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
    role: 'technician',
  });

  const adminUser = await User.create({
    name: 'Admin Officer',
    email: 'admin@retech.com',
    phone: '+91 9876543216',
    password: DEMO_PASSWORD,
    address: { street: 'HQ Green Tower', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
    role: 'admin',
  });

  // 2. Create Devices matching the UI
  const qr1 = await generateQR('RET-2026-0001');
  const device1 = await Device.create({
    deviceId: 'RET-2026-0001',
    owner: userPriya._id,
    category: 'Laptop',
    brand: 'Dell',
    model: 'Inspiron 15',
    serialNumber: 'DL-INSP-88231',
    condition: 'Partially Working',
    issueDescription: 'Battery not charging and display issue',
    purchaseYear: 2022,
    estimatedAge: '4 years',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
    qrCode: qr1,
    status: 'UNDER_REPAIR',
    currentStage: 'Repair in Progress',
    createdAt: new Date('2026-09-15T10:30:00Z'),
    lifecycleHistory: [
      {
        stage: 'Device Registered',
        status: 'REGISTERED',
        title: 'Device Registered',
        description: 'Logged by Priya Sharma via online portal.',
        timestamp: new Date('2026-09-15T10:30:00Z'),
        updatedBy: userPriya._id,
      },
      {
        stage: 'Pickup Requested',
        status: 'PICKUP_REQUESTED',
        title: 'Pickup Requested',
        description: 'Doorstep collection requested for Anna Nagar.',
        timestamp: new Date('2026-09-15T11:00:00Z'),
        updatedBy: userPriya._id,
      },
      {
        stage: 'Pickup Completed',
        status: 'COLLECTED',
        title: 'Pickup Completed',
        description: 'Collected by Agent Ramesh Kumar.',
        timestamp: new Date('2026-09-16T14:45:00Z'),
        updatedBy: collectorRamesh._id,
      },
      {
        stage: 'Device Received',
        status: 'RECEIVED',
        title: 'Device Received at Hub',
        description: 'Logged into warehouse diagnostic bay.',
        timestamp: new Date('2026-09-16T16:30:00Z'),
        updatedBy: collectorRamesh._id,
      },
      {
        stage: 'Inspection Completed',
        status: 'UNDER_REPAIR',
        title: 'Under Inspection',
        description: 'Diagnosed by Arvind Swaminathan. Motherboard power IC faulty, battery needs replacement.',
        timestamp: new Date('2026-09-17T11:20:00Z'),
        updatedBy: technicianArvind._id,
      },
      {
        stage: 'Repair in Progress',
        status: 'UNDER_REPAIR',
        title: 'Repair in Progress',
        description: 'Replacement parts installed. Testing power delivery and circuit board.',
        timestamp: new Date('2026-09-18T15:10:00Z'),
        updatedBy: technicianArvind._id,
      },
    ],
  });

  const qr2 = await generateQR('RET-2026-0002');
  const device2 = await Device.create({
    deviceId: 'RET-2026-0002',
    owner: userPriya._id,
    category: 'Mobile Phone',
    brand: 'Apple',
    model: 'iPhone 11',
    serialNumber: 'APL-IPH-99120',
    condition: 'Working',
    issueDescription: 'Battery health degraded to 72%, screen clean',
    purchaseYear: 2021,
    estimatedAge: '5 years',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60',
    qrCode: qr2,
    status: 'REUSED',
    currentStage: 'Ready for Reuse',
    createdAt: new Date('2026-08-20T09:15:00Z'),
    lifecycleHistory: [
      {
        stage: 'Device Registered',
        status: 'REGISTERED',
        title: 'Device Registered',
        description: 'Logged by user.',
        timestamp: new Date('2026-08-20T09:15:00Z'),
      },
      {
        stage: 'Pickup Completed',
        status: 'COLLECTED',
        title: 'Pickup Completed',
        description: 'Collected by agent.',
        timestamp: new Date('2026-08-21T11:00:00Z'),
      },
      {
        stage: 'Inspection Completed',
        status: 'REUSED',
        title: 'Inspection Completed - Eligible for Reuse',
        description: 'Battery serviced and restored to 100%. Donated to rural high school digital lab.',
        timestamp: new Date('2026-08-24T14:00:00Z'),
      },
    ],
  });

  const qr3 = await generateQR('RET-2026-0003');
  const device3 = await Device.create({
    deviceId: 'RET-2026-0003',
    owner: userPriya._id,
    category: 'Printer',
    brand: 'HP',
    model: 'LaserJet Pro M404',
    serialNumber: 'HP-LJT-33491',
    condition: 'Not Working',
    issueDescription: 'Roller gear cracked and logic board burnt',
    purchaseYear: 2018,
    estimatedAge: '8 years',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60',
    qrCode: qr3,
    status: 'RECYCLED',
    currentStage: 'Recycled',
    createdAt: new Date('2026-07-10T14:00:00Z'),
    lifecycleHistory: [
      {
        stage: 'Device Registered',
        status: 'REGISTERED',
        title: 'Device Registered',
        description: 'Registered.',
        timestamp: new Date('2026-07-10T14:00:00Z'),
      },
      {
        stage: 'Pickup Completed',
        status: 'COLLECTED',
        title: 'Pickup Completed',
        description: 'Collected by logistics agent.',
        timestamp: new Date('2026-07-12T10:00:00Z'),
      },
      {
        stage: 'Recycled',
        status: 'RECYCLED',
        title: 'Certified Recycling Completed',
        description: 'Materials safely recovered: 4.2 kg plastic, 1.1 kg steel, 0.4 kg copper.',
        timestamp: new Date('2026-07-16T16:30:00Z'),
      },
    ],
  });

  const qr4 = await generateQR('RET-2026-0004');
  const device4 = await Device.create({
    deviceId: 'RET-2026-0004',
    owner: userKarthik._id,
    category: 'Monitor',
    brand: 'Samsung',
    model: '24" Curved FHD',
    serialNumber: 'SAM-MON-55102',
    condition: 'Partially Working',
    issueDescription: 'Display flickering intermittently',
    purchaseYear: 2023,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
    qrCode: qr4,
    status: 'RECEIVED',
    currentStage: 'Device Received at Hub',
    createdAt: new Date('2026-09-17T12:00:00Z'),
    lifecycleHistory: [
      {
        stage: 'Device Registered',
        status: 'REGISTERED',
        title: 'Device Registered',
        description: 'Device submitted by Karthik M.',
        timestamp: new Date('2026-09-17T12:00:00Z'),
      },
      {
        stage: 'Pickup Completed',
        status: 'COLLECTED',
        title: 'Collected by Agent',
        description: 'Doorstep pickup completed.',
        timestamp: new Date('2026-09-18T10:00:00Z'),
      },
    ],
  });

  const openDevice = await Device.create({
    deviceId: 'RET-2026-0005',
    owner: userArun._id,
    category: 'Mobile Phone',
    brand: 'Samsung',
    model: 'Galaxy S20',
    condition: 'Not Working',
    issueDescription: 'Battery issue and cracked back glass',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60',
    qrCode: await generateQR('RET-2026-0005'),
    status: 'PICKUP_REQUESTED',
    currentStage: 'Pickup Requested',
  });

  // Pickups
  await Pickup.create({
    pickupId: 'PCK-2026-0001',
    device: device1._id,
    user: userPriya._id,
    collector: collectorRamesh._id,
    address: userPriya.address,
    preferredDate: new Date('2026-09-16'),
    preferredTime: 'Afternoon (01:00 PM - 04:00 PM)',
    contactNumber: userPriya.phone,
    status: 'COLLECTED',
    collectedAt: new Date('2026-09-16T14:45:00Z'),
    notes: 'Please call before arriving.',
  });

  await Pickup.create({
    pickupId: 'PCK-2026-0002',
    device: device2._id,
    user: userPriya._id,
    collector: collectorRamesh._id,
    address: userPriya.address,
    preferredDate: new Date('2026-08-21'),
    status: 'COLLECTED',
    collectedAt: new Date('2026-08-21T11:00:00Z'),
    contactNumber: userPriya.phone,
  });

  await Pickup.create({
    pickupId: 'PCK-2026-0003',
    device: device3._id,
    user: userPriya._id,
    collector: collectorRamesh._id,
    address: userPriya.address,
    preferredDate: new Date('2026-07-12'),
    status: 'COLLECTED',
    collectedAt: new Date('2026-07-12T10:00:00Z'),
    contactNumber: userPriya.phone,
  });

  await Pickup.create({
    pickupId: 'PCK-2026-0004',
    device: openDevice._id,
    user: userArun._id,
    collector: null,
    address: userArun.address,
    preferredDate: new Date('2026-09-28'),
    preferredTime: 'Morning (09:00 AM - 12:00 PM)',
    contactNumber: userArun.phone,
    status: 'REQUESTED',
    notes: 'Security gate pass code #402',
  });

  // Inspection & Repair
  await Inspection.create({
    inspectionId: 'INSP-2026-0001',
    device: device1._id,
    technician: technicianArvind._id,
    deviceCondition: 'Partially Working - Salvageable',
    physicalDamage: 'Minor Scratches',
    batteryCondition: 'Degraded',
    displayCondition: 'Scratched',
    motherboardCondition: 'Minor Circuit Fault',
    storageCondition: 'Healthy',
    ramCondition: 'Working',
    otherIssues: 'Power jack soldering loose.',
    estimatedRepairCost: 1450,
    repairPossible: true,
    reusePossible: true,
    recyclingRequired: false,
    outcome: 'REPAIR',
    notes: 'Recommended DC jack replacement and power rail resistor fix.',
  });

  await Repair.create({
    repairId: 'REP-2026-0001',
    device: device1._id,
    technician: technicianArvind._id,
    problem: 'Battery not holding charge & display flickering',
    diagnosis: 'Defective DC power connector and blown PWM charging IC',
    partsRequired: [
      { partName: 'Dell 65W DC Jack Cable', cost: 450 },
      { partName: 'ISL95520 Charging Controller IC', cost: 400 },
    ],
    partsCost: 850,
    labourCost: 600,
    totalCost: 1450,
    status: 'IN PROGRESS',
    notes: 'Soldering completed. Running 24-hr stability stress test.',
    startedAt: new Date('2026-09-18T15:10:00Z'),
  });

  // Reuse
  await Reuse.create({
    reuseId: 'REU-2026-0001',
    device: device2._id,
    reuseType: 'Donate',
    conditionAfterRepair: 'Refurbished - Grade A Functional',
    estimatedValue: 18500,
    finalDestination: 'Rural Youth Skill Development Center, Kanchipuram',
    managedBy: technicianArvind._id,
    notes: 'Certified clean, OS reinstalled, battery health optimized.',
  });

  // Recycling
  await Recycling.create({
    recyclingId: 'RCY-2026-0001',
    device: device3._id,
    partner: 'GreenTech Eco-Recyclers Ltd.',
    weightKg: 6.8,
    materialsRecovered: [
      { material: 'Plastic', percentage: 45, weightKg: 3.06 },
      { material: 'Steel', percentage: 30, weightKg: 2.04 },
      { material: 'Circuit boards', percentage: 15, weightKg: 1.02 },
      { material: 'Copper', percentage: 10, weightKg: 0.68 },
    ],
    status: 'COMPLETED',
    co2OffsetKg: 15.6,
    certificateNumber: 'CERT-ENV-774912',
    notes: 'Zero toxic landfill compliance achieved.',
  });

  // Rewards for Priya
  await Reward.create({
    user: userPriya._id,
    points: 50,
    type: 'EARNED',
    title: 'Welcome Bonus',
    description: 'Account registration on ReTech.',
    createdAt: new Date('2026-07-01'),
  });
  await Reward.create({
    user: userPriya._id,
    points: 100,
    type: 'EARNED',
    title: 'Laptop Submitted (Dell Inspiron)',
    description: 'Awarded 100 points for laptop submission.',
    device: device1._id,
    eventType: 'DEVICE_SUBMISSION',
    createdAt: new Date('2026-09-15'),
  });
  await Reward.create({
    user: userPriya._id,
    points: 150,
    type: 'EARNED',
    title: 'Device Reusable Bonus (iPhone 11)',
    description: 'Bonus for device saved from landfill and certified for reuse!',
    device: device2._id,
    eventType: 'DEVICE_REUSED',
    createdAt: new Date('2026-08-24'),
  });
  await Reward.create({
    user: userPriya._id,
    points: 75,
    type: 'EARNED',
    title: 'E-Waste Recycling Contribution (HP LaserJet)',
    description: 'Points for responsible e-waste recycling.',
    device: device3._id,
    eventType: 'DEVICE_RECYCLED',
    createdAt: new Date('2026-07-16'),
  });
};

module.exports = seedDatabaseInline;
