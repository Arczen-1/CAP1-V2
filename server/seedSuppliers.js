#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Supplier = require('./models/Supplier');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

const starterSuppliers = [
  {
    name: 'Batangas Event Rentals Hub',
    contactPerson: 'Marco Reyes',
    phone: '0917-500-1122',
    email: 'rentals@batangasevents.test',
    address: 'P. Burgos Street',
    city: 'Batangas City',
    province: 'Batangas',
    serviceAreas: ['Batangas City', 'Lipa City', 'Tanauan City', 'Santo Tomas'],
    departments: ['stockroom'],
    requestTypes: ['rental'],
    supportedCategories: ['tables', 'chairs', 'utensils', 'glassware', 'plates'],
    supportedKeywords: ['table', 'chair', 'utensil', 'fork', 'spoon', 'glass', 'plate'],
    isPreferred: true,
    priority: 90,
    notes: 'Starter rental supplier for stockroom event equipment.'
  },
  {
    name: 'Southern Tableware Supply',
    contactPerson: 'Aira Mendoza',
    phone: '0917-500-2233',
    email: 'sales@southerntableware.test',
    address: 'Diversion Road',
    city: 'Lipa City',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Cavite', 'Laguna'],
    departments: ['stockroom'],
    requestTypes: ['purchase'],
    supportedCategories: ['utensils', 'glassware', 'plates', 'cutlery'],
    supportedKeywords: ['utensil', 'glass', 'plate', 'cutlery', 'fork', 'knife', 'spoon'],
    isPreferred: true,
    priority: 85,
    notes: 'Starter purchase supplier for dining equipment and service ware.'
  },
  {
    name: 'Juan Textile And Linen Works',
    contactPerson: 'Leah Villanueva',
    phone: '0917-500-3344',
    email: 'orders@juanlinen.test',
    address: 'National Highway',
    city: 'Santo Tomas',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Quezon', 'Laguna'],
    departments: ['linen'],
    requestTypes: ['purchase', 'rental'],
    supportedCategories: ['tablecloth', 'napkin', 'chair cover', 'linen'],
    supportedKeywords: ['tablecloth', 'napkin', 'runner', 'linen', 'cover'],
    isPreferred: true,
    priority: 88,
    notes: 'Starter supplier for linen replenishment and event rentals.'
  },
  {
    name: 'Batangas Decor And Backdrop Studio',
    contactPerson: 'Nina Santos',
    phone: '0917-500-4455',
    email: 'hello@batangasdecor.test',
    address: 'Kumintang Ilaya',
    city: 'Batangas City',
    province: 'Batangas',
    serviceAreas: ['Batangas City', 'Lipa City', 'Bauan'],
    departments: ['creative'],
    requestTypes: ['purchase', 'rental'],
    supportedCategories: ['backdrop', 'lights', 'decor', 'props', 'floral'],
    supportedKeywords: ['backdrop', 'light', 'decor', 'entrance', 'floral', 'prop'],
    isPreferred: true,
    priority: 92,
    notes: 'Starter supplier for creative staging and decor.'
  },
  {
    name: 'South Luzon Furniture Rentals',
    contactPerson: 'Jonas Cruz',
    phone: '0917-500-5566',
    email: 'ops@southluzonfurniture.test',
    address: 'A. Mabini Avenue',
    city: 'Tanauan City',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Laguna', 'Cavite'],
    departments: ['stockroom', 'creative'],
    requestTypes: ['rental'],
    supportedCategories: ['tables', 'chairs', 'furniture', 'display'],
    supportedKeywords: ['table', 'chair', 'cocktail', 'display', 'furniture'],
    isPreferred: false,
    priority: 70,
    notes: 'Overflow rental option for furniture-heavy events.'
  },
  {
    name: 'Premier Event Fabrication',
    contactPerson: 'Celine Ramos',
    phone: '0917-500-6677',
    email: 'fabrication@premierevent.test',
    address: 'JP Laurel Highway',
    city: 'Lipa City',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Metro Manila'],
    departments: ['creative', 'stockroom'],
    requestTypes: ['purchase'],
    supportedCategories: ['stage', 'structures', 'props', 'equipment'],
    supportedKeywords: ['stage', 'frame', 'entrance', 'structure', 'prop', 'equipment'],
    isPreferred: false,
    priority: 65,
    notes: 'Starter fabrication partner for custom builds and replacement hardware.'
  }
];

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    let created = 0;
    let updated = 0;

    for (const supplier of starterSuppliers) {
      const existing = await Supplier.findOne({ name: supplier.name });

      if (existing) {
        Object.assign(existing, supplier);
        await existing.save();
        updated += 1;
      } else {
        await Supplier.create(supplier);
        created += 1;
      }
    }

    console.log(`Supplier seed complete. Created: ${created}. Updated: ${updated}.`);
  } catch (error) {
    console.error('Supplier seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
