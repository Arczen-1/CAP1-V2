const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Staff-side venue directory used while preparing contracts.
// Replace previewImages with actual Juan Carlo venue reference photos when available.
const VENUES = {
  'OLD GROVE': {
    address: 'Purok 5, U. Mojares Street Barangay Lodlod, Lipa City, 4217 Batangas',
    halls: { 'The Barn': 300 },
    description: 'Rustic garden venue reference for barn-style and outdoor events.',
    previewImages: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80'
    ]
  },
  'FERNWOOD GARDENS': {
    address: 'Neogan, Tagaytay City',
    halls: { 'Indoor Function Hall': 200, 'Mozart Hall': 150, 'Schubert Hall': 150, 'Vivaldi Hall': 150 },
    description: 'Garden venue reference for indoor and outdoor styled events.',
    previewImages: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80'
    ]
  },
  'WORLD TRADE CENTER': {
    address: 'Mezzanine Level WTCMM Building, Sen. Gil J. Puyat Ave. cor. Diosdado Macapagal Blvd., Pasay City 1300',
    halls: { 'Hall A': 1000, 'Hall B': 1000, 'Hall C': 700 },
    description: 'Large convention hall reference for expo-scale banquet setups.',
    previewImages: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80'
    ]
  },
  'SMX MANILA': {
    address: 'Seashell Lane, Mall of Asia Complex, Pasay City 1300',
    halls: { 'Hall 1': 1500, 'Hall 2': 1000, 'Hall 3': 1000, 'Hall 4': 1500, 'Function Room 1': 500, 'Function Room 2': 500 },
    description: 'Convention center reference for large-scale catered events.',
    previewImages: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80'
    ]
  },
  'BLUE LEAF PAVILION': {
    address: '100 Park Avenue, McKinley Hill Village, Fort Bonifacio, Taguig',
    halls: { 'Banyan': 400, 'Silk': 300, 'Jade': 200 },
    description: 'Modern pavilion reference for formal indoor event styling.',
    previewImages: [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80'
    ]
  },
  'OTHERS': {
    address: '',
    halls: {},
    description: 'Manual venue entry. Add the exact address and capacity from the client or venue coordinator.',
    previewImages: []
  }
};

router.get('/', auth, (req, res) => {
  res.json(VENUES);
});

module.exports = router;
