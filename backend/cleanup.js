const mongoose = require("mongoose");
const Contract = require("./models/Contract");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/testdb")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

async function cleanupContracts() {
  try {
    // Get all contracts
    const contracts = await Contract.find({});
    console.log(`Found ${contracts.length} contracts to process`);

    // Frontend fields structure based on our schema
    const validFields = {
      page1: [
        'date', 'celebratorName', 'celebratorAddress', 'celebratorLandline',
        'celebratorMobile', 'celebratorEmail', 'representativeName',
        'representativeRelationship', 'representativeAddress', 'representativeEmail',
        'representativeMobile', 'representativeLandline', 'coordinatorName',
        'coordinatorMobile', 'coordinatorLandline',
        'coordinatorAddress', 'coordinatorEmail', 'eventDate',
        'occasion', 'venue', 'hall', 'ingressTime', 'cocktailTime',
        'address', 'arrivalOfGuests', 'servingTime', 'totalGuests',
        'totalVIP', 'totalRegular', 'kiddiePlated', 'kiddiePacked',
        'crewPlated', 'crewPacked', 'themeSetup', 'colorMotif',
        'vipTableType', 'regularTableType', 'vipUnderliner', 'vipTopper',
        'vipNapkin', 'guestUnderliner', 'guestTopper', 'guestNapkin',
        'setupRemarks', 'buffetStandard', 'buffetUpgraded', 'buffetPremium',
        'buffetBarrel', 'buffetOval', 'buffetRemarks'
      ],
      page2: [
        'chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic',
        'chairsKiddie', 'premiumChairs', 'chairsRemarks', 'flowerBackdrop',
        'flowerGuestCenterpiece', 'flowerVipCenterpiece', 'flowerCakeTable',
        'flowerRemarks', 'cakeNameCode', 'cakeFlavor', 'cakeSupplier',
        'cakeSpecifications', 'celebratorsCar', 'emcee', 'soundSystem',
        'tent', 'celebratorsChair', 'remarks', 'others', 'knowUsWebsite',
        'knowUsFacebook', 'knowUsInstagram', 'knowUsFlyers', 'knowUsBillboard',
        'knowUsWordOfMouth', 'knowUsVenueReferral', 'knowUsRepeatClient',
        'knowUsBridalFair', 'knowUsFoodTasting', 'knowUsCelebrityReferral',
        'knowUsOthers'
      ],
      page3: [
        'pricePerPlate', 'cocktailHour', 'appetizer', 'soup', 'bread',
        'salad', 'mainEntree', 'dessert', 'cakeName', 'kidsMeal',
        'crewMeal', 'drinksCocktail', 'drinksMeal', 'roastedPig',
        'roastedCalf', 'totalMenuCost', 'totalSpecialReqCost',
        'outOfServiceAreaCharge', 'mobilizationCharge', 'taxes',
        'grandTotal', 'fortyPercentDueOn', 'fortyPercentAmount', 
        'fortyPercentReceivedBy', 'fortyPercentDateReceived', 'fullPaymentDueOn', 
        'fullPaymentAmount','fullPaymentReceivedBy', 'fullPaymentDateReceived', 
        'remarks'
      ]
    };

    // Process each contract
    for (const contract of contracts) {
      let hasChanges = false;
      const cleanContract = {
        page1: {},
        page2: {},
        page3: {}
      };

      // Clean up each page
      ['page1', 'page2', 'page3'].forEach(page => {
        if (contract[page]) {
          // Only keep valid fields for each page
          validFields[page].forEach(field => {
            if (contract[page][field] !== undefined) {
              cleanContract[page][field] = contract[page][field];
            }
          });
          hasChanges = hasChanges || Object.keys(contract[page]).length !== Object.keys(cleanContract[page]).length;
        }
      });

      if (hasChanges) {
        console.log(`Cleaning up contract ${contract.contractNumber}...`);
        // Update the contract with clean data
        await Contract.updateOne(
          { _id: contract._id },
          { 
            $set: {
              page1: cleanContract.page1,
              page2: cleanContract.page2,
              page3: cleanContract.page3
            }
          }
        );
        console.log(`Contract ${contract.contractNumber} cleaned successfully`);
      }
    }

    console.log("Cleanup completed successfully");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the cleanup
cleanupContracts();