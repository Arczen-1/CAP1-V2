#!/usr/bin/env node

// Populates the fleet with passenger vehicles (cars/vans/buses) used for staff
// transportation. Staff-transport booking only offers vehicles flagged
// passengerVehicle: true, so without these the picker/auto-assign has nothing to
// choose. Idempotent: matches on plateNumber and updates instead of duplicating.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Truck } = require('./models/Logistics');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

const passengerVehicles = [
  { plateNumber: 'JCV-1001', truckType: 'passenger_van', brand: 'Toyota', model: 'Hiace Commuter', passengerVehicle: true, passengerCapacity: 15, ownership: 'owned', status: 'available' },
  { plateNumber: 'JCV-1002', truckType: 'passenger_van', brand: 'Nissan', model: 'Urvan', passengerVehicle: true, passengerCapacity: 15, ownership: 'owned', status: 'available' },
  { plateNumber: 'JCV-1003', truckType: 'coaster', brand: 'Toyota', model: 'Coaster', passengerVehicle: true, passengerCapacity: 28, ownership: 'owned', status: 'available' },
  { plateNumber: 'JCV-1004', truckType: 'shuttle_bus', brand: 'Hyundai', model: 'County', passengerVehicle: true, passengerCapacity: 40, ownership: 'rented', status: 'available' },
  { plateNumber: 'JCV-1005', truckType: 'suv', brand: 'Toyota', model: 'Fortuner', passengerVehicle: true, passengerCapacity: 6, ownership: 'owned', status: 'available' },
  { plateNumber: 'JCV-1006', truckType: 'suv', brand: 'Mitsubishi', model: 'Montero Sport', passengerVehicle: true, passengerCapacity: 6, ownership: 'owned', status: 'available' },
];

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    let created = 0;
    let updated = 0;

    for (const vehicle of passengerVehicles) {
      const existing = await Truck.findOne({ plateNumber: vehicle.plateNumber });

      if (existing) {
        Object.assign(existing, vehicle);
        await existing.save();
        updated += 1;
      } else {
        await Truck.create(vehicle);
        created += 1;
      }
    }

    console.log(`Passenger vehicle seed complete. Created: ${created}. Updated: ${updated}.`);
  } catch (error) {
    console.error('Passenger vehicle seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
