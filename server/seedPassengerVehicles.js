#!/usr/bin/env node

// Populates the fleet with passenger vehicles (vans/coasters/buses/SUVs) used for
// staff transportation. Staff-transport booking only offers vehicles flagged
// passengerVehicle: true, and auto-assign additionally skips any vehicle without
// an assignedDriver — so this seed also pairs a driver to every vehicle, keeping
// both sides of the link (truck.assignedDriver and driver.assignedTrucks) in sync.
//
// Idempotent: vehicles are matched on plateNumber (falling back to the legacy
// plate they were first seeded with), drivers on their stable driverId.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Truck, Driver } = require('./models/Logistics');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

// Philippine-style plates, deliberately varied in series and digit count rather
// than one running sequence. `legacyPlate` migrates the original JCV-100x batch
// onto a realistic plate without creating duplicates on re-run.
const passengerVehicles = [
  // --- originally seeded six, re-plated and enriched ---
  { legacyPlate: 'JCV-1001', plateNumber: 'NEA 4821', truckType: 'passenger_van', brand: 'Toyota', model: 'Hiace Commuter', year: 2019, color: 'White', passengerCapacity: 15, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-01' },
  { legacyPlate: 'JCV-1002', plateNumber: 'CAB 7719', truckType: 'passenger_van', brand: 'Nissan', model: 'NV350 Urvan', year: 2020, color: 'Silver', passengerCapacity: 15, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-02' },
  { legacyPlate: 'JCV-1003', plateNumber: 'TYH 9027', truckType: 'coaster', brand: 'Toyota', model: 'Coaster', year: 2018, color: 'White', passengerCapacity: 28, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-03' },
  { legacyPlate: 'JCV-1004', plateNumber: 'ZAR 1198', truckType: 'shuttle_bus', brand: 'Hyundai', model: 'County', year: 2017, color: 'Beige', passengerCapacity: 40, ownership: 'rented', status: 'available', driverKey: 'PAX-DRV-04' },
  { legacyPlate: 'JCV-1005', plateNumber: 'DAB 4407', truckType: 'suv', brand: 'Toyota', model: 'Fortuner', year: 2021, color: 'Black', passengerCapacity: 6, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-05' },
  { legacyPlate: 'JCV-1006', plateNumber: 'GHK 2286', truckType: 'suv', brand: 'Mitsubishi', model: 'Montero Sport', year: 2020, color: 'Graphite', passengerCapacity: 6, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-06' },

  // --- additional passenger fleet ---
  { plateNumber: 'NEP 5513', truckType: 'passenger_van', brand: 'Foton', model: 'View Traveller', year: 2019, color: 'White', passengerCapacity: 18, ownership: 'leased', status: 'available', driverKey: 'PAX-DRV-07' },
  { plateNumber: 'UVW 812', truckType: 'passenger_van', brand: 'Hyundai', model: 'Grand Starex', year: 2018, color: 'Pearl White', passengerCapacity: 11, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-08' },
  { plateNumber: 'MVP 6350', truckType: 'passenger_van', brand: 'Toyota', model: 'Hiace Super Grandia', year: 2022, color: 'Silver', passengerCapacity: 12, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-09' },
  { plateNumber: 'NCR 7788', truckType: 'passenger_van', brand: 'Maxus', model: 'V80', year: 2021, color: 'White', passengerCapacity: 13, ownership: 'rented', status: 'available', driverKey: 'PAX-DRV-10' },
  { plateNumber: 'PBQ 447', truckType: 'coaster', brand: 'Isuzu', model: 'Journey', year: 2016, color: 'White', passengerCapacity: 29, ownership: 'contracted', status: 'available', driverKey: 'PAX-DRV-11' },
  { plateNumber: 'RSJ 3074', truckType: 'coaster', brand: 'Hyundai', model: 'County Deluxe', year: 2019, color: 'Blue', passengerCapacity: 25, ownership: 'rented', status: 'available', driverKey: 'PAX-DRV-12' },
  { plateNumber: 'BTG 3321', truckType: 'coaster', brand: 'Toyota', model: 'Coaster Hi-Roof', year: 2022, color: 'White', passengerCapacity: 30, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-13' },
  { plateNumber: 'KLM 8842', truckType: 'shuttle_bus', brand: 'Daewoo', model: 'BS106', year: 2015, color: 'Yellow', passengerCapacity: 45, ownership: 'contracted', status: 'available', driverKey: 'PAX-DRV-14' },
  // One vehicle deliberately off the road: exercises the status filter and proves
  // unavailable vehicles are excluded from booking.
  { plateNumber: 'WXY 1503', truckType: 'shuttle_bus', brand: 'Isuzu', model: 'Erga Mio', year: 2016, color: 'Green', passengerCapacity: 32, ownership: 'rented', status: 'maintenance', driverKey: 'PAX-DRV-15' },
  { plateNumber: 'AAB 9911', truckType: 'suv', brand: 'Toyota', model: 'Innova', year: 2021, color: 'Grey', passengerCapacity: 7, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-16' },
  { plateNumber: 'TXP 2043', truckType: 'suv', brand: 'Mitsubishi', model: 'Xpander', year: 2022, color: 'Red', passengerCapacity: 7, ownership: 'owned', status: 'available', driverKey: 'PAX-DRV-17' },
  { plateNumber: 'JCB 5567', truckType: 'suv', brand: 'Ford', model: 'Everest', year: 2020, color: 'Blue', passengerCapacity: 6, ownership: 'leased', status: 'available', driverKey: 'PAX-DRV-18' }
];

// One dedicated driver per passenger vehicle, so auto-assign always has a
// driver-paired option. driverId is fixed to keep re-runs idempotent.
const passengerDrivers = [
  { driverId: 'PAX-DRV-01', firstName: 'Arnel', lastName: 'Bautista', phone: '0917-410-2288', licenseNumber: 'N01-18-004512' },
  { driverId: 'PAX-DRV-02', firstName: 'Rodel', lastName: 'Aguinaldo', phone: '0918-233-7741', licenseNumber: 'N02-19-118834' },
  { driverId: 'PAX-DRV-03', firstName: 'Ernesto', lastName: 'Villamor', phone: '0917-882-1190', licenseNumber: 'N03-17-220741' },
  { driverId: 'PAX-DRV-04', firstName: 'Danilo', lastName: 'Reyes', phone: '0920-551-3327', licenseNumber: 'N01-16-338920' },
  { driverId: 'PAX-DRV-05', firstName: 'Marlon', lastName: 'Espino', phone: '0906-774-8812', licenseNumber: 'N02-21-441037' },
  { driverId: 'PAX-DRV-06', firstName: 'Ronaldo', lastName: 'Gutierrez', phone: '0915-330-9945', licenseNumber: 'N01-20-556218' },
  { driverId: 'PAX-DRV-07', firstName: 'Felix', lastName: 'Manalo', phone: '0919-664-2031', licenseNumber: 'N03-19-667445' },
  { driverId: 'PAX-DRV-08', firstName: 'Joel', lastName: 'Panganiban', phone: '0927-118-7754', licenseNumber: 'N02-18-778116' },
  { driverId: 'PAX-DRV-09', firstName: 'Christopher', lastName: 'Dimaano', phone: '0916-902-4413', licenseNumber: 'N01-22-889302' },
  { driverId: 'PAX-DRV-10', firstName: 'Allan', lastName: 'Macatangay', phone: '0908-447-6620', licenseNumber: 'N03-21-990558' },
  { driverId: 'PAX-DRV-11', firstName: 'Nestor', lastName: 'Cabrera', phone: '0921-773-1108', licenseNumber: 'N02-16-101274' },
  { driverId: 'PAX-DRV-12', firstName: 'Wilfredo', lastName: 'Atienza', phone: '0917-559-3364', licenseNumber: 'N01-19-212386' },
  { driverId: 'PAX-DRV-13', firstName: 'Rey', lastName: 'Malabanan', phone: '0929-806-2247', licenseNumber: 'N03-22-323497' },
  { driverId: 'PAX-DRV-14', firstName: 'Gerardo', lastName: 'Ilagan', phone: '0918-341-9075', licenseNumber: 'N02-15-434508' },
  { driverId: 'PAX-DRV-15', firstName: 'Bernard', lastName: 'Katigbak', phone: '0905-627-4419', licenseNumber: 'N01-16-545619' },
  { driverId: 'PAX-DRV-16', firstName: 'Jomar', lastName: 'Landicho', phone: '0926-880-5532', licenseNumber: 'N03-21-656720' },
  { driverId: 'PAX-DRV-17', firstName: 'Edgardo', lastName: 'Mercado', phone: '0912-205-8843', licenseNumber: 'N02-22-767831' },
  { driverId: 'PAX-DRV-18', firstName: 'Ariel', lastName: 'Bello', phone: '0933-716-3390', licenseNumber: 'N01-20-878942' }
];

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    // --- drivers -----------------------------------------------------------
    const driverByKey = new Map();
    let driversCreated = 0;
    let driversUpdated = 0;

    for (const spec of passengerDrivers) {
      let driver = await Driver.findOne({ driverId: spec.driverId });

      if (driver) {
        Object.assign(driver, spec);
        driver.fullName = `${spec.firstName} ${spec.lastName}`;
        await driver.save();
        driversUpdated += 1;
      } else {
        driver = await Driver.create({
          ...spec,
          fullName: `${spec.firstName} ${spec.lastName}`,
          licenseType: 'professional',
          employmentType: 'full_time',
          status: 'active'
        });
        driversCreated += 1;
      }

      driverByKey.set(spec.driverId, driver);
    }

    // --- vehicles ----------------------------------------------------------
    let created = 0;
    let updated = 0;
    let paired = 0;

    for (const vehicle of passengerVehicles) {
      const { legacyPlate, driverKey, ...fields } = vehicle;
      const driver = driverByKey.get(driverKey);

      // Match on the current plate first, then the legacy plate it may still have.
      let truck = await Truck.findOne({ plateNumber: fields.plateNumber });
      if (!truck && legacyPlate) {
        truck = await Truck.findOne({ plateNumber: legacyPlate });
      }

      if (truck) {
        Object.assign(truck, fields, { passengerVehicle: true });
        if (driver) {
          truck.assignedDriver = driver._id;
        }
        await truck.save();
        updated += 1;
      } else {
        truck = await Truck.create({
          ...fields,
          passengerVehicle: true,
          assignedDriver: driver ? driver._id : undefined
        });
        created += 1;
      }

      // Keep the reverse link in sync so the driver lists this vehicle too.
      if (driver) {
        await Driver.updateOne(
          { _id: driver._id },
          { $addToSet: { assignedTrucks: truck._id } }
        );
        paired += 1;
      }
    }

    const totalPassenger = await Truck.countDocuments({ passengerVehicle: true });
    const withDriver = await Truck.countDocuments({ passengerVehicle: true, assignedDriver: { $ne: null } });

    console.log(`Drivers  - created: ${driversCreated}, updated: ${driversUpdated}`);
    console.log(`Vehicles - created: ${created}, updated: ${updated}, driver-paired: ${paired}`);
    console.log(`Passenger fleet now: ${totalPassenger} vehicles, ${withDriver} with a driver assigned.`);
  } catch (error) {
    console.error('Passenger vehicle seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
