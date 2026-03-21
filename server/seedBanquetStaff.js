#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BanquetStaff = require('./models/BanquetStaff');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';
const DEMO_TAG = '[BANQUET-DEMO]';

const supervisorUsers = [
  {
    name: 'Banquet Supervisor',
    email: 'banquet@juancarlos.com',
    password: 'password123',
    role: 'banquet_supervisor',
    department: 'Banquet Operations',
  },
  {
    name: 'Banquet Lead',
    email: 'banquet.lead@juancarlos.com',
    password: 'password123',
    role: 'banquet_supervisor',
    department: 'Banquet Operations',
  },
  {
    name: 'Banquet Ops 1',
    email: 'banquet.ops1@juancarlos.com',
    password: 'password123',
    role: 'banquet_supervisor',
    department: 'Banquet Operations',
  },
  {
    name: 'Banquet Ops 2',
    email: 'banquet.ops2@juancarlos.com',
    password: 'password123',
    role: 'banquet_supervisor',
    department: 'Banquet Operations',
  },
];

const banquetRoster = [
  { employeeId: 'BS-DEMO-0001', firstName: 'Miguel', lastName: 'Reyes', email: 'miguel.reyes.banquet@juancarlos.com', phone: '09170020001', role: 'head_captain', employmentType: 'full_time', ratePerDay: 1650, ratePerHour: 220, yearsOfExperience: 8, rating: 5, totalEventsWorked: 182 },
  { employeeId: 'BS-DEMO-0002', firstName: 'Paolo', lastName: 'Fernandez', email: 'paolo.fernandez.banquet@juancarlos.com', phone: '09170020002', role: 'head_captain', employmentType: 'full_time', ratePerDay: 1600, ratePerHour: 215, yearsOfExperience: 7, rating: 4, totalEventsWorked: 149 },
  { employeeId: 'BS-DEMO-0003', firstName: 'Adrian', lastName: 'Santos', email: 'adrian.santos.banquet@juancarlos.com', phone: '09170020003', role: 'waiter', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 4, rating: 4, totalEventsWorked: 96 },
  { employeeId: 'BS-DEMO-0004', firstName: 'Jules', lastName: 'Cruz', email: 'jules.cruz.banquet@juancarlos.com', phone: '09170020004', role: 'waiter', employmentType: 'part_time', ratePerDay: 920, ratePerHour: 120, yearsOfExperience: 3, rating: 4, totalEventsWorked: 61 },
  { employeeId: 'BS-DEMO-0005', firstName: 'Rico', lastName: 'Mendoza', email: 'rico.mendoza.banquet@juancarlos.com', phone: '09170020005', role: 'waiter', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 3, rating: 4, totalEventsWorked: 57 },
  { employeeId: 'BS-DEMO-0006', firstName: 'Nico', lastName: 'Garcia', email: 'nico.garcia.banquet@juancarlos.com', phone: '09170020006', role: 'waiter', employmentType: 'contractual', ratePerDay: 910, ratePerHour: 120, yearsOfExperience: 2, rating: 3, totalEventsWorked: 38 },
  { employeeId: 'BS-DEMO-0007', firstName: 'Lara', lastName: 'Torres', email: 'lara.torres.banquet@juancarlos.com', phone: '09170020007', role: 'waitress', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 5, rating: 5, totalEventsWorked: 118 },
  { employeeId: 'BS-DEMO-0008', firstName: 'Bea', lastName: 'Navarro', email: 'bea.navarro.banquet@juancarlos.com', phone: '09170020008', role: 'waitress', employmentType: 'part_time', ratePerDay: 930, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 64 },
  { employeeId: 'BS-DEMO-0009', firstName: 'Tina', lastName: 'Lopez', email: 'tina.lopez.banquet@juancarlos.com', phone: '09170020009', role: 'waitress', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 2, rating: 4, totalEventsWorked: 41 },
  { employeeId: 'BS-DEMO-0010', firstName: 'Mara', lastName: 'Dizon', email: 'mara.dizon.banquet@juancarlos.com', phone: '09170020010', role: 'waitress', employmentType: 'contractual', ratePerDay: 910, ratePerHour: 120, yearsOfExperience: 2, rating: 3, totalEventsWorked: 35 },
  { employeeId: 'BS-DEMO-0011', firstName: 'Karl', lastName: 'Aquino', email: 'karl.aquino.banquet@juancarlos.com', phone: '09170020011', role: 'food_runner', employmentType: 'full_time', ratePerDay: 960, ratePerHour: 128, yearsOfExperience: 4, rating: 4, totalEventsWorked: 89 },
  { employeeId: 'BS-DEMO-0012', firstName: 'Ian', lastName: 'Morales', email: 'ian.morales.banquet@juancarlos.com', phone: '09170020012', role: 'food_runner', employmentType: 'part_time', ratePerDay: 920, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 58 },
  { employeeId: 'BS-DEMO-0013', firstName: 'Sean', lastName: 'Bautista', email: 'sean.bautista.banquet@juancarlos.com', phone: '09170020013', role: 'food_runner', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 120, yearsOfExperience: 2, rating: 3, totalEventsWorked: 34 },
  { employeeId: 'BS-DEMO-0014', firstName: 'Carlo', lastName: 'Villanueva', email: 'carlo.villanueva.banquet@juancarlos.com', phone: '09170020014', role: 'busser', employmentType: 'full_time', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 4, rating: 4, totalEventsWorked: 92 },
  { employeeId: 'BS-DEMO-0015', firstName: 'Joey', lastName: 'Ramos', email: 'joey.ramos.banquet@juancarlos.com', phone: '09170020015', role: 'busser', employmentType: 'part_time', ratePerDay: 870, ratePerHour: 115, yearsOfExperience: 2, rating: 3, totalEventsWorked: 44 },
  { employeeId: 'BS-DEMO-0016', firstName: 'Ken', lastName: 'Flores', email: 'ken.flores.banquet@juancarlos.com', phone: '09170020016', role: 'busser', employmentType: 'on_call', ratePerDay: 860, ratePerHour: 112, yearsOfExperience: 2, rating: 3, totalEventsWorked: 29 },
  { employeeId: 'BS-DEMO-0017', firstName: 'Marco', lastName: 'Lim', email: 'marco.lim.banquet@juancarlos.com', phone: '09170020017', role: 'bartender', employmentType: 'full_time', ratePerDay: 1200, ratePerHour: 160, yearsOfExperience: 6, rating: 5, totalEventsWorked: 133 },
  { employeeId: 'BS-DEMO-0018', firstName: 'Aly', lastName: 'De Castro', email: 'aly.decastro.banquet@juancarlos.com', phone: '09170020018', role: 'bartender', employmentType: 'part_time', ratePerDay: 1120, ratePerHour: 150, yearsOfExperience: 4, rating: 4, totalEventsWorked: 74 },
  { employeeId: 'BS-DEMO-0019', firstName: 'Patrick', lastName: 'Sy', email: 'patrick.sy.banquet@juancarlos.com', phone: '09170020019', role: 'setup_crew', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 5, rating: 4, totalEventsWorked: 121 },
  { employeeId: 'BS-DEMO-0020', firstName: 'Ralph', lastName: 'Tan', email: 'ralph.tan.banquet@juancarlos.com', phone: '09170020020', role: 'setup_crew', employmentType: 'part_time', ratePerDay: 930, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 67 },
  { employeeId: 'BS-DEMO-0021', firstName: 'Gio', lastName: 'Uy', email: 'gio.uy.banquet@juancarlos.com', phone: '09170020021', role: 'setup_crew', employmentType: 'contractual', ratePerDay: 920, ratePerHour: 120, yearsOfExperience: 3, rating: 3, totalEventsWorked: 48 },
  { employeeId: 'BS-DEMO-0022', firstName: 'Miko', lastName: 'Co', email: 'miko.co.banquet@juancarlos.com', phone: '09170020022', role: 'setup_crew', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 2, rating: 3, totalEventsWorked: 31 },
  { employeeId: 'BS-DEMO-0023', firstName: 'Luis', lastName: 'Martinez', email: 'luis.martinez.banquet@juancarlos.com', phone: '09170020023', role: 'head_captain', employmentType: 'full_time', ratePerDay: 1580, ratePerHour: 210, yearsOfExperience: 6, rating: 4, totalEventsWorked: 137 },
  { employeeId: 'BS-DEMO-0024', firstName: 'Enzo', lastName: 'Rivera', email: 'enzo.rivera.banquet@juancarlos.com', phone: '09170020024', role: 'waiter', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 4, rating: 4, totalEventsWorked: 88 },
  { employeeId: 'BS-DEMO-0025', firstName: 'Bryan', lastName: 'Delos Reyes', email: 'bryan.delosreyes.banquet@juancarlos.com', phone: '09170020025', role: 'waiter', employmentType: 'part_time', ratePerDay: 930, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 60 },
  { employeeId: 'BS-DEMO-0026', firstName: 'Vince', lastName: 'Padilla', email: 'vince.padilla.banquet@juancarlos.com', phone: '09170020026', role: 'waiter', employmentType: 'contractual', ratePerDay: 920, ratePerHour: 120, yearsOfExperience: 3, rating: 3, totalEventsWorked: 47 },
  { employeeId: 'BS-DEMO-0027', firstName: 'Neil', lastName: 'Gonzales', email: 'neil.gonzales.banquet@juancarlos.com', phone: '09170020027', role: 'waiter', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 2, rating: 3, totalEventsWorked: 32 },
  { employeeId: 'BS-DEMO-0028', firstName: 'Cj', lastName: 'Velasco', email: 'cj.velasco.banquet@juancarlos.com', phone: '09170020028', role: 'waiter', employmentType: 'part_time', ratePerDay: 925, ratePerHour: 121, yearsOfExperience: 2, rating: 4, totalEventsWorked: 39 },
  { employeeId: 'BS-DEMO-0029', firstName: 'Kris', lastName: 'Bernardo', email: 'kris.bernardo.banquet@juancarlos.com', phone: '09170020029', role: 'waitress', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 5, rating: 5, totalEventsWorked: 124 },
  { employeeId: 'BS-DEMO-0030', firstName: 'Jessa', lastName: 'Gutierrez', email: 'jessa.gutierrez.banquet@juancarlos.com', phone: '09170020030', role: 'waitress', employmentType: 'part_time', ratePerDay: 930, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 69 },
  { employeeId: 'BS-DEMO-0031', firstName: 'Ica', lastName: 'Salazar', email: 'ica.salazar.banquet@juancarlos.com', phone: '09170020031', role: 'waitress', employmentType: 'contractual', ratePerDay: 915, ratePerHour: 120, yearsOfExperience: 2, rating: 3, totalEventsWorked: 42 },
  { employeeId: 'BS-DEMO-0032', firstName: 'Dana', lastName: 'Magsino', email: 'dana.magsino.banquet@juancarlos.com', phone: '09170020032', role: 'waitress', employmentType: 'on_call', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 2, rating: 3, totalEventsWorked: 28 },
  { employeeId: 'BS-DEMO-0033', firstName: 'Anne', lastName: 'Rosales', email: 'anne.rosales.banquet@juancarlos.com', phone: '09170020033', role: 'waitress', employmentType: 'part_time', ratePerDay: 925, ratePerHour: 121, yearsOfExperience: 3, rating: 4, totalEventsWorked: 51 },
  { employeeId: 'BS-DEMO-0034', firstName: 'Harold', lastName: 'Soriano', email: 'harold.soriano.banquet@juancarlos.com', phone: '09170020034', role: 'food_runner', employmentType: 'full_time', ratePerDay: 970, ratePerHour: 129, yearsOfExperience: 4, rating: 4, totalEventsWorked: 84 },
  { employeeId: 'BS-DEMO-0035', firstName: 'Nate', lastName: 'Ocampo', email: 'nate.ocampo.banquet@juancarlos.com', phone: '09170020035', role: 'food_runner', employmentType: 'part_time', ratePerDay: 930, ratePerHour: 122, yearsOfExperience: 3, rating: 4, totalEventsWorked: 63 },
  { employeeId: 'BS-DEMO-0036', firstName: 'Jerome', lastName: 'Pineda', email: 'jerome.pineda.banquet@juancarlos.com', phone: '09170020036', role: 'food_runner', employmentType: 'contractual', ratePerDay: 910, ratePerHour: 120, yearsOfExperience: 2, rating: 3, totalEventsWorked: 40 },
  { employeeId: 'BS-DEMO-0037', firstName: 'Earl', lastName: 'Mercado', email: 'earl.mercado.banquet@juancarlos.com', phone: '09170020037', role: 'busser', employmentType: 'full_time', ratePerDay: 900, ratePerHour: 118, yearsOfExperience: 4, rating: 4, totalEventsWorked: 86 },
  { employeeId: 'BS-DEMO-0038', firstName: 'Noel', lastName: 'Espino', email: 'noel.espino.banquet@juancarlos.com', phone: '09170020038', role: 'busser', employmentType: 'part_time', ratePerDay: 875, ratePerHour: 115, yearsOfExperience: 3, rating: 3, totalEventsWorked: 55 },
  { employeeId: 'BS-DEMO-0039', firstName: 'Pio', lastName: 'Abad', email: 'pio.abad.banquet@juancarlos.com', phone: '09170020039', role: 'busser', employmentType: 'contractual', ratePerDay: 865, ratePerHour: 113, yearsOfExperience: 2, rating: 3, totalEventsWorked: 36 },
  { employeeId: 'BS-DEMO-0040', firstName: 'Ari', lastName: 'Serrano', email: 'ari.serrano.banquet@juancarlos.com', phone: '09170020040', role: 'bartender', employmentType: 'full_time', ratePerDay: 1210, ratePerHour: 162, yearsOfExperience: 6, rating: 5, totalEventsWorked: 145 },
  { employeeId: 'BS-DEMO-0041', firstName: 'Migs', lastName: 'Alcantara', email: 'migs.alcantara.banquet@juancarlos.com', phone: '09170020041', role: 'bartender', employmentType: 'part_time', ratePerDay: 1130, ratePerHour: 151, yearsOfExperience: 4, rating: 4, totalEventsWorked: 78 },
  { employeeId: 'BS-DEMO-0042', firstName: 'Pau', lastName: 'Domingo', email: 'pau.domingo.banquet@juancarlos.com', phone: '09170020042', role: 'bartender', employmentType: 'contractual', ratePerDay: 1090, ratePerHour: 145, yearsOfExperience: 3, rating: 4, totalEventsWorked: 59 },
  { employeeId: 'BS-DEMO-0043', firstName: 'Rei', lastName: 'Cunanan', email: 'rei.cunanan.banquet@juancarlos.com', phone: '09170020043', role: 'setup_crew', employmentType: 'full_time', ratePerDay: 980, ratePerHour: 130, yearsOfExperience: 5, rating: 4, totalEventsWorked: 111 },
  { employeeId: 'BS-DEMO-0044', firstName: 'Jp', lastName: 'David', email: 'jp.david.banquet@juancarlos.com', phone: '09170020044', role: 'setup_crew', employmentType: 'part_time', ratePerDay: 935, ratePerHour: 123, yearsOfExperience: 3, rating: 4, totalEventsWorked: 65 },
  { employeeId: 'BS-DEMO-0045', firstName: 'Owen', lastName: 'Nolasco', email: 'owen.nolasco.banquet@juancarlos.com', phone: '09170020045', role: 'setup_crew', employmentType: 'contractual', ratePerDay: 920, ratePerHour: 120, yearsOfExperience: 3, rating: 3, totalEventsWorked: 49 },
  { employeeId: 'BS-DEMO-0046', firstName: 'Renz', lastName: 'Sison', email: 'renz.sison.banquet@juancarlos.com', phone: '09170020046', role: 'setup_crew', employmentType: 'on_call', ratePerDay: 905, ratePerHour: 118, yearsOfExperience: 2, rating: 3, totalEventsWorked: 34 },
  { employeeId: 'BS-DEMO-0047', firstName: 'Mia', lastName: 'Esguerra', email: 'mia.esguerra.banquet@juancarlos.com', phone: '09170020047', role: 'waitress', employmentType: 'full_time', ratePerDay: 975, ratePerHour: 129, yearsOfExperience: 4, rating: 4, totalEventsWorked: 97 },
  { employeeId: 'BS-DEMO-0048', firstName: 'Tristan', lastName: 'Lozano', email: 'tristan.lozano.banquet@juancarlos.com', phone: '09170020048', role: 'waiter', employmentType: 'full_time', ratePerDay: 975, ratePerHour: 129, yearsOfExperience: 4, rating: 4, totalEventsWorked: 91 },
  { employeeId: 'BS-DEMO-0049', firstName: 'Kyla', lastName: 'Manansala', email: 'kyla.manansala.banquet@juancarlos.com', phone: '09170020049', role: 'food_runner', employmentType: 'part_time', ratePerDay: 925, ratePerHour: 121, yearsOfExperience: 3, rating: 4, totalEventsWorked: 57 },
  { employeeId: 'BS-DEMO-0050', firstName: 'Gabe', lastName: 'Samonte', email: 'gabe.samonte.banquet@juancarlos.com', phone: '09170020050', role: 'busser', employmentType: 'on_call', ratePerDay: 860, ratePerHour: 112, yearsOfExperience: 2, rating: 3, totalEventsWorked: 31 },
];

const ensureUser = async (payload) => {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });

  if (existing) {
    return { doc: existing, created: false };
  }

  const user = new User(payload);
  await user.save();
  return { doc: user, created: true };
};

const upsertBanquetStaff = async (payload, createdBy) => {
  let staff = await BanquetStaff.findOne({ employeeId: payload.employeeId });
  const created = !staff;

  if (!staff) {
    staff = new BanquetStaff({
      ...payload,
      createdBy,
    });
  } else {
    Object.assign(staff, payload, { updatedBy: createdBy });
  }

  await staff.save();
  return { doc: staff, created };
};

async function seedBanquetStaff() {
  console.log('Connecting to MongoDB...');
  console.log(`URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminUser = await User.findOne({ role: 'admin' });

  console.log('\nEnsuring banquet supervisor accounts...');
  for (const supervisor of supervisorUsers) {
    const result = await ensureUser(supervisor);
    console.log(`  ${result.created ? 'created' : 'kept'} user ${supervisor.email}`);
  }

  console.log('\nSeeding banquet staff roster...');
  let createdCount = 0;
  let updatedCount = 0;

  for (const staffMember of banquetRoster) {
    const result = await upsertBanquetStaff({
      ...staffMember,
      status: 'active',
      notes: `${DEMO_TAG} Demo banquet staff for staffing assignment tests.`,
    }, adminUser?._id || null);

    if (result.created) {
      createdCount += 1;
    } else {
      updatedCount += 1;
    }

    console.log(`  ${result.created ? 'created' : 'updated'} ${staffMember.employeeId} | ${staffMember.firstName} ${staffMember.lastName} | ${staffMember.role}`);
  }

  const byRole = await BanquetStaff.aggregate([
    { $match: { employeeId: { $regex: '^BS-DEMO-' } } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log('\nBanquet demo roster ready.');
  console.log(`  Created: ${createdCount}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log('  Role coverage:');
  byRole.forEach((entry) => {
    console.log(`    ${entry._id}: ${entry.count}`);
  });
}

seedBanquetStaff()
  .catch((error) => {
    console.error('\nFailed to seed banquet staff:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (error) {
      console.error('Failed to disconnect from MongoDB:', error.message);
    }
  });
