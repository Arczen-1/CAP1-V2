import React, { useEffect, useState, useMemo } from "react";
import "./ContractForm.css";

// Menu options for buffet
const SOUP_OPTIONS = [
  "Sopa De Congrejo (Crab Meat, Celery, and Carrots)",
  "Creamy Pumpkin Soup with Truffle Oil",
  "Chicken Potato Chowder Soup",
  "Cream of Fresh Asparagus Soup",
  "Clam Chowder Soup",
  "Sausage and Scallop Chowder Soup",
  "Hot and Sour Soup"
];

const UPGRADE_SOUP_OPTIONS = [
  "Broccoli Soup",
  "Bouillabaisse Soup",
  "Autumn Pick Forest Mushroom",
  "Zuppa Di Carrote",
  "Andalusian Tomato Soup"
];

const MAIN_BEEF_OPTIONS = [
  "Pot Roast Beef",
  "Callos Ala Madrileña",
  "Kare-kare with Alamang",
  "Beef Tenderloin Tips with Mongo Sprouts in Teriyaki Sauce",
  "Beef Salpicao",
  "Beef Straganoff",
  "Beef Bokchoy",
  "Beef Broccoli in Oyster Sauce"
];

const BEEF_UPGRADE_100_OPTIONS = [
  "Beef Calderetang Batangas"
];

const BEEF_UPGRADE_125_OPTIONS = [
  "Beef Brassatto with Buttered Mushroom"
];

const BEEF_UPGRADE_500_OPTIONS = [
  "Carving Station: Six-hour Slow Cooked Beef Brisket with Tricolore Pepper Cream Sauce"
];

const BEEF_UPGRADE_1100_OPTIONS = [
  "Carving Station: US Certified Prime Angus Rib Eye with Tricolore Pepper Cream Sauce",
  "Carving Station: Oven Roasted US Certified Prime Angus Rib Eye with Chimichurri Sauce"
];

const MAIN_PORK_OPTIONS = [
  "Baked Pork Galantine with Raisins",
  "Roast Pork with Prunes and Walnuts",
  "Puerto Conpellejo",
  "Pork Polpetta with Quail Egg in Chili and Sour Sauce",
  "Pork Humba with Banana",
  "Pork Calderetang Batangas",
  "Tuscan Smothered Pork Chop",
  "Korean Pork Spareribs",
  "Pork Tenderloin Geneva Style",
];

const PORK_UPGRADE_200_OPTIONS = [
  "Baby Back Ribs with Smoked Hickory Sauce"
];

const PORK_UPGRADE_250_OPTIONS = [
  "Cinnamon Honey Glazed Pork Paupiette Wrapped in Bacon Stuffed with Garlic River Spinach"
];

const PORK_UPGRADE_275_OPTIONS = [
  "Oven Roasted Pig with Liver Sauce"
];

const PORK_UPGRADE_15000_OPTIONS = [
  "Hirshon Balinese Suckling Pig with Seafood Paella"
];

const MAIN_FISH_OPTIONS = [
  "Fish Fillet with Creamy Dill Sauce",
  "Pescado Con Queso",
  "Pangasius Fish Fillet with Sweet and Sour Sauce",
  "Fish Fillet with Homemade Tartar Sauce",
  "Cobbler Steak in Tequila Cream Sauce",
  "Cobbler Steak with Pesto Sauce",
  "Pan-grilled Tanigue with Ala Pobre Sauce",
  "Golden Fry Fish Finger with Mango Cilantro Sauce",
  "Parmesan Crusted Fish Fillet with Homemade Tartar Sauce",
  "Steamed Cobbler Fillet in Mandarin Sauce",
  "Lemon Grass Soy Steamed Basa Fish with Salsa Fresco",
  "Fish Steak with Tomato and Vegetable Salsa",
  "Golden Fry Pangasius in Desiccated Coconut with Mango Cilantro Dressing Sauce",
];

const MAIN_SEAFOOD_OPTIONS = [
  "Octopus Adobo in Coconut Cream",
  "Baked Mussels with Garlic-Parmesan Crust",
  "Sweet Chili Glazed Squid",
  "Calamari Rings in Garlic Butter"
];

const FISH_UPGRADE_200_OPTIONS = [
  "Pacific Ocean Blue Marlin in Lemon Butter Sauce"
];

const FISH_UPGRADE_225_OPTIONS = [
  "Norwegian Pink Salmon in Tequila Cream Sauce",
  "Ocean Pan-grilled Blue Marlin A la Meuniére with Capers and Italian Parsley"
];

const SEAFOOD_UPGRADE_200_OPTIONS = [
  "Grilled Butterfly Prawns in Lemon Butter Sauce"
];

const SEAFOOD_UPGRADE_235_OPTIONS = [
  "Shrimp Tempura with Hon Mirin Sauce"
];

const SEAFOOD_UPGRADE_335_OPTIONS = [
  "Spicy Grilled Prawn with Lemon Grass and Paprika"
];

const MAIN_CHICKEN_OPTIONS = [
  "Chicken Breast Fillet with Piri-piri Sauce",
  "Chicken Cakes with Teriyaki Sauce",
  "Chicken Cordon Bleu",
  "Chicken Galantine with Brown Sauce",
  "Broiled Mustard Chicken",
  "Chicken Al’Orange",
  "Ilonggo Chicken Inasal with Lime, Pepper, Vinegar and Annatto",
  "Garlic Broiled Chicken",
  "Grilled Harissa Chicken",
  "Oven Roasted Peruvian Chicken with Aji Verde Sauce",
  "German Style Roast Chicken",
  "Chicken Kebab with Garlic Yoghurt Sauce"
];

const CHICKEN_UPGRADE_95_OPTIONS = [
  "Chicken Hongkong Style"
];

const CHICKEN_UPGRADE_100_OPTIONS = [
  "Black Summer Truffled Parmesan Roasted Chicken",
  "Portugese Roasted Peri-peri Chicken",
  "Honey Garlic Chicken with Chimichurri Sauce"
];

const CHICKEN_UPGRADE_110_OPTIONS = [
  "Chicken Peking Duck Style with Hoisin Sauce"
];

const MAIN_PASTA_OPTIONS = [
  "Black Pasta Aglio E Olio",
  "Pasta Fusilli Aglio E Olio",
  "Pasta Batangueño with Liver Sauce",
  "Penne Pasta Siracusana",
  "Puttanesca with Black Olive, Capers and Bacon",
  "Penne Pasta with Wild Mushroom Sauce",
  "Fusilli Pesto with Almond Chips",
  "Pasta Vongole",
  "Pasta Alfredo",
  "Fresh Tomato Pasta",
  "Tuna Pasta",
  "Pasta Fettucine Pomodoro with Ham, Bacon and Mushroom",
  "Filipino Style Spaghetti",
  "Italian Style Spaghetti",
  "Pasta Fettuccine with Wild Mushroom Sauce",
  "Juan Carlo Wellness Pasta",
  "Pasta Marinara",
  "Pasta Carbonara",
  "Pasta Anchovy with Longganisa Royale"
];

const PASTA_UPGRADE_150_OPTIONS = [
  "Black Pasta Gamberini in Pesto Sauce with Chili Flakes, Pine Nuts and Basil"
];

const MAIN_NOODLES_OPTIONS = [
  "Chinese Birthday Noodles",
  "Juan Carlo Vermicelli Special",
  "Chinese Pancit Canton",
  "Pancit Bihon",
  "Lomi",
  "Pancit Palabok"
];

const MAIN_VEG_OPTIONS = [
  "Assorted Vegetables Laced with Butter",
  "Veggie Money Bag with Leeks",
  "Filipino Vegetable Spring Rolls",
  "Pinakbet",
  "Chinese Vegetable Supreme",
  "Mongolian Vegetables",
  "Marble Potato with Cilantro",
  "Lyonnaise Potato",
  "Mashed Potato with Gravy and Bacon Bits",
  "Country Style Potato with Bacon Cheese Dressing",
  "Bouquet of Green Vegetable with Bechamel Sauce",
  "Stir-fried Mixed Vegetables in Oyster Sauce"
];

const VEG_UPGRADE_50_OPTIONS = [
  "Deep-fried Eggplant with Shrimp, Waterchestnuts and Bamboo Shoots"
];

const VEG_UPGRADE_60_OPTIONS = [
  "Fresh Lumpiang Ubod with Brown Sauce"
];

const VEG_UPGRADE_75_OPTIONS = [
  "Grilled Cauliflower, Broccoli, and Carrots with Thyme"
];

const VEG_UPGRADE_650_OPTIONS = [
  "Mongolian BBQ Station"
];

const RICE_OPTIONS = [
  "Steamed Fragrant Rice"
];

const RICE_UPGRADE_50_OPTIONS = [
  "Moroccan Rice"
];

const RICE_UPGRADE_95_OPTIONS = [
  "Paella de Madrid",
  "Seafood Paella"
];

const RICE_UPGRADE_110_OPTIONS = [
  "Jambalayan Rice",
  "Yakimeshi Fried Rice"
];

const DESSERT_OPTIONS = [
  "Mango Surprise",
  "S'mores Shooters",
  "Caramel Apple Trifles",
  "Tapioca Balls Guinumis",
  "Cream Puff",
  "Swan Puff",
  "Eclair",
  "Canonigo with Mango Balls",
  "Blitz Torte with Cashew Nuts",
  "Oreo Ecstasy",
  "Strawberry Cheesecake",
  "Blueberry Cheesecake",
  "Mango Cheesecake",
  "Buco Corn Jello",
  "Buco Lychee Jello",
  "Monkey Java Fritters",
  "Tiramisu",
  "Caramel Custard with Cherry and Macapuno Strings",
  "Buco Fruit Salad without Buco Shell in Barquillos",
  "Assorted Fresh Fruits in Season",
  "Sansrival with Pistachio Nuts",
  "Tropical Fruit Pavlova",
  "Peach Mango Supreme",
  "Cracquelin Choux",
  "Red Velvet Lychee Shooters",
  "Piña Collada",
  "Ube Macapuno Shooter",
  "Banoffee Pie",
  "Strawberry Cheesecake Shooter",
  "Coffee Magnifico",
  "Juan Carlo Panna Cotta with Fruit Salsa",
  "Parisian Fruit Tartlets"
];

const DESSERT_UPGRADE_250_OPTIONS = [
  "Galaxies Delight", 
  "Tropical Rendezvous", 
  "British Toffee Surprise", 
  "Duo Classico Americano", 
  "Duo of Sesame Panna Cotta"
];

const DESSERT_UPGRADE_300_OPTIONS = [
  "Tang Dynasty Matcha Cake with Chocolate Mousse, Green Tea  Ganache, Raspberry and Blueberry",
  "Yangtze River of Sweets"
];

const DESSERT_UPGRADE_350_OPTIONS = [
  "Eruption",
  "Aloha",
  "La Saveur", 
  "Trilogy of Love",
  "Fresh Fruit Ensemble"
];

const DESSERT_UPGRADE_400_OPTIONS = [
  "Indulgence Au Chocolat"
];

const DESSERT_UPGRADE_450_OPTIONS = [
  "Imagination’s Delight "
];

const DRINKS_OPTIONS = [
  "Green Cucumber Lemonade",
  "Pink Lychee Lemonade",
  "Blue Lemonade",
  "House Blend Iced Tea",
  "Pandan Coolers",
  "Passion Fruit Drink with Bursting Boba"
];

const DRINK_UPGRADE_130_OPTIONS = [
  "Fresh Peach Lemonade",
  "Pineapple Ginger Sparkler",
  "Berry Blast Mocktail"
];

const DRINK_UPGRADE_150_OPTIONS = [
  "Fresto Citron",
  "Wild Forest Berries",
  "Jamaican Guzzle",
  "Lover's Couple Sparking Cider",
  "Tropical Paradise Punch",
  "Minty Mojito Cooler"
];


const FOOD_STATIONS = [
  { name: "European Cheese & Charcuterie Grazing Table", cost: 250 },
  { name: "Mexican Station", cost: 250 },
  { name: "Sushi-Sashimi Platter", cost: 300 },
  { name: "Kebab Station", cost: 325 },
  { name: "European Sausage Station", cost: 350 },
  { name: "Cheese Raclette Station", cost: 350 },
  { name: "Dimsum Platter", cost: 350 },
  { name: "Seafood on Ice", cost: 395 },
  { name: "Spanish Cold Cuts & Cheese Platter", cost: 450 },
  { name: "Sea Shell Station", cost: 600 },
  { name: "Oyster Bar", cost: 750 }
];

const OYSTER_BAR_OPTIONS = [
  "Kumamoto Oyster Rockefeller",
  "Fresh Pacific Oyster with Tabasco Sauce",
  "Oyster Mignonette with Peach, Ginger & Mint",
  "Truffled Mushroom Oyster",
  "Creamy Sisig Oyster",
  "Oyster Kilpatrick",
  "Oyster Motoyaki"
];

const APPETIZER_UPGRADE_125_OPTIONS = [
  "Baked Hokkaido Scallop with Pastis Prado Wine in Paprika Cream Sauce",
  "Escargot A ‘La Bourguignonne"
];

const APPETIZER_UPGRADE_150_OPTIONS = [
  "Juan Carlo Signature Rosé"
];

const SALAD_UPGRADE_125_OPTIONS = [
  "Crunchy Apple Salad",
  "Waldorf Salad",
  "Russian Salad",
  "Garden Salad with Caesar Salad Dressing or Raspberry Vinaigrette"
];

const SALAD_UPGRADE_150_OPTIONS = [
  "Panzanella Salad",
  "European Salad",
  "Crab Tumbler with Mango Ginger Cilantro Dressing"
];

// Venue data
const VENUES = {
  "OLD GROVE": {
    address: "Purok 5, U. Mojares Street Barangay Lodlod, Lipa City, 4217 Batangas",
    halls: { "The Barn": 300 }
  },
  "FERNWOOD GARDENS": {
    address: "Neogan, Tagaytay City",
    halls: { "Indoor Function Hall": 200, "Mozart Hall": 150, "Schubert Hall": 150, "Vivaldi Hall": 150 }
  },
  "WORLD TRADE CENTER": {
    address: "Mezzanine Level WTCMM Building, Sen. Gil J. Puyat Ave. cor. Diosdado Macapagal Blvd., Pasay City 1300",
    halls: { "Hall A": 1000, "Hall B": 1000, "Hall C": 700 }
  },
  "SMX Manila Convention Center": {
    address: "Seashell Lane, Mall of Asia Complex, Pasay City 1300, Philippines",
    halls: { "Hall 1": 1500, "Hall 2": 1000, "Hall 3": 1000, "Hall 4": 1500, "Function Room 1": 500, "Function Room 2": 500, "Function Room 3": 500, "Function Room 4": 1000, "Function Room 5": 1000 }
  },
  "THE BLUE LEAF EVENTS PAVILION": {
    address: "100 Park Avenue, McKinley Hill Village, Fort Bonifacio, Taguig, Metro Manila",
    halls: { "Banyan": 400, "Silk": 300, "Jade": 200 }
  },
  "THE BLUE LEAF COSMOPOLITAN (QUEZON CITY)": {
    address: "Robinsons Bridgetown, 80 Eulogio Rodriguez Jr. Ave, Libis, Quezon City, Metro Manila",
    halls: { "Monet": 300, "Picasso": 250, "Matisse": 250 }
  },
  "GALLERY MIRANILA (QUEZON CITY)": {
    address: "26 Mariposa, Quezon City, NCR",
    halls: { "Gallery MiraNila Hall": 150 }
  },
  "CLEO BY THE BLUE LEAF (CARMONA, CAVITE)": {
    address: "Gate 5, Congressional Road, Carmona, Cavite",
    halls: { "Hall A": 400, "Hall B": 300 }
  },
  "OTHERS": {
    address: "",
    halls: {}
  }
};

// Multi-page contract form replicating the client's three contract pages.
// Saves to backend with monthly-reset contract numbering.
function ContractForm({ onCancel, onCreated, existing, user }) {
  const formatNumber = (num) => num ? parseFloat(num).toLocaleString('en-US') : '';
  const [activePage, setActivePage] = useState(1); // 1, 2, 3, 4
  const [nextNumber, setNextNumber] = useState("");
  const [availableHalls, setAvailableHalls] = useState([]);
  const [maxPax, setMaxPax] = useState(0);
  const [errors, setErrors] = useState({});

  // Page 1 fields
  const [p1, setP1] = useState({
    celebratorName: "",
    celebratorAddress: "",
    celebratorLandline: "",
    celebratorMobile: "",
    celebratorEmail: "",
    representativeName: "",
    representativeRelationship: "",
    representativeAddress: "",
    representativeEmail: "",
    representativeMobile: "",
    representativeLandline: "",
    coordinatorName: "",
    coordinatorMobile: "",
    coordinatorLandline: "",
    coordinatorAddress: "",
    coordinatorEmail: "",
    eventDate: "",
    occasion: "",
    serviceStyle: "",
    venue: "",
    hall: "",
    ingressTime: "",
    cocktailTime: "",
    address: "",
    arrivalOfGuests: "",
    servingTime: "",
    totalGuests: "",
    totalVIP: "",
    totalRegular: "",
    themeSetup: "",
    colorMotif: "",
    vipTableType: "",
    regularTableType: "",
    vipTableSeats: "",
    regularTableSeats: "",
    vipTableQuantity: "",
    regularTableQuantity: "",
    vipUnderliner: "",
    vipTopper: "",
    vipNapkin: "",
    guestUnderliner: "",
    guestTopper: "",
    guestNapkin: "",
    setupRemarks: "",
  });

  const totalPages = useMemo(() => p1.serviceStyle === "Buffet" ? 5 : 3, [p1.serviceStyle]);

  // Page 2 fields
  const [p2, setP2] = useState({
    chairsMonoblock: "0",
    chairsTiffany: "0",
    chairsCrystal: "0",
    chairsRustic: "0",
    premiumChairs: "0",
    totalChairs: "",
    chairsRemarks: "",
    flowerBackdrop: "",
    flowerGuestCenterpiece: "",
    flowerVipCenterpiece: "",
    flowerCakeTable: "",
    flowerRemarks: "",
    cakeNameCode: "",
    cakeFlavor: "",
    cakeSupplier: "",
    cakeSpecifications: "",
    celebratorsCar: "",
    emcee: "",
    soundSystem: "",
    tent: "",
    celebratorsChair: "",
    knowUsWebsite: false,
    knowUsFacebook: false,
    knowUsInstagram: false,
    knowUsFlyers: false,
    knowUsBillboard: false,
    knowUsWordOfMouth: false,
    knowUsVenueReferral: false,
    knowUsRepeatClient: false,
    knowUsBridalFair: false,
    knowUsFoodTasting: false,
    knowUsCelebrityReferral: false,
    knowUsOthers: false,
  });

  // Page 3 fields (Buffet)
  const [pBuffet, setPBuffet] = useState({
    selectedPackage: "",
    cocktailSelections: [],
    upgradeSelections125: [],
    upgradeSelections150: [],
    foodStations: [],
    oysterBarSelections: [],
    appetizerUpgradeSelections125: [],
    appetizerUpgradeSelections150: [],
    soupSelections: [],
    upgradeSoupSelections100: [],
    saladUpgradeSelections125: [],
    saladUpgradeSelections150: [],
    mainBeefSelections: [],
    beefUpgradeSelections100: [],
    beefUpgradeSelections125: [],
    beefUpgradeSelections500: [],
    beefUpgradeSelections1100: [],
    mainPorkSelections: [],
    porkUpgradeSelections200: [],
    porkUpgradeSelections250: [],
    porkUpgradeSelections275: [],
    porkUpgradeSelections15000: [],
    mainFishSelections: [],
    fishUpgradeSelections200: [],
    fishUpgradeSelections225: [],
    mainSeafoodSelections: [],
    seafoodUpgradeSelections200: [],
    seafoodUpgradeSelections235: [],
    seafoodUpgradeSelections335: [],
    mainChickenSelections: [],
    chickenUpgradeSelections95: [],
    chickenUpgradeSelections100: [],
    chickenUpgradeSelections110: [],
    mainPastaSelections: [],
    pastaUpgradeSelections150: [],
    mainNoodlesSelections: [],
    mainVegSelections: [],
    vegUpgradeSelections50: [],
    vegUpgradeSelections60: [],
    vegUpgradeSelections75: [],
    vegUpgradeSelections650: [],
    mainSideDishSelections: [],
    riceSelections: [],
    riceUpgradeSelections50: [],
    riceUpgradeSelections95: [],
    riceUpgradeSelections110: [],
    dessertSelections: [],
    dessertUpgradeSelections250: [],
    dessertUpgradeSelections300: [],
    dessertUpgradeSelections350: [],
    dessertUpgradeSelections400: [],
    dessertUpgradeSelections450: [],
    drinksSelections: [],
    drinksUpgradeSelections130: [],
    drinksUpgradeSelections150: [],
  });

  const cocktailLimit = useMemo(() => {
    // Sets the cocktail hour selection limit to 2 for all packages.
    return 2;
  }, []);

  const dessertLimit = useMemo(() => {
    if (!pBuffet.selectedPackage) return 0;
    // Buffet Package 1 has a limit of 1, all others have a limit of 2.
    return pBuffet.selectedPackage === "Buffet Package 1" ? 1 : 2;
  }, [pBuffet.selectedPackage]);
  // Menu selection limits based on package
  const menuLimits = useMemo(() => {
    const pkg = pBuffet.selectedPackage;
    if (!pkg) return {};
    
    if (pkg === "Buffet Package 1") {
      return {
        foodStations: 1,
        appetizer: 1,
        salad: 1,
        beefPorkCombined: 1, // Beef OR Pork
        fishSeafoodCombined: 1, // Fish OR Seafood
        chicken: 1,
        pastaNoodlesVegCombined: 1, // Pasta OR Noodles OR Vegetables
        dessert: 2,
        drinks: 2
      };
    } else if (pkg === "Buffet Package 2") {
      return {
        foodStations: 1,
        appetizer: 1,
        salad: 1,
        beefPorkCombined: 1, // Beef OR Pork
        fishSeafoodCombined: 1, // Fish OR Seafood
        chicken: 1,
        pastaNoodlesCombined: 1, // Pasta OR Noodles
        vegetables: 1, // Separate
        dessert: 2,
        drinks: 2
      };
    } else if (pkg === "Buffet Package 3") {
      return {
        foodStations: 1,
        appetizer: 1,
        salad: 1,
        beef: 1, // Separate
        pork: 1, // Separate
        fishSeafoodCombined: 1, // Fish OR Seafood
        chicken: 1,
        pastaNoodlesCombined: 1, // Pasta OR Noodles
        vegetables: 1, // Separate
        dessert: 2,
        drinks: 2
      };
    }
    return {};
  }, [pBuffet.selectedPackage]);

  // Calculate the total per-person cost of all selected upgrades
  const totalUpgradeCostPerPax = useMemo(() => {
    if (p1.serviceStyle !== "Buffet") return 0;

    // Sum up the cost of all selected per-pax upgrades
    return (
      (pBuffet.foodStations || []).reduce((sum, s) => sum + s.cost, 0) +
      ((pBuffet.upgradeSelections125 || []).length * 125) +
      ((pBuffet.upgradeSelections150 || []).length * 150) +
      ((pBuffet.appetizerUpgradeSelections125 || []).length * 125) +
      ((pBuffet.appetizerUpgradeSelections150 || []).length * 150) +
      ((pBuffet.upgradeSoupSelections100 || []).length * 100) +
      ((pBuffet.saladUpgradeSelections125 || []).length * 125) +
      ((pBuffet.saladUpgradeSelections150 || []).length * 150) +
      ((pBuffet.beefUpgradeSelections100 || []).length * 100) +
      ((pBuffet.beefUpgradeSelections125 || []).length * 125) +
      ((pBuffet.beefUpgradeSelections500 || []).length * 500) +
      ((pBuffet.beefUpgradeSelections1100 || []).length * 1100) +
      ((pBuffet.porkUpgradeSelections200 || []).length * 200) +
      ((pBuffet.porkUpgradeSelections250 || []).length * 250) +
      ((pBuffet.porkUpgradeSelections275 || []).length * 275) +
      ((pBuffet.fishUpgradeSelections200 || []).length * 200) +
      ((pBuffet.fishUpgradeSelections225 || []).length * 225) +
      ((pBuffet.seafoodUpgradeSelections200 || []).length * 200) +
      ((pBuffet.seafoodUpgradeSelections235 || []).length * 235) +
      ((pBuffet.seafoodUpgradeSelections335 || []).length * 335) +
      ((pBuffet.chickenUpgradeSelections95 || []).length * 95) +
      ((pBuffet.chickenUpgradeSelections100 || []).length * 100) +
      ((pBuffet.chickenUpgradeSelections110 || []).length * 110) +
      ((pBuffet.pastaUpgradeSelections150 || []).length * 150) +
      ((pBuffet.vegUpgradeSelections50 || []).length * 50) +
      ((pBuffet.vegUpgradeSelections60 || []).length * 60) +
      ((pBuffet.vegUpgradeSelections75 || []).length * 75) +
      ((pBuffet.vegUpgradeSelections650 || []).length * 650) +
      ((pBuffet.riceUpgradeSelections50 || []).length * 50) +
      ((pBuffet.riceUpgradeSelections95 || []).length * 95) +
      ((pBuffet.riceUpgradeSelections110 || []).length * 110) +
      ((pBuffet.dessertUpgradeSelections250 || []).length * 250) +
      ((pBuffet.dessertUpgradeSelections300 || []).length * 300) +
      ((pBuffet.dessertUpgradeSelections350 || []).length * 350) +
      ((pBuffet.dessertUpgradeSelections400 || []).length * 400) +
      ((pBuffet.dessertUpgradeSelections450 || []).length * 450) +
      ((pBuffet.drinksUpgradeSelections130 || []).length * 130) +
      ((pBuffet.drinksUpgradeSelections150 || []).length * 150)
    );
  }, [pBuffet, p1.serviceStyle]);

  // Helper functions to count current selections
  const getCurrentSelectionCounts = useMemo(() => {
    const beefCount = (pBuffet.mainBeefSelections || []).length + 
                      (pBuffet.beefUpgradeSelections100 || []).length +
                      (pBuffet.beefUpgradeSelections125 || []).length +
                      (pBuffet.beefUpgradeSelections500 || []).length +
                      (pBuffet.beefUpgradeSelections1100 || []).length;
    
    const porkCount = (pBuffet.mainPorkSelections || []).length +
                      (pBuffet.porkUpgradeSelections200 || []).length +
                      (pBuffet.porkUpgradeSelections250 || []).length +
                      (pBuffet.porkUpgradeSelections275 || []).length +
                      (pBuffet.porkUpgradeSelections15000 || []).length;
    
    const fishCount = (pBuffet.mainFishSelections || []).length +
                      (pBuffet.fishUpgradeSelections200 || []).length +
                      (pBuffet.fishUpgradeSelections225 || []).length;
    
    const seafoodCount = (pBuffet.mainSeafoodSelections || []).length +
                         (pBuffet.seafoodUpgradeSelections200 || []).length +
                         (pBuffet.seafoodUpgradeSelections235 || []).length +
                         (pBuffet.seafoodUpgradeSelections335 || []).length;
    
    const chickenCount = (pBuffet.mainChickenSelections || []).length +
                         (pBuffet.chickenUpgradeSelections95 || []).length +
                         (pBuffet.chickenUpgradeSelections100 || []).length +
                         (pBuffet.chickenUpgradeSelections110 || []).length;
    
    const pastaCount = (pBuffet.mainPastaSelections || []).length +
                       (pBuffet.pastaUpgradeSelections150 || []).length;
    
    const noodlesCount = (pBuffet.mainNoodlesSelections || []).length;
    
    const vegCount = (pBuffet.mainVegSelections || []).length +
                     (pBuffet.vegUpgradeSelections50 || []).length +
                     (pBuffet.vegUpgradeSelections60 || []).length +
                     (pBuffet.vegUpgradeSelections75 || []).length +
                     (pBuffet.vegUpgradeSelections650 || []).length;
    
    const foodStationsCount = (pBuffet.foodStations || []).length;
    
    const appetizerCount = (pBuffet.appetizerUpgradeSelections125 || []).length +
                           (pBuffet.appetizerUpgradeSelections150 || []).length;
    
    const saladCount = (pBuffet.saladUpgradeSelections125 || []).length +
                       (pBuffet.saladUpgradeSelections150 || []).length;

    return {
      beef: beefCount,
      pork: porkCount,
      beefPork: beefCount + porkCount,
      fish: fishCount,
      seafood: seafoodCount,
      fishSeafood: fishCount + seafoodCount,
      chicken: chickenCount,
      pasta: pastaCount,
      noodles: noodlesCount,
      vegetables: vegCount,
      pastaNoodles: pastaCount + noodlesCount,
      pastaNoodlesVeg: pastaCount + noodlesCount + vegCount,
      foodStations: foodStationsCount,
      appetizer: appetizerCount,
      salad: saladCount
    };
  }, [pBuffet]);


  // Auto-set price per plate for buffet based on package and guests
  useEffect(() => {
    if (p1.serviceStyle === "Buffet" && pBuffet.selectedPackage && p1.totalGuests) {
      const guests = parseInt(p1.totalGuests);
      if (guests < 100) {
        setP3(prev => ({ ...prev, pricePerPlate: "" }));
        setErrors(prev => ({ ...prev, totalGuests: "Minimum 100 pax required for buffet packages." }));
        return;
      }
      // Define pricing tiers (same as in packages)
      const pricingTiers = {
        "Buffet Package 1": [
          { minPax: 300, price: "2,145.00" },
          { minPax: 250, price: "2,200.00" },
          { minPax: 200, price: "2,275.00" },
          { minPax: 150, price: "2,390.00" },
          { minPax: 100, price: "2,800.00" }
        ],
        "Buffet Package 2": [
          { minPax: 300, price: "2,245.00" },
          { minPax: 250, price: "2,295.00" },
          { minPax: 200, price: "2,370.00" },
          { minPax: 150, price: "2,475.00" },
          { minPax: 100, price: "2,890.00" }
        ],
        "Buffet Package 3": [
          { minPax: 300, price: "2,380.00" },
          { minPax: 250, price: "2,435.00" },
          { minPax: 200, price: "2,510.00" },
          { minPax: 150, price: "2,610.00" },
          { minPax: 100, price: "3,030.00" }
        ]
      };
      const tiers = pricingTiers[pBuffet.selectedPackage];
      if (tiers) {
        // Find the tier where guests >= minPax, take the first (highest price for lowest pax)
        const tier = tiers.find(t => guests >= t.minPax) || tiers[tiers.length - 1]; // fallback to 100 pax
        setP3(prev => ({ ...prev, pricePerPlate: tier.price }));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.totalGuests;
          return newErrors;
        });
      }
    }
  }, [p1.serviceStyle, pBuffet.selectedPackage, p1.totalGuests]);

  // Auto-fill menu summaries in Page 5 for buffet
  useEffect(() => {
    if (p1.serviceStyle === "Buffet") {
      const cocktailText = [
        ...(pBuffet.cocktailSelections || []),
        ...(pBuffet.upgradeSelections125 || []).map(s => `${s} (+125)`),
        ...(pBuffet.upgradeSelections150 || []).map(s => `${s} (+150)`)
      ].join("\n");

      const foodStationsText = (pBuffet.foodStations || []).map(s => {
        if (s.name === "Oyster Bar") {
          return `${s.name} (+${s.cost}) - ${(pBuffet.oysterBarSelections || []).join(", ")}`;
        }
        return `${s.name} (+${s.cost})`;
      }).join("\n");

      const appetizerText = [
        ...(pBuffet.appetizerUpgradeSelections125 || []).map(s => `${s} (+125)`),
        ...(pBuffet.appetizerUpgradeSelections150 || []).map(s => `${s} (+150)`)
      ].join("\n");

      const soupText = [
        ...(pBuffet.soupSelections || []),
        ...(pBuffet.upgradeSoupSelections100 || []).map(s => `${s} (+100)`)
      ].join("\n");

      const saladText = [
        ...(pBuffet.saladUpgradeSelections125 || []).map(s => `${s} (+125)`),
        ...(pBuffet.saladUpgradeSelections150 || []).map(s => `${s} (+150)`)
      ].join("\n");

      const mainText = [
        // Beef Selections
        ...(pBuffet.mainBeefSelections || []),
        ...(pBuffet.beefUpgradeSelections100 || []).map(s => `${s} (+100)`),
        ...(pBuffet.beefUpgradeSelections125 || []).map(s => `${s} (+125)`),
        ...(pBuffet.beefUpgradeSelections500 || []).map(s => `${s} (+500)`),
        ...(pBuffet.beefUpgradeSelections1100 || []).map(s => `${s} (+1100)`),
        // Pork Selections
        ...(pBuffet.mainPorkSelections || []),
        ...(pBuffet.porkUpgradeSelections200 || []).map(s => `${s} (+200)`),
        ...(pBuffet.porkUpgradeSelections250 || []).map(s => `${s} (+250)`),
        ...(pBuffet.porkUpgradeSelections275 || []).map(s => `${s} (+275)`),
        ...(pBuffet.porkUpgradeSelections15000 || []).map(s => `${s} (+15000)`),
        // Fish Selections
        ...(pBuffet.mainFishSelections || []),
        ...(pBuffet.fishUpgradeSelections200 || []).map(s => `${s} (+200)`),
        ...(pBuffet.fishUpgradeSelections225 || []).map(s => `${s} (+225)`),
        // Seafood Selections
        ...(pBuffet.mainSeafoodSelections || []),
        ...(pBuffet.seafoodUpgradeSelections200 || []).map(s => `${s} (+200)`),
        ...(pBuffet.seafoodUpgradeSelections235 || []).map(s => `${s} (+235)`),
        ...(pBuffet.seafoodUpgradeSelections335 || []).map(s => `${s} (+335)`),
        // Chicken Selections
        ...(pBuffet.mainChickenSelections || []),
        ...(pBuffet.chickenUpgradeSelections95 || []).map(s => `${s} (+95)`),
        ...(pBuffet.chickenUpgradeSelections100 || []).map(s => `${s} (+100)`),
        ...(pBuffet.chickenUpgradeSelections110 || []).map(s => `${s} (+110)`),
        // Pasta Selections
        ...(pBuffet.mainPastaSelections || []),
        ...(pBuffet.pastaUpgradeSelections150 || []).map(s => `${s} (+150)`),
        // Noodles Selections
        ...(pBuffet.mainNoodlesSelections || []),
        // Vegetable Selections
        ...(pBuffet.mainVegSelections || []),
        ...(pBuffet.vegUpgradeSelections50 || []).map(s => `${s} (+50)`),
        ...(pBuffet.vegUpgradeSelections60 || []).map(s => `${s} (+60)`),
        ...(pBuffet.vegUpgradeSelections75 || []).map(s => `${s} (+75)`),
        ...(pBuffet.vegUpgradeSelections650 || []).map(s => `${s} (+650)`),
        // Side Dish Selections
        ...(pBuffet.mainSideDishSelections || [])
      ].join("\n");

      const riceText = [
        ...(pBuffet.riceSelections || []),
        ...(pBuffet.riceUpgradeSelections50 || []).map(s => `${s} (+50)`),
        ...(pBuffet.riceUpgradeSelections95 || []).map(s => `${s} (+95)`),
        ...(pBuffet.riceUpgradeSelections110 || []).map(s => `${s} (+110)`),
      ].join("\n");

      const dessertText = [
        ...(pBuffet.dessertSelections || []),
        ...(pBuffet.dessertUpgradeSelections250 || []).map(s => `${s} (+250)`),
        ...(pBuffet.dessertUpgradeSelections300 || []).map(s => `${s} (+300)`),
        ...(pBuffet.dessertUpgradeSelections350 || []).map(s => `${s} (+350)`),
        ...(pBuffet.dessertUpgradeSelections400 || []).map(s => `${s} (+400)`),
        ...(pBuffet.dessertUpgradeSelections450 || []).map(s => `${s} (+450)`),
      ].join("\n");

      const drinksText = [
        ...(pBuffet.drinksSelections || []),
        ...(pBuffet.drinksUpgradeSelections130 || []).map(s => `${s} (+130)`),
        ...(pBuffet.drinksUpgradeSelections150 || []).map(s => `${s} (+150)`),
      ].join("\n");

      setP3(prev => ({
        ...prev,
        cocktailHour: cocktailText,
        foodStations: foodStationsText,
        appetizer: appetizerText,
        soup: soupText,
        salad: saladText,
        mainEntree: mainText,
        rice: riceText,
        dessert: dessertText,
        drinks: drinksText
      }));
    }
  }, [
    p1.serviceStyle,
    pBuffet.cocktailSelections, pBuffet.upgradeSelections125, pBuffet.upgradeSelections150,
    pBuffet.foodStations, pBuffet.oysterBarSelections,
    pBuffet.appetizerUpgradeSelections125, pBuffet.appetizerUpgradeSelections150,
    pBuffet.soupSelections, pBuffet.upgradeSoupSelections100,
    pBuffet.saladUpgradeSelections125, pBuffet.saladUpgradeSelections150,
    pBuffet.mainBeefSelections, pBuffet.beefUpgradeSelections100, pBuffet.beefUpgradeSelections125, pBuffet.beefUpgradeSelections500, pBuffet.beefUpgradeSelections1100,
    pBuffet.mainPorkSelections, pBuffet.porkUpgradeSelections200, pBuffet.porkUpgradeSelections250, pBuffet.porkUpgradeSelections275, pBuffet.porkUpgradeSelections15000,
    pBuffet.mainFishSelections, pBuffet.fishUpgradeSelections200, pBuffet.fishUpgradeSelections225,
    pBuffet.mainSeafoodSelections, pBuffet.seafoodUpgradeSelections200, pBuffet.seafoodUpgradeSelections235, pBuffet.seafoodUpgradeSelections335,
    pBuffet.mainChickenSelections, pBuffet.chickenUpgradeSelections95, pBuffet.chickenUpgradeSelections100, pBuffet.chickenUpgradeSelections110,
    pBuffet.mainPastaSelections, pBuffet.pastaUpgradeSelections150,
    pBuffet.mainNoodlesSelections,
    pBuffet.mainVegSelections, pBuffet.vegUpgradeSelections50, pBuffet.vegUpgradeSelections60, pBuffet.vegUpgradeSelections75, pBuffet.vegUpgradeSelections650,
    pBuffet.mainSideDishSelections,
    pBuffet.riceSelections, pBuffet.riceUpgradeSelections50, pBuffet.riceUpgradeSelections95, pBuffet.riceUpgradeSelections110,
    pBuffet.dessertSelections, pBuffet.dessertUpgradeSelections250, pBuffet.dessertUpgradeSelections300, pBuffet.dessertUpgradeSelections350, pBuffet.dessertUpgradeSelections400, pBuffet.dessertUpgradeSelections450,
    pBuffet.drinksSelections, pBuffet.drinksUpgradeSelections130, pBuffet.drinksUpgradeSelections150
  ]);

  // Page 4 fields (Menu/Pricing)
  const [p3, setP3] = useState({
    pricePerPlate: "0",
    cocktailHour: "",
    foodStations: "",
    appetizer: "",
    soup: "",
    salad: "",
    mainEntree: "",
    rice: "",
    dessert: "",
    drinks: "",
    cakeName: "",
    roastedPig: "",
    roastedCalf: "",
    totalMenuCost: "0",
    totalSpecialReqCost: "0",
    mobilizationCharge: "0",
    taxes: "",
    serviceCharge: "",
    grandTotal: "0",
    fortyPercentDueOn: "",
    fortyPercentAmount: "",
    fortyPercentReceivedBy: "",
    fortyPercentDateReceived: "",
    fullPaymentDueOn: "",
    fullPaymentAmount: "",
    fullPaymentReceivedBy: "",
    fullPaymentDateReceived: "",
    remarks: "",
  });

  // Initialize for create vs edit
  useEffect(() => {
    if (existing) {
      setP1(existing.page1 || {});
      setP2(existing.page2 || {});
      setPBuffet({
        selectedPackage: existing.pageBuffet?.selectedPackage || "",
        cocktailSelections: existing.pageBuffet?.cocktailSelections || [],
        upgradeSelections125: existing.pageBuffet?.upgradeSelections125 || [],
        upgradeSelections150: existing.pageBuffet?.upgradeSelections150 || [],
        foodStations: existing.pageBuffet?.foodStations || [],
        oysterBarSelections: existing.pageBuffet?.oysterBarSelections || [],
        appetizerUpgradeSelections125: existing.pageBuffet?.appetizerUpgradeSelections125 || [],
        appetizerUpgradeSelections150: existing.pageBuffet?.appetizerUpgradeSelections150 || [],
        soupSelections: existing.pageBuffet?.soupSelections || [],
        upgradeSoupSelections100: existing.pageBuffet?.upgradeSoupSelections100 || [],
        saladUpgradeSelections125: existing.pageBuffet?.saladUpgradeSelections125 || [],
        saladUpgradeSelections150: existing.pageBuffet?.saladUpgradeSelections150 || [],
        mainBeefSelections: existing.pageBuffet?.mainBeefSelections || [],
        beefUpgradeSelections100: existing.pageBuffet?.beefUpgradeSelections100 || [],
        beefUpgradeSelections125: existing.pageBuffet?.beefUpgradeSelections125 || [],
        beefUpgradeSelections500: existing.pageBuffet?.beefUpgradeSelections500 || [],
        beefUpgradeSelections1100: existing.pageBuffet?.beefUpgradeSelections1100 || [],
        mainPorkSelections: existing.pageBuffet?.mainPorkSelections || [],
        porkUpgradeSelections200: existing.pageBuffet?.porkUpgradeSelections200 || [],
        porkUpgradeSelections250: existing.pageBuffet?.porkUpgradeSelections250 || [],
        porkUpgradeSelections275: existing.pageBuffet?.porkUpgradeSelections275 || [],
        porkUpgradeSelections15000: existing.pageBuffet?.porkUpgradeSelections15000 || [],
        mainFishSelections: existing.pageBuffet?.mainFishSelections || [],
        fishUpgradeSelections200: existing.pageBuffet?.fishUpgradeSelections200 || [],
        fishUpgradeSelections225: existing.pageBuffet?.fishUpgradeSelections225 || [],
        mainSeafoodSelections: existing.pageBuffet?.mainSeafoodSelections || [],
        seafoodUpgradeSelections200: existing.pageBuffet?.seafoodUpgradeSelections200 || [],
        seafoodUpgradeSelections235: existing.pageBuffet?.seafoodUpgradeSelections235 || [],
        seafoodUpgradeSelections335: existing.pageBuffet?.seafoodUpgradeSelections335 || [],
        mainChickenSelections: existing.pageBuffet?.mainChickenSelections || [],
        chickenUpgradeSelections95: existing.pageBuffet?.chickenUpgradeSelections95 || [],
        chickenUpgradeSelections100: existing.pageBuffet?.chickenUpgradeSelections100 || [],
        chickenUpgradeSelections110: existing.pageBuffet?.chickenUpgradeSelections110 || [],
        mainPastaSelections: existing.pageBuffet?.mainPastaSelections || [],
        pastaUpgradeSelections150: existing.pageBuffet?.pastaUpgradeSelections150 || [],
        mainNoodlesSelections: existing.pageBuffet?.mainNoodlesSelections || [],
        mainVegSelections: existing.pageBuffet?.mainVegSelections || [],
        vegUpgradeSelections50: existing.pageBuffet?.vegUpgradeSelections50 || [],
        vegUpgradeSelections60: existing.pageBuffet?.vegUpgradeSelections60 || [],
        vegUpgradeSelections75: existing.pageBuffet?.vegUpgradeSelections75 || [],
        vegUpgradeSelections650: existing.pageBuffet?.vegUpgradeSelections650 || [],
        mainSideDishSelections: existing.pageBuffet?.mainSideDishSelections || [],
        riceSelections: existing.pageBuffet?.riceSelections || [],
        riceUpgradeSelections50: existing.pageBuffet?.riceUpgradeSelections50 || [],
        riceUpgradeSelections95: existing.pageBuffet?.riceUpgradeSelections95 || [],
        riceUpgradeSelections110: existing.pageBuffet?.riceUpgradeSelections110 || [],
        dessertSelections: existing.pageBuffet?.dessertSelections || [],
        dessertUpgradeSelections250: existing.pageBuffet?.dessertUpgradeSelections250 || [],
        dessertUpgradeSelections300: existing.pageBuffet?.dessertUpgradeSelections300 || [],
        dessertUpgradeSelections350: existing.pageBuffet?.dessertUpgradeSelections350 || [],
        dessertUpgradeSelections400: existing.pageBuffet?.dessertUpgradeSelections400 || [],
        dessertUpgradeSelections450: existing.pageBuffet?.dessertUpgradeSelections450 || [],
        drinksSelections: existing.pageBuffet?.drinksSelections || [],
        drinksUpgradeSelections130: existing.pageBuffet?.drinksUpgradeSelections130 || [],
        drinksUpgradeSelections150: existing.pageBuffet?.drinksUpgradeSelections150 || [],
      });
      setP3(existing.page3 || {});
      setNextNumber(existing.contractNumber || "");
    } else {
      fetch("http://localhost:5000/contracts/next-number")
        .then((r) => r.json())
        .then((d) => setNextNumber(d.nextNumber || ""))
        .catch(() => setNextNumber(""));
    }
  }, [existing]);

  // Pre-fill coordinator fields with user profile for new contracts
  useEffect(() => {
    if (!existing && user) {
      fetch(`http://localhost:5000/profile/${user.username}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setP1((prev) => ({
              ...prev,
              coordinatorName: d.user.fullName || "",
              coordinatorMobile: d.user.mobile || "",
              coordinatorLandline: d.user.landline || "",
              coordinatorAddress: d.user.address || "",
              coordinatorEmail: d.user.email || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [existing, user]);

  // Auto-compute ingress time (10 hours before arrival of guests)
  useEffect(() => {
    if (p1.arrivalOfGuests && isTimeFieldValid(p1.arrivalOfGuests)) {
      // Parse time string HH:MM AM/PM
      const timeParts = p1.arrivalOfGuests.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3].toUpperCase();
        if (ampm === "PM" && hours !== 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        // Subtract 10 hours
        hours -= 10;
        if (hours < 0) hours += 24;
        // Format back to HH:MM AM/PM
        const newAmpm = hours >= 12 ? "PM" : "AM";
        let displayHours = hours % 12;
        if (displayHours === 0) displayHours = 12;
        const ingressTime = `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${newAmpm}`;
        setP1(prev => ({ ...prev, ingressTime }));
      }
    }
  }, [p1.arrivalOfGuests]);



  // Auto-compute total chairs
  useEffect(() => {
    const totalGuests = parseInt(p1.totalGuests) || 0;
    const total = totalGuests + 10;
    setP2(prev => ({ ...prev, totalChairs: total.toString() }));
  }, [p1.totalGuests]);

  // Validate chair sum equals total chairs
  useEffect(() => {
    const sum = (parseInt(p2.chairsMonoblock) || 0) +
                (parseInt(p2.chairsTiffany) || 0) +
                (parseInt(p2.chairsCrystal) || 0) +
                (parseInt(p2.chairsRustic) || 0) +
                (parseInt(p2.premiumChairs) || 0);
    const total = parseInt(p2.totalChairs) || 0;
    if (sum !== total) {
      setErrors((prev) => ({
        ...prev,
        chairsSum: `The total number of chairs entered (${sum}) must equal the Total Chairs (${total}).`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.chairsSum;
        return newErrors;
      });
    }
  }, [p2.chairsMonoblock, p2.chairsTiffany, p2.chairsCrystal, p2.chairsRustic, p2.premiumChairs, p2.totalChairs]);

  // Auto-set VIP seats based on table type
  useEffect(() => {
    let seats = '';
    if (p1.vipTableType === 'Round Table') seats = '8';
    else if (p1.vipTableType === 'Big Round Table') seats = '10';
    else if (p1.vipTableType === 'Rectangle Table') seats = '6';
    else if (p1.vipTableType === 'Long Rectangle Table') seats = '8';
    setP1(prev => ({ ...prev, vipTableSeats: seats }));
  }, [p1.vipTableType]);

  // Auto-set Regular seats based on table type
  useEffect(() => {
    let seats = '';
    if (p1.regularTableType === 'Round Table') seats = '8';
    else if (p1.regularTableType === 'Big Round Table') seats = '10';
    else if (p1.regularTableType === 'Rectangle Table') seats = '6';
    else if (p1.regularTableType === 'Long Rectangle Table') seats = '8';
    setP1(prev => ({ ...prev, regularTableSeats: seats }));
  }, [p1.regularTableType]);

  // Auto-compute VIP table quantity
  useEffect(() => {
    if (!p1.vipTableType || !p1.totalVIP) {
      setP1(prev => ({ ...prev, vipTableQuantity: '0' }));
      return;
    }
    const totalVIPNum = parseInt(p1.totalVIP) || 0;
    const seatsNum = parseInt(p1.vipTableSeats) || 1;
    const quantity = Math.ceil(totalVIPNum / seatsNum);
    setP1(prev => ({ ...prev, vipTableQuantity: quantity.toString() }));
  }, [p1.totalVIP, p1.vipTableSeats, p1.vipTableType]);

  // Auto-compute Regular table quantity
  useEffect(() => {
    if (!p1.regularTableType || !p1.totalRegular) {
      setP1(prev => ({ ...prev, regularTableQuantity: '0' }));
      return;
    }
    const totalRegularNum = (parseInt(p1.totalRegular) || 0) + 10;
    const seatsNum = parseInt(p1.regularTableSeats) || 1;
    const quantity = Math.ceil(totalRegularNum / seatsNum);
    setP1(prev => ({ ...prev, regularTableQuantity: quantity.toString() }));
  }, [p1.totalRegular, p1.regularTableSeats, p1.regularTableType]);

  // Auto-set cocktail time to arrival of guests
  useEffect(() => {
    setP1(prev => ({ ...prev, cocktailTime: p1.arrivalOfGuests }));
  }, [p1.arrivalOfGuests]);

  // Initialize availableHalls and maxPax based on venue and hall
  useEffect(() => {
    if (p1.venue) {
      const venueData = VENUES[p1.venue];
      if (venueData) {
        setAvailableHalls(Object.keys(venueData.halls));
        if (p1.hall && venueData.halls[p1.hall]) {
          setMaxPax(venueData.halls[p1.hall]);
        } else {
          setMaxPax(0);
        }
      }
    } else {
      setAvailableHalls([]);
      setMaxPax(0);
    }
  }, [p1.venue, p1.hall]);

  // Check hall capacity when total guests or hall changes
  useEffect(() => {
    if (p1.venue && p1.hall && VENUES[p1.venue]) {
      const pax = VENUES[p1.venue].halls[p1.hall] || 0;
      const totalGuestsNum = parseInt(p1.totalGuests) || 0;
      if (totalGuestsNum > pax) {
        setErrors((prev) => ({
          ...prev,
          totalGuests: `The selected hall cannot accommodate the total number of guests (${totalGuestsNum}). Maximum pax is ${pax}.`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.totalGuests;
          return newErrors;
        });
      }
    }
  }, [p1.totalGuests, p1.hall]);

  // Validate event date: must be at least 6 months from now
  useEffect(() => {
    if (p1.eventDate) {
      const eventDate = new Date(p1.eventDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      if (eventDate < sixMonthsFromNow) {
        setErrors((prev) => ({
          ...prev,
          eventDate: "The event date should be at least 6 months from now.",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.eventDate;
          return newErrors;
        });
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.eventDate;
        return newErrors;
      });
    }
  }, [p1.eventDate]);

  // Auto-set full payment due date to 1 month before event date
  useEffect(() => {
    if (p1.eventDate) {
      const eventDate = new Date(p1.eventDate);
      const fullPaymentDate = new Date(eventDate);
      fullPaymentDate.setMonth(fullPaymentDate.getMonth() - 1);
      const formatted = fullPaymentDate.toISOString().split('T')[0];
      setP3((prev) => ({ ...prev, fullPaymentDueOn: formatted }));
    }
  }, [p1.eventDate]);

  // Auto-compute total menu cost as price per plate * total guests + food stations additional cost
  useEffect(() => {
    // Remove commas from price string before parsing to ensure correct calculation
    const price = parseFloat(String(p3.pricePerPlate).replace(/,/g, '')) || 0;
    const guests = parseInt(p1.totalGuests) || 0;

    // Sum up the cost of all selected per-pax upgrades
    const additionalPerPax =
      // Food Stations
      (pBuffet.foodStations || []).reduce((sum, s) => sum + s.cost, 0) +
      // Cocktail Hour Upgrades
      ((pBuffet.upgradeSelections125 || []).length * 125) +
      ((pBuffet.upgradeSelections150 || []).length * 150) +
      // Appetizer Upgrades
      ((pBuffet.appetizerUpgradeSelections125 || []).length * 125) +
      ((pBuffet.appetizerUpgradeSelections150 || []).length * 150) +
      // Soup Upgrades
      ((pBuffet.upgradeSoupSelections100 || []).length * 100) +
      // Salad Upgrades
      ((pBuffet.saladUpgradeSelections125 || []).length * 125) +
      ((pBuffet.saladUpgradeSelections150 || []).length * 150) +
      // Beef Upgrades
      ((pBuffet.beefUpgradeSelections100 || []).length * 100) +
      ((pBuffet.beefUpgradeSelections125 || []).length * 125) +
      ((pBuffet.beefUpgradeSelections500 || []).length * 500) +
      ((pBuffet.beefUpgradeSelections1100 || []).length * 1100) +
      // Pork Upgrades (per-pax only)
      ((pBuffet.porkUpgradeSelections200 || []).length * 200) +
      ((pBuffet.porkUpgradeSelections250 || []).length * 250) +
      ((pBuffet.porkUpgradeSelections275 || []).length * 275) +
      // Fish Upgrades
      ((pBuffet.fishUpgradeSelections200 || []).length * 200) +
      ((pBuffet.fishUpgradeSelections225 || []).length * 225) +
      // Seafood Upgrades
      ((pBuffet.seafoodUpgradeSelections200 || []).length * 200) +
      ((pBuffet.seafoodUpgradeSelections235 || []).length * 235) +
      ((pBuffet.seafoodUpgradeSelections335 || []).length * 335) +
      // Chicken Upgrades
      ((pBuffet.chickenUpgradeSelections95 || []).length * 95) +
      ((pBuffet.chickenUpgradeSelections100 || []).length * 100) +
      ((pBuffet.chickenUpgradeSelections110 || []).length * 110) +
      // Pasta Upgrades
      ((pBuffet.pastaUpgradeSelections150 || []).length * 150) +
      // Vegetable Upgrades
      ((pBuffet.vegUpgradeSelections50 || []).length * 50) +
      ((pBuffet.vegUpgradeSelections60 || []).length * 60) +
      ((pBuffet.vegUpgradeSelections75 || []).length * 75) +
      ((pBuffet.vegUpgradeSelections650 || []).length * 650) +
      // Rice Upgrades
      ((pBuffet.riceUpgradeSelections50 || []).length * 50) +
      ((pBuffet.riceUpgradeSelections95 || []).length * 95) +
      ((pBuffet.riceUpgradeSelections110 || []).length * 110) +
      // Dessert Upgrades
      ((pBuffet.dessertUpgradeSelections250 || []).length * 250) +
      ((pBuffet.dessertUpgradeSelections300 || []).length * 300) +
      ((pBuffet.dessertUpgradeSelections350 || []).length * 350) +
      ((pBuffet.dessertUpgradeSelections400 || []).length * 400) +
      ((pBuffet.dessertUpgradeSelections450 || []).length * 450) +
      // Drinks Upgrades
      ((pBuffet.drinksUpgradeSelections130 || []).length * 130) +
      ((pBuffet.drinksUpgradeSelections150 || []).length * 150);

    const total = (price + additionalPerPax) * guests;
    setP3((prev) => ({ ...prev, totalMenuCost: total.toString() }));
  }, [p3.pricePerPlate, p1.totalGuests, pBuffet]);

  // Auto-compute service charge as 10% of totalMenuCost + totalSpecialReqCost + mobilizationCharge
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const service = (menu + special + mob) * 0.1;
    setP3((prev) => ({ ...prev, serviceCharge: service.toString() }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge]);

  // Auto-compute taxes as 12% of totalMenuCost + totalSpecialReqCost + mobilizationCharge
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const tax = (menu + special + mob) * 0.12;
    setP3((prev) => ({ ...prev, taxes: tax.toString() }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge]);

  // Auto-compute grand total
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const service = parseFloat(p3.serviceCharge) || 0;
    const tax = parseFloat(p3.taxes) || 0;
    const grand = (menu + special + mob + service + tax).toFixed(2);
    setP3((prev) => ({ ...prev, grandTotal: grand }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge, p3.serviceCharge, p3.taxes]);

  // Auto-compute 40% amount as 40% of grand total
  useEffect(() => {
    const grand = parseFloat(p3.grandTotal) || 0;
    const amount = (grand * 0.4).toFixed(2);
    setP3((prev) => ({ ...prev, fortyPercentAmount: amount }));
  }, [p3.grandTotal]);

  // Auto-compute full payment amount as 60% of grand total
  useEffect(() => {
    const grand = parseFloat(p3.grandTotal) || 0;
    const amount = (grand * 0.6).toFixed(2);
    setP3((prev) => ({ ...prev, fullPaymentAmount: amount }));
  }, [p3.grandTotal]);

  // Auto-set forty percent due date to 6 months before event date
  useEffect(() => {
    if (p1.eventDate) {
      const eventDate = new Date(p1.eventDate);
      const fortyPercentDate = new Date(eventDate);
      fortyPercentDate.setMonth(fortyPercentDate.getMonth() - 6);
      const formatted = fortyPercentDate.toISOString().split('T')[0];
      setP3((prev) => ({ ...prev, fortyPercentDueOn: formatted }));
    }
  }, [p1.eventDate]);

  // Validation functions
  const convertToUppercase = (value) => {
    return value.toUpperCase();
  };

  const validateEmail = (email) => {
    if (email.toUpperCase() === "N/A") return true;
    return email.includes("@gmail.com") || email.includes("@yahoo.com");
  };

  const validateFields = () => {
    const newErrors = {};

    if (p1.celebratorEmail && !validateEmail(p1.celebratorEmail)) {
      newErrors.celebratorEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
      newErrors.representativeEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
      newErrors.coordinatorEmail = "Email must end with @gmail.com or @yahoo.com";
    }

    if (p1.celebratorMobile && !/^\d{11}$/.test(p1.celebratorMobile)) {
      newErrors.celebratorMobile = "Mobile number must be 11 digits";
    }
    if (p1.representativeMobile && !/^\d{11}$/.test(p1.representativeMobile)) {
      newErrors.representativeMobile = "Mobile number must be 11 digits";
    }
    if (p1.coordinatorMobile && !/^\d{11}$/.test(p1.coordinatorMobile)) {
      newErrors.coordinatorMobile = "Mobile number must be 11 digits";
    }

    if (p1.celebratorLandline && !/^\d{7}$/.test(p1.celebratorLandline)) {
      newErrors.celebratorLandline = "Landline number must be 7 digits";
    }
    if (p1.representativeLandline && !/^\d{7}$/.test(p1.representativeLandline)) {
      newErrors.representativeLandline = "Landline number must be 7 digits";
    }
    if (p1.coordinatorLandline && !/^\d{7}$/.test(p1.coordinatorLandline)) {
      newErrors.coordinatorLandline = "Landline number must be 7 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTimeField = (value) => {
    // Allow time format (HH:MM AM/PM) or "N/A"
    const time12Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const naRegex = /^N\/A$/i;
    
    if (value === "" || time12Regex.test(value) || time24Regex.test(value) || naRegex.test(value)) {
      return value.toUpperCase();
    }
    return value; // Return as-is if invalid (will show validation error)
  };

  const isTimeFieldValid = (value) => {
    if (value === "") return true; // Empty is allowed
    const time12Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const naRegex = /^N\/A$/i;
    return time12Regex.test(value) || time24Regex.test(value) || naRegex.test(value);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
    return phoneRegex.test(phone);
  };

  const isFormValid = () => {
    // Check required fields in page1 (only those with asterisks)
    const requiredP1Fields = [
      'celebratorName',
      'representativeName',
      'representativeRelationship',
      'representativeEmail',
      'representativeAddress',
      'representativeMobile',
      'coordinatorName',
      'coordinatorMobile',
      'coordinatorEmail',
      'coordinatorAddress',
      'eventDate',
      'occasion',
      'serviceStyle',
      'venue',
      'hall',
      'address',
      'arrivalOfGuests',
      'ingressTime',
      'cocktailTime',
      'servingTime',
      'totalVIP',
      'totalRegular',
      'totalGuests',
      'themeSetup',
      'colorMotif',
      'vipTableType',
      'vipTableSeats',
      'vipTableQuantity',
      'regularTableType',
      'regularTableSeats',
      'regularTableQuantity',
      'vipUnderliner',
      'vipNapkin',
      'guestUnderliner',
      'guestNapkin',
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) return false;
    }

    // Check required fields in page2 (chairs with asterisks)
    const requiredP2Fields = [
      'chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'premiumChairs', 'totalChairs'
    ];
    for (const field of requiredP2Fields) {
      if (!p2[field] || !p2[field].trim()) return false;
    }

    // Check required fields in buffet page if Buffet
    if (p1.serviceStyle === "Buffet") {
      if (!pBuffet.selectedPackage) return false;
    }

    // Check required fields in page3 (only essential ones)
    const requiredP3Fields = [
      'pricePerPlate'
    ];
    if (p1.serviceStyle === "Buffet") {
      requiredP3Fields.push('cocktailHour', 'soup', 'mainEntree', 'rice', 'dessert', 'drinks');
    }
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) return false;
    }

    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    // Check required fields in page1
    const requiredP1Fields = [
      'celebratorName',
      'representativeName',
      'representativeRelationship',
      'representativeEmail',
      'representativeAddress',
      'representativeMobile',
      'coordinatorName',
      'coordinatorMobile',
      'coordinatorEmail',
      'coordinatorAddress',
      'eventDate',
      'occasion',
      'serviceStyle',
      'venue',
      'hall',
      'address',
      'arrivalOfGuests',
      'ingressTime',
      'cocktailTime',
      'servingTime',
      'totalVIP',
      'totalRegular',
      'totalGuests',
      'themeSetup',
      'colorMotif',
      'vipTableType',
      'vipTableSeats',
      'vipTableQuantity',
      'regularTableType',
      'regularTableSeats',
      'regularTableQuantity',
      'vipUnderliner',
      'vipNapkin',
      'guestUnderliner',
      'guestNapkin',
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Check required fields in page3
    const requiredP3Fields = [
      'pricePerPlate', 'totalMenuCost', 'totalSpecialReqCost', 'mobilizationCharge', 'taxes', 'serviceCharge', 'fortyPercentAmount', 'fullPaymentDueOn', 'fullPaymentAmount'
    ];
    if (p1.serviceStyle === "Buffet") {
      requiredP3Fields.push('cocktailHour', 'soup', 'mainEntree', 'rice', 'dessert', 'drinks');
    }
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Email validations
    if (p1.celebratorEmail && !validateEmail(p1.celebratorEmail)) {
      newErrors.celebratorEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
      newErrors.representativeEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
      newErrors.coordinatorEmail = "Email must end with @gmail.com or @yahoo.com";
    }

    // Phone validations
    if (p1.celebratorMobile && p1.celebratorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.celebratorMobile)) {
      newErrors.celebratorMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.celebratorLandline && p1.celebratorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.celebratorLandline)) {
      newErrors.celebratorLandline = "Landline number must be 7 digits or N/A";
    }
    if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) {
      newErrors.representativeMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.representativeLandline && p1.representativeLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.representativeLandline)) {
      newErrors.representativeLandline = "Landline number must be 7 digits or N/A";
    }
    if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) {
      newErrors.coordinatorMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.coordinatorLandline && p1.coordinatorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.coordinatorLandline)) {
      newErrors.coordinatorLandline = "Landline number must be 7 digits or N/A";
    }

    // Buffet validations
    if (p1.serviceStyle === "Buffet") {
      if (!pBuffet.selectedPackage) {
        newErrors.selectedPackage = "Please select a buffet package.";
      }
      const cocktailLimit = !pBuffet.selectedPackage ? 0 : (pBuffet.selectedPackage === "Buffet Package 3" ? 3 : 2);
      const totalCocktailSelections = (pBuffet.cocktailSelections || []).length + (pBuffet.upgradeSelections125 || []).length + (pBuffet.upgradeSelections150 || []).length;
      if (totalCocktailSelections !== cocktailLimit) {
        newErrors.cocktailSelections = `Please select exactly ${cocktailLimit} cocktail hour options (including upgrades).`;
      }
    
      const soupUpgradeLimit = !pBuffet.selectedPackage ? 0 : (pBuffet.selectedPackage === "Buffet Package 1" ? 0 : (pBuffet.selectedPackage === "Buffet Package 2" ? 1 : 2));
      if ((pBuffet.upgradeSoupSelections100 || []).length > soupUpgradeLimit) {
        newErrors.upgradeSoupSelections100 = `Please select at most ${soupUpgradeLimit} soup upgrade options.`;
      }
      if ((pBuffet.foodStations || []).some(s => s.name === "Oyster Bar") && (pBuffet.oysterBarSelections || []).length !== 4) {
        newErrors.oysterBarSelections = "Please select exactly 4 oyster options.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CORRECTED VERSION for ContractForm.js

const handleAutoSave = async () => {
  if (!existing) return; // Only auto-save for existing contracts

  try {
    const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3 }),
    });
    if (!res.ok) {
      console.error("Auto-save failed");
    }
  } catch (error) {
    console.error("Auto-save error:", error);
  }
};

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (existing) {
      const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3, status: "Draft" }),
      });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "Draft",
          });
        }
        return true;
      } else {
        const payload = { department: "Sales", status: "Draft", page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3 };
        const res = await fetch("http://localhost:5000/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "Draft",
          });
        }
        return true;
      }
    } catch (err) {
      alert("Failed to save contract. Please try again.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      alert("Please fix validation errors");
      return;
    }

    try {
      if (existing) {
        const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3, status: "For Approval" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: data.contract.status || "For Approval",
          });
        }
      } else {
        const payload = { department: "Sales", status: "For Approval", page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3 };
        const res = await fetch("http://localhost:5000/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.contractName || p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "For Approval",
          });
        }
      }
    } catch (err) {
      alert("Failed to submit contract. Please try again.");
    }
  };

  const next = () => {
    if (existing) handleAutoSave();
    setActivePage((p) => Math.min(totalPages, p + 1));
  };
  const back = () => {
    if (existing) handleAutoSave();
    setActivePage((p) => Math.max(1, p - 1));
  };

  // When page changes (Next/Back), scroll to top for better UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  const renderPage1 = () => (
    <div className="page">
      <div className="form-row">
      </div>

      <h4>Celebrator</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Celebrator/Corporate Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.celebratorName} onChange={(e)=>setP1({...p1, celebratorName:convertToUppercase(e.target.value)})} onBlur={handleAutoSave} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.celebratorEmail} onChange={(e)=>setP1({...p1, celebratorEmail:e.target.value})} className={errors.celebratorEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorEmail}</div></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.celebratorAddress} onChange={(e)=>setP1({...p1, celebratorAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.celebratorLandline} onChange={(e)=>setP1({...p1, celebratorLandline:e.target.value})} className={errors.celebratorLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorLandline}</div></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.celebratorMobile} onChange={(e)=>setP1({...p1, celebratorMobile:e.target.value})} className={errors.celebratorMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorMobile}</div></div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeName} onChange={(e)=>setP1({...p1, representativeName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Relationship 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeRelationship} onChange={(e)=>setP1({...p1, representativeRelationship:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>
  Email Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeEmail} onChange={(e)=>setP1({...p1, representativeEmail:e.target.value})} className={errors.representativeEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeEmail}</div></div>
        <div className="form-group"><label>
  Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeAddress} onChange={(e)=>setP1({...p1, representativeAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.representativeLandline} onChange={(e)=>setP1({...p1, representativeLandline:e.target.value})} className={errors.representativeLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeLandline}</div></div>
        </div>
      <div className="form-row two">
        <div className="form-group"><label>
  Mobile No. 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeMobile} onChange={(e)=>setP1({...p1, representativeMobile:e.target.value})} className={errors.representativeMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeMobile}</div></div>
      </div>

      <h4>Coordinator </h4>
      <div className="form-row three">
        <div className="form-group"><label>
  Coordinator Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorName} onChange={(e)=>setP1({...p1, coordinatorName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Mobile No. 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorMobile} onChange={(e)=>setP1({...p1, coordinatorMobile:e.target.value})} className={errors.coordinatorMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorMobile}</div></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.coordinatorLandline} onChange={(e)=>setP1({...p1, coordinatorLandline:e.target.value})} className={errors.coordinatorLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorLandline}</div></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>
  Email Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorEmail} onChange={(e)=>setP1({...p1, coordinatorEmail:e.target.value})} className={errors.coordinatorEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorEmail}</div></div>
        <div className="form-group"><label>
  Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorAddress} onChange={(e)=>setP1({...p1, coordinatorAddress:convertToUppercase(e.target.value)})} /></div>
      </div>
      
      <h4>Event Details</h4>
      <div className="form-row three">
        <div className="form-group"><label>
  Date of Event
  <span className="required-asterisk">*</span>
</label><input type="date" value={p1.eventDate} onChange={(e)=>setP1({...p1, eventDate:e.target.value})} onBlur={handleAutoSave} className={errors.eventDate ? 'invalid-input' : ''} /><div className="validation-error">{errors.eventDate}</div></div>
        <div className="form-group">
          <label>
  Occasion
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.occasion} onChange={(e)=>setP1({...p1, occasion:e.target.value})}>
            <option value="">Select Occasion</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="DEBUT">Debut</option>
            <option value="SPECIAL OCCASION">Special Occasion</option>
            <option value="CORPORATE">Corporate</option>
            <option value="WEDDINGS">Weddings</option>
          </select>
        </div>
        <div className="form-group">
          <label>
  Service Style
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.serviceStyle} onChange={(e)=>setP1({...p1, serviceStyle:e.target.value})}>
            <option value="">Select Service Style</option>
            <option value="Buffet">Buffet</option>
            <option value="Signature Plated">Signature Plated</option>
          </select>
        </div>
      </div>
    <div className="form-row four">
      <div className="form-group">
        <label>
  Venue
  <span className="required-asterisk">*</span>
</label>
        <select
          value={p1.venue}
          onChange={(e) => {
            const venue = e.target.value;
            const venueData = VENUES[venue] || { address: "", halls: {} };
            setP1((prev) => ({
              ...prev,
              venue,
              address: venueData.address,
              hall: "",
            }));
            setAvailableHalls(Object.keys(venueData.halls));
            setMaxPax(0);
          }}
        >
          <option value="">Select Venue</option>
          {Object.keys(VENUES).map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>
  Hall
  <span className="required-asterisk">*</span>
</label>
        {p1.venue === "OTHERS" ? (
          <input
            value={p1.hall}
            onChange={(e) => setP1({ ...p1, hall: e.target.value.toUpperCase() })}
          />
        ) : (
          <select
            value={p1.hall}
            onChange={(e) => {
              const hall = e.target.value;
              setP1((prev) => ({ ...prev, hall }));
              if (p1.venue && VENUES[p1.venue]) {
                const pax = VENUES[p1.venue].halls[hall] || 0;
                setMaxPax(pax);
                // Remove alert and rely on error message display instead
                // const totalGuestsNum = parseInt(p1.totalGuests) || 0;
                // if (totalGuestsNum > pax) {
                //   alert(`Warning: The selected hall cannot accommodate the total number of guests (${totalGuestsNum}). Maximum pax is ${pax}.`);
                // }
              }
            }}
          >
            <option value="">Select Hall</option>
            {availableHalls.map((hall) => (
              <option key={hall} value={hall}>
                {hall} ({VENUES[p1.venue].halls[hall]} pax)
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="form-group"><label>
  Address
  <span className="required-asterisk">*</span>
</label><input value={p1.address} onChange={(e)=>setP1({...p1, address:convertToUppercase(e.target.value)})} /></div>
      <div className="form-group">
        <label>
  Arrival of Guests
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.arrivalOfGuests}
          onChange={(e) => setP1({...p1, arrivalOfGuests: validateTimeField(e.target.value)})}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.arrivalOfGuests) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.arrivalOfGuests) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
    </div>
    <div className="form-row three">
      <div className="form-group">
        <label>
  Ingress Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.ingressTime}
          onChange={(e) => setP1({ ...p1, ingressTime: validateTimeField(e.target.value) })}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.ingressTime) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.ingressTime) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
      <div className="form-group">
        <label>
  Cocktail Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.cocktailTime}
          readOnly
          placeholder="HH:MM AM/PM or N/A"
        />
      </div>
      <div className="form-group">
        <label>
  Serving Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.servingTime}
          onChange={(e) => setP1({ ...p1, servingTime: validateTimeField(e.target.value) })}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.servingTime) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.servingTime) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
    </div>
      <div className="form-row three">
        <div className="form-group"><label>
  VIP 
  <span className="required-asterisk">*</span>
</label><input value={p1.totalVIP} onChange={(e) => {
          const vipValue = e.target.value;
          setP1((prev) => {
            const newTotalVIP = vipValue;
            const newTotalRegular = prev.totalRegular;
            let newTotalGuests = prev.totalGuests;
            if (newTotalVIP && newTotalRegular) {
              const vipNum = parseInt(newTotalVIP) || 0;
              const regularNum = parseInt(newTotalRegular) || 0;
              newTotalGuests = (vipNum + regularNum).toString();
            }
            return { ...prev, totalVIP: newTotalVIP, totalGuests: newTotalGuests };
          });
        }} /></div>
        <div className="form-group"><label>
  Regular 
  <span className="required-asterisk">*</span>
</label><input value={p1.totalRegular} onChange={(e) => {
          const regularValue = e.target.value;
          setP1((prev) => {
            const newTotalRegular = regularValue;
            const newTotalVIP = prev.totalVIP;
            let newTotalGuests = prev.totalGuests;
            if (newTotalVIP && newTotalRegular) {
              const vipNum = parseInt(newTotalVIP) || 0;
              const regularNum = parseInt(newTotalRegular) || 0;
              newTotalGuests = (vipNum + regularNum).toString();
            }
            return { ...prev, totalRegular: newTotalRegular, totalGuests: newTotalGuests };
          });
        }} /></div>
        <div className="form-group">
          <label>
  Total No. of Guests 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.totalGuests} readOnly className={errors.totalGuests ? 'invalid-input' : ''} />
          {errors.totalGuests && <div className="validation-error">{errors.totalGuests}</div>}
        </div>
      </div>
      <h4>Set Up</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Theme Set-up 
  <span className="required-asterisk">*</span>
</label><input value={p1.themeSetup} onChange={(e)=>setP1({...p1, themeSetup:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Color Motif 
  <span className="required-asterisk">*</span>
</label><input value={p1.colorMotif} onChange={(e)=>setP1({...p1, colorMotif:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row four">
        <div className="form-group">
          <label>
  VIP Table Type 
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.vipTableType} onChange={(e)=>setP1({...p1, vipTableType:e.target.value})}>
            <option value="">Select Type</option>
            <option value="Round Table">Round Table</option>
            <option value="Rectangle Table">Rectangle Table</option>
            <option value="Big Round Table">Big Round Table</option>
            <option value="Long Rectangle Table">Long Rectangle Table</option>
          </select>
        </div>
        <div className="form-group">
          <label>
  VIP Seats per Table 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.vipTableSeats ? `${p1.vipTableSeats} Seater` : ''} readOnly />
        </div>
        <div className="form-group">
          <label>
  VIP Table Quantity 
  <span className="required-asterisk">*</span>
</label>
          <input type="number" value={p1.vipTableQuantity} onChange={(e)=>setP1({...p1, vipTableQuantity:e.target.value})} />
        </div>
        <div className="form-group">
          <label>
  Regular Table Type 
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.regularTableType} onChange={(e)=>setP1({...p1, regularTableType:e.target.value})}>
            <option value="">Select Type</option>
            <option value="Round Table">Round Table</option>
            <option value="Rectangle Table">Rectangle Table</option>
            <option value="Big Round Table">Big Round Table</option>
            <option value="Long Rectangle Table">Long Rectangle Table</option>
          </select>
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>
  Regular Seats per Table 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.regularTableSeats ? `${p1.regularTableSeats} Seater` : ''} readOnly />
        </div>
        <div className="form-group">
          <label>
  Regular Table Quantity 
  <span className="required-asterisk">*</span>
</label>
          <input type="number" value={p1.regularTableQuantity} onChange={(e)=>setP1({...p1, regularTableQuantity:e.target.value})} />
        </div>
      </div>

      <div className="form-row three">
        <div className="form-group"><label>
  VIP Underliner 
  <span className="required-asterisk">*</span>
</label><input value={p1.vipUnderliner} onChange={(e)=>setP1({...p1, vipUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>VIP Topper</label><input value={p1.vipTopper} onChange={(e)=>setP1({...p1, vipTopper:e.target.value})} /></div>
        <div className="form-group"><label>
  VIP Napkin 
  <span className="required-asterisk">*</span>
</label><input value={p1.vipNapkin} onChange={(e)=>setP1({...p1, vipNapkin:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>
  Guest Underliner 
  <span className="required-asterisk">*</span>
</label><input value={p1.guestUnderliner} onChange={(e)=>setP1({...p1, guestUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>Guest Topper</label><input value={p1.guestTopper} onChange={(e)=>setP1({...p1, guestTopper:e.target.value})} /></div>
        <div className="form-group"><label>
  Guest Napkin 
  <span className="required-asterisk">*</span>
</label><input value={p1.guestNapkin} onChange={(e)=>setP1({...p1, guestNapkin:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p1.setupRemarks} onChange={(e)=>setP1({...p1, setupRemarks:e.target.value})} /></div>
    </div>
  );

  const renderPage2 = () => (
    <div className="page">
      <h4>Chairs</h4>
      <div className="form-row five">
        <div className="form-group"><label>Monoblock <span className="required-asterisk">*</span></label><input value={p2.chairsMonoblock} onChange={(e)=>setP2({...p2, chairsMonoblock:e.target.value})} /></div>
        <div className="form-group"><label>Rustic <span className="required-asterisk">*</span></label><input value={p2.chairsRustic} onChange={(e)=>setP2({...p2, chairsRustic:e.target.value})} /></div>
        <div className="form-group"><label>Tiffany <span className="required-asterisk">*</span></label><input value={p2.chairsTiffany} onChange={(e)=>setP2({...p2, chairsTiffany:e.target.value})} /></div>
        <div className="form-group"><label>Premium <span className="required-asterisk">*</span></label><input value={p2.premiumChairs} onChange={(e)=>setP2({...p2, premiumChairs:e.target.value})} /></div>
        <div className="form-group"><label>Crystal <span className="required-asterisk">*</span></label><input value={p2.chairsCrystal} onChange={(e)=>setP2({...p2, chairsCrystal:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Total Chairs <span className="required-asterisk">*</span></label><input value={p2.totalChairs} readOnly /></div>
      </div>
      {errors.chairsSum && <div className="validation-error">{errors.chairsSum}</div>}
      <div className="form-group"><label>Remarks</label><textarea value={p2.chairsRemarks} onChange={(e)=>setP2({...p2, chairsRemarks:convertToUppercase(e.target.value)})} /></div>

      <h4>Flower Arrangement</h4>
      <div className="form-row two">
        <div className="form-group"><label>Backdrop</label><input value={p2.flowerBackdrop} onChange={(e)=>setP2({...p2, flowerBackdrop:e.target.value})} /></div>
        <div className="form-group"><label>VIP Centerpiece</label><input value={p2.flowerVipCenterpiece} onChange={(e)=>setP2({...p2, flowerVipCenterpiece:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Guest Centerpiece</label><input value={p2.flowerGuestCenterpiece} onChange={(e)=>setP2({...p2, flowerGuestCenterpiece:e.target.value})} /></div>
        <div className="form-group"><label>Cake Table</label><input value={p2.flowerCakeTable} onChange={(e)=>setP2({...p2, flowerCakeTable:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p2.flowerRemarks} onChange={(e)=>setP2({...p2, flowerRemarks:e.target.value})} /></div>

      <h4>Other Special Requirements</h4>
      <div className="form-row two">
        <div className="form-group"><label>Cake Name/Code</label><input value={p2.cakeNameCode} onChange={(e)=>setP2({...p2, cakeNameCode:e.target.value})} /></div>
        <div className="form-group"><label>Flavor</label><input value={p2.cakeFlavor} onChange={(e)=>setP2({...p2, cakeFlavor:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Supplier</label><input value={p2.cakeSupplier} onChange={(e)=>setP2({...p2, cakeSupplier:e.target.value})} /></div>
        <div className="form-group"><label>Cake Specifications</label><input value={p2.cakeSpecifications} onChange={(e)=>setP2({...p2, cakeSpecifications:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Celebrator's Car</label><input value={p2.celebratorsCar} onChange={(e)=>setP2({...p2, celebratorsCar:e.target.value})} /></div>
        <div className="form-group"><label>Emcee</label><input value={p2.emcee} onChange={(e)=>setP2({...p2, emcee:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Sound System</label><input value={p2.soundSystem} onChange={(e)=>setP2({...p2, soundSystem:e.target.value})} /></div>
        <div className="form-group"><label>Tent</label><input value={p2.tent} onChange={(e)=>setP2({...p2, tent:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Celebrator's Chair</label><input value={p2.celebratorsChair} onChange={(e)=>setP2({...p2, celebratorsChair:e.target.value})} /></div>
    
      <h4>How did you know our company? <span className="required-asterisk">*</span></h4>
      <div className="checkbox-grid">
        {[
          ["knowUsWebsite","Website"],
          ["knowUsFacebook","Facebook"],
          ["knowUsInstagram","Instagram"],
          ["knowUsFlyers","Flyers"],
          ["knowUsBillboard","Billboard Ad"],
          ["knowUsWordOfMouth","Word of Mouth"],
          ["knowUsVenueReferral","Venue Referral"],
          ["knowUsRepeatClient","Repeat Client"],
          ["knowUsBridalFair","Bridal Fair / Exhibit"],
          ["knowUsFoodTasting","Food Tasting"],
          ["knowUsCelebrityReferral","Celebrity Referral"],
          ["knowUsOthers","Others"],
        ].map(([key, label]) => (
          <label key={key} className="checkbox-item">
            <input type="checkbox" checked={p2[key]} onChange={(e)=>setP2({...p2, [key]: e.target.checked})} /> {label}
          </label>
        ))}
      </div>
    </div>
  );

  const renderPage3 = () => {
  if (p1.serviceStyle !== "Buffet") return null;

  const handlePackageSelect = (packageName) => {
    setPBuffet(prev => ({ ...prev, selectedPackage: packageName }));
  };

  const guests = parseInt(p1.totalGuests) || 0;

  const packages = [
    {
      name: "Buffet Package 1",
      option: "BUFFET PACKAGE 1",
      pricing: [
        { pax: "300 pax", price: "2,145.00" },
        { pax: "250 pax", price: "2,200.00" },
        { pax: "200 pax", price: "2,275.00" },
        { pax: "150 pax", price: "2,390.00" },
        { pax: "100 pax", price: "2,800.00" }
      ],
      menu: [
        "2 Cocktail Hours",
        "1 Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "1 Beef or Pork",
            "1 Fish or Seafood",
            "1 Chicken",
            "1 Pasta or Noodles or Vegetables"
          ]
        },
        "1 Rice",
        "1 Dessert",
        "2 Drinks"
      ]
    },
    {
      name: "Buffet Package 2",
      option: "BUFFET PACKAGE 2",
      pricing: [
        { pax: "300 pax", price: "2,245.00" },
        { pax: "250 pax", price: "2,295.00" },
        { pax: "200 pax", price: "2,370.00" },
        { pax: "150 pax", price: "2,475.00" },
        { pax: "100 pax", price: "2,890.00" }
      ],
      menu: [
        "2 Cocktail Hours",
        "1 Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "1 Beef or Pork",
            "1 Fish or Seafood",
            "1 Chicken",
            "1 Pasta or Noodles",
            "1 Vegetables"
          ]
        },
        "1 Rice",
        "2 Dessert",
        "2 Drinks"
      ]
    },
    {
      name: "Buffet Package 3",
      option: "BUFFET PACKAGE 3",
      pricing: [
        { pax: "300 pax", price: "2,380.00" },
        { pax: "250 pax", price: "2,435.00" },
        { pax: "200 pax", price: "2,510.00" },
        { pax: "150 pax", price: "2,610.00" },
        { pax: "100 pax", price: "3,030.00" }
      ],
      menu: [
        "2 Cocktail Hours",
        "1 Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "1 Beef",
            "1 Pork",
            "1 Fish or Seafood",
            "1 Chicken",
            "1 Pasta or Noodles",
            "1 Vegetables"
          ]
        },
        "1 Rice",
        "2 Dessert",
        "2 Drinks"
      ]
    }
  ];

  const amenities = [
    "An elevated platform for the couple/celebrant",
    "A wide array of linens to match your color palette",
    "Tiffany chairs or rustic folding chairs for style and elegance (to check availability upon confirmation)",
    "Elegantly dressed up dining tables with table numbers",
    "Table setting and physical arrangement meticulously done by professionals",
    "Buffet with food labels that is set to impress",
    "Exquisitely dress-up tables for gifts, cake, registration and giveaways",
    "A bottle of Sparkling Wine for the bridal toast to spice up the celebration",
    "Debut Amenities (18 roses, 18 candles, and a Bouquet for the Debutant)",
    "Cordial and professional waiters to serve the food"
  ];

  return (
    <div className="page buffet-page">
      <div className="buffet-container">
        
        {/* Package Cards */}
        <div className="buffet-packages-wrapper">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`buffet-package-card ${pBuffet.selectedPackage === pkg.name ? 'selected' : ''}`}
              onClick={() => handlePackageSelect(pkg.name)}
            >
              {/* Header */}
              <div className="buffet-package-header">
                <h2 className="buffet-option-title">{pkg.option}</h2>
              </div>

        {/* Content */}
        <div className="buffet-package-content">
          {/* Price per Pax */}
          <div className="buffet-section">
            <h3 className="buffet-section-title">Price per pax</h3>
            <div className="buffet-pricing-list">
              {(() => {
                const tiers = pkg.pricing;
                const applicableTier = tiers.find(t => guests >= parseInt(t.pax.split(' ')[0])) || tiers[tiers.length - 1];
                return pkg.pricing.map((item, i) => (
                  <div key={i} className={`buffet-price-item ${pBuffet.selectedPackage === pkg.name && item.price === applicableTier.price ? 'highlighted' : ''}`}>
                    <strong>₱ {item.price}</strong> per pax
                  </div>
                ));
              })()}
            </div>
          </div>

                {/* Minimum of */}
                <div className="buffet-section">
                  <h3 className="buffet-section-title">Minimum of</h3>
                  <div className="buffet-pricing-list">
                    {pkg.pricing.map((item, i) => (
                      <div key={i} className="buffet-price-item">
                        {item.pax}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu Inclusions */}
                <div className="buffet-section">
                  <h3 className="buffet-section-title">Menu inclusions:</h3>
                  <div className="buffet-menu-list">
                    {pkg.menu.map((item, i) => {
                      if (typeof item === 'object' && item.title) {
                        return (
                          <div key={i} className="buffet-menu-item">
                            <div className="buffet-menu-subheader">{item.title}</div>
                            <div className="buffet-menu-choice">{item.choiceOf}</div>
                            <ul className="buffet-menu-items">
                              {item.items.map((subItem, j) => (
                                <li key={j}>{subItem}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="buffet-menu-item">{item}</div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="buffet-package-footer">
                <p className="buffet-vat-notice">
                  Plus 10% Service Charge<br />
                  Exclusive of 12% VAT
                </p>
                <label className="buffet-select-label" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="package"
                    checked={pBuffet.selectedPackage === pkg.name}
                    onChange={() => handlePackageSelect(pkg.name)}
                    className="buffet-radio"
                  />
                  <span className="buffet-select-text">
                    {pBuffet.selectedPackage === pkg.name ? '✓ Selected' : `Select ${pkg.option}`}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Amenities Section */}
        <div className="buffet-amenities-card">
          <div className="buffet-amenities-header">
            <h2 className="buffet-option-title">PACKAGE AMENITIES</h2>
          </div>

          <div className="buffet-amenities-content">
            <div className="buffet-amenities-grid">
              {amenities.map((amenity, idx) => (
                <div key={idx} className="buffet-amenity-item">
                  <span className="buffet-bullet">•</span>
                  <p className="buffet-amenity-text">{amenity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {errors.selectedPackage && (
        <div className="buffet-validation-error">
          <strong> {errors.selectedPackage}</strong>
        </div>
      )}
    </div>
  );
};

  const renderPage4 = () => {
    if (p1.serviceStyle !== "Buffet") return null;

  const totalCocktailSelections = (pBuffet.cocktailSelections || []).length + (pBuffet.upgradeSelections125 || []).length + (pBuffet.upgradeSelections150 || []).length;

  const handleCocktailChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.cocktailSelections || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalCocktailSelections < cocktailLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, cocktailSelections: selections };
    });
  };

  const handleUpgrade125Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.upgradeSelections125 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalCocktailSelections < cocktailLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, upgradeSelections125: selections };
    });
  };

  const handleUpgrade150Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.upgradeSelections150 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalCocktailSelections < cocktailLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, upgradeSelections150: selections };
    });
  };

  const handleFoodStationChange = (station) => {
    setPBuffet(prev => {
      const isSelected = prev.foodStations.some(s => s.name === station.name);
      const currentCount = (prev.foodStations || []).length;
      const limit = menuLimits.foodStations || 999;
      
      let newSelections;
      if (isSelected) {
        newSelections = prev.foodStations.filter(s => s.name !== station.name);
      } else if (currentCount < limit) {
        newSelections = [...prev.foodStations, station];
      } else {
        return prev; // Don't allow selection if limit reached
      }
      return { ...prev, foodStations: newSelections };
    });
  };

  const handleSoupChange = (option) => {
    setPBuffet(prev => {
      const currentSoup = prev.soupSelections || [];
      const currentUpgrade = prev.upgradeSoupSelections100 || [];
      const totalSoup = currentSoup.length + currentUpgrade.length;
      const limit = 1; // Corrected limit
      const selections = currentSoup.includes(option)
        ? currentSoup.filter(s => s !== option)
        : totalSoup < limit ? [...currentSoup, option] : currentSoup;
      return { ...prev, soupSelections: selections };
    });
  };

  const handleUpgradeSoupChange = (option) => {
    setPBuffet(prev => {
      const currentSoup = prev.soupSelections || [];
      const currentUpgrade = prev.upgradeSoupSelections100 || [];
      const totalSoup = currentSoup.length + currentUpgrade.length;
      const limit = 1; // Corrected limit
      const selections = currentUpgrade.includes(option)
        ? currentUpgrade.filter(s => s !== option)
        : totalSoup < limit ? [...currentUpgrade, option] : currentUpgrade;
      return { ...prev, upgradeSoupSelections100: selections };
    });
  };

  const handleMainBeefChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainBeefSelections || [];
      const pkg = pBuffet.selectedPackage;
      
      // Calculate current counts
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        // Beef OR Pork combined limit of 1
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        // Beef separate limit of 1
        canAdd = beefCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainBeefSelections: selections };
    });
  };

  const handleBeefUpgrade100Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.beefUpgradeSelections100 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = beefCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, beefUpgradeSelections100: selections };
    });
  };
  
  const handleBeefUpgrade125Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.beefUpgradeSelections125 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = beefCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, beefUpgradeSelections125: selections };
    });
  };
  
  const handleBeefUpgrade500Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.beefUpgradeSelections500 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = beefCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, beefUpgradeSelections500: selections };
    });
  };
  
  const handleBeefUpgrade1100Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.beefUpgradeSelections1100 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = beefCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, beefUpgradeSelections1100: selections };
    });
  };

  const handleMainPorkChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainPorkSelections || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = porkCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainPorkSelections: selections };
    });
  };

  const handlePorkUpgrade200Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.porkUpgradeSelections200 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = porkCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, porkUpgradeSelections200: selections };
    });
  };
  
  const handlePorkUpgrade250Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.porkUpgradeSelections250 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = porkCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, porkUpgradeSelections250: selections };
    });
  };
  
  const handlePorkUpgrade275Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.porkUpgradeSelections275 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = porkCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, porkUpgradeSelections275: selections };
    });
  };
  
  const handlePorkUpgrade15000Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.porkUpgradeSelections15000 || [];
      const pkg = pBuffet.selectedPackage;
      
      const beefCount = (prev.mainBeefSelections || []).length + 
                        (prev.beefUpgradeSelections100 || []).length +
                        (prev.beefUpgradeSelections125 || []).length +
                        (prev.beefUpgradeSelections500 || []).length +
                        (prev.beefUpgradeSelections1100 || []).length;
      const porkCount = (prev.mainPorkSelections || []).length +
                        (prev.porkUpgradeSelections200 || []).length +
                        (prev.porkUpgradeSelections250 || []).length +
                        (prev.porkUpgradeSelections275 || []).length +
                        (prev.porkUpgradeSelections15000 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1" || pkg === "Buffet Package 2") {
        canAdd = (beefCount + porkCount) < 1;
      } else if (pkg === "Buffet Package 3") {
        canAdd = porkCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, porkUpgradeSelections15000: selections };
    });
  };

  const handleMainFishChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainFishSelections || [];
      
      // Fish OR Seafood combined limit of 1 for all packages
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainFishSelections: selections };
    });
  };

  const handleFishUpgrade200Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.fishUpgradeSelections200 || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, fishUpgradeSelections200: selections };
    });
  };
  
  const handleFishUpgrade225Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.fishUpgradeSelections225 || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, fishUpgradeSelections225: selections };
    });
  };

  const handleMainSeafoodChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainSeafoodSelections || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainSeafoodSelections: selections };
    });
  };

  const handleSeafoodUpgrade200Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.seafoodUpgradeSelections200 || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, seafoodUpgradeSelections200: selections };
    });
  };
  
  const handleSeafoodUpgrade235Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.seafoodUpgradeSelections235 || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, seafoodUpgradeSelections235: selections };
    });
  };
  
  const handleSeafoodUpgrade335Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.seafoodUpgradeSelections335 || [];
      
      const fishCount = (prev.mainFishSelections || []).length +
                        (prev.fishUpgradeSelections200 || []).length +
                        (prev.fishUpgradeSelections225 || []).length;
      const seafoodCount = (prev.mainSeafoodSelections || []).length +
                           (prev.seafoodUpgradeSelections200 || []).length +
                           (prev.seafoodUpgradeSelections235 || []).length +
                           (prev.seafoodUpgradeSelections335 || []).length;
      
      const canAdd = (fishCount + seafoodCount) < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, seafoodUpgradeSelections335: selections };
    });
  };
  

  const handleMainChickenChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainChickenSelections || [];
      
      // Chicken limit of 1 for all packages
      const chickenCount = (prev.mainChickenSelections || []).length +
                           (prev.chickenUpgradeSelections95 || []).length +
                           (prev.chickenUpgradeSelections100 || []).length +
                           (prev.chickenUpgradeSelections110 || []).length;
      
      const canAdd = chickenCount < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainChickenSelections: selections };
    });
  };

  const handleChickenUpgrade95Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.chickenUpgradeSelections95 || [];
      
      const chickenCount = (prev.mainChickenSelections || []).length +
                           (prev.chickenUpgradeSelections95 || []).length +
                           (prev.chickenUpgradeSelections100 || []).length +
                           (prev.chickenUpgradeSelections110 || []).length;
      
      const canAdd = chickenCount < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, chickenUpgradeSelections95: selections };
    });
  };
  
  const handleChickenUpgrade100Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.chickenUpgradeSelections100 || [];
      
      const chickenCount = (prev.mainChickenSelections || []).length +
                           (prev.chickenUpgradeSelections95 || []).length +
                           (prev.chickenUpgradeSelections100 || []).length +
                           (prev.chickenUpgradeSelections110 || []).length;
      
      const canAdd = chickenCount < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, chickenUpgradeSelections100: selections };
    });
  };
  
  const handleChickenUpgrade110Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.chickenUpgradeSelections110 || [];
      
      const chickenCount = (prev.mainChickenSelections || []).length +
                           (prev.chickenUpgradeSelections95 || []).length +
                           (prev.chickenUpgradeSelections100 || []).length +
                           (prev.chickenUpgradeSelections110 || []).length;
      
      const canAdd = chickenCount < 1;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, chickenUpgradeSelections110: selections };
    });
  };
  

  const handleMainPastaChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainPastaSelections || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        // Pasta OR Noodles OR Vegetables combined limit of 1
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        // Pasta OR Noodles combined limit of 1 (Vegetables separate)
        canAdd = (pastaCount + noodlesCount) < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainPastaSelections: selections };
    });
  };

  const handlePastaUpgrade150Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.pastaUpgradeSelections150 || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = (pastaCount + noodlesCount) < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, pastaUpgradeSelections150: selections };
    });
  };

  const handleMainNoodlesChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainNoodlesSelections || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = (pastaCount + noodlesCount) < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainNoodlesSelections: selections };
    });
  };

  const handleMainVegChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.mainVegSelections || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        // Vegetables separate limit of 1
        canAdd = vegCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, mainVegSelections: selections };
    });
  };

  const handleVegUpgrade50Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.vegUpgradeSelections50 || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = vegCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, vegUpgradeSelections50: selections };
    });
  };
  
  const handleVegUpgrade60Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.vegUpgradeSelections60 || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = vegCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, vegUpgradeSelections60: selections };
    });
  };
  
  const handleVegUpgrade75Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.vegUpgradeSelections75 || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = vegCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, vegUpgradeSelections75: selections };
    });
  };
  
  const handleVegUpgrade650Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.vegUpgradeSelections650 || [];
      const pkg = pBuffet.selectedPackage;
      
      const pastaCount = (prev.mainPastaSelections || []).length +
                         (prev.pastaUpgradeSelections150 || []).length;
      const noodlesCount = (prev.mainNoodlesSelections || []).length;
      const vegCount = (prev.mainVegSelections || []).length +
                       (prev.vegUpgradeSelections50 || []).length +
                       (prev.vegUpgradeSelections60 || []).length +
                       (prev.vegUpgradeSelections75 || []).length +
                       (prev.vegUpgradeSelections650 || []).length;
      
      let canAdd = false;
      if (pkg === "Buffet Package 1") {
        canAdd = (pastaCount + noodlesCount + vegCount) < 1;
      } else if (pkg === "Buffet Package 2" || pkg === "Buffet Package 3") {
        canAdd = vegCount < 1;
      }
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : canAdd ? [...currentSelections, option] : currentSelections;
      return { ...prev, vegUpgradeSelections650: selections };
    });
  };

  const handleRiceChange = (option) => {
  setPBuffet(prev => {
    const currentSelections = prev.riceSelections || [];

    // Rice limit of 1 for all packages
    const riceCount = (prev.riceSelections || []).length +
                      (prev.riceUpgradeSelections50 || []).length +
                      (prev.riceUpgradeSelections95 || []).length +
                      (prev.riceUpgradeSelections110 || []).length;

    const canAdd = riceCount < 1;

    const selections = currentSelections.includes(option)
      ? currentSelections.filter(s => s !== option)
      : canAdd ? [...currentSelections, option] : currentSelections;
    return { ...prev, riceSelections: selections };
  });
};

const handleRiceUpgrade50Change = (option) => {
  setPBuffet(prev => {
    const currentSelections = prev.riceUpgradeSelections50 || [];
    const riceCount = (prev.riceSelections || []).length + 
                      (prev.riceUpgradeSelections50 || []).length +
                      (prev.riceUpgradeSelections95 || []).length +
                      (prev.riceUpgradeSelections110 || []).length;
    
    const canAdd = riceCount < 1;
    
    const selections = currentSelections.includes(option)
      ? currentSelections.filter(s => s !== option)
      : canAdd ? [...currentSelections, option] : currentSelections;
    return { ...prev, riceUpgradeSelections50: selections };
  });
};

const handleRiceUpgrade95Change = (option) => {
  setPBuffet(prev => {
    const currentSelections = prev.riceUpgradeSelections95 || [];
    
    const riceCount = (prev.riceSelections || []).length + 
                      (prev.riceUpgradeSelections50 || []).length +
                      (prev.riceUpgradeSelections95 || []).length +
                      (prev.riceUpgradeSelections110 || []).length;
    const canAdd = riceCount < 1;
    
    const selections = currentSelections.includes(option)
      ? currentSelections.filter(s => s !== option)
      : canAdd ? [...currentSelections, option] : currentSelections;
    return { ...prev, riceUpgradeSelections95: selections };
  });
};

const handleRiceUpgrade110Change = (option) => {
  setPBuffet(prev => {
    const currentSelections = prev.riceUpgradeSelections110 || [];
    const riceCount = (prev.riceSelections || []).length + 
                      (prev.riceUpgradeSelections50 || []).length +
                      (prev.riceUpgradeSelections95 || []).length +
                      (prev.riceUpgradeSelections110 || []).length;
    const canAdd = riceCount < 1;
    
    const selections = currentSelections.includes(option)
      ? currentSelections.filter(s => s !== option)
      : canAdd ? [...currentSelections, option] : currentSelections;
    return { ...prev, riceUpgradeSelections110: selections };
  });
};

 const handleDessertChange = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;

      const currentSelections = prev.dessertSelections || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertSelections: selections };
    });
  };

  const handleDessertUpgrade250Change = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;

      const currentSelections = prev.dessertUpgradeSelections250 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertUpgradeSelections250: selections };
    });
  };
  
  const handleDessertUpgrade300Change = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;
    
      const currentSelections = prev.dessertUpgradeSelections300 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertUpgradeSelections300: selections };
    });
  };
  
  const handleDessertUpgrade350Change = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;
    
      const currentSelections = prev.dessertUpgradeSelections350 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertUpgradeSelections350: selections };
    });
  };
  
  const handleDessertUpgrade400Change = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;
    
      const currentSelections = prev.dessertUpgradeSelections400 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertUpgradeSelections400: selections };
    });
  };
  
  const handleDessertUpgrade450Change = (option) => {
    setPBuffet(prev => {
      const totalDessertSelections = 
        (prev.dessertSelections || []).length +
        (prev.dessertUpgradeSelections250 || []).length +
        (prev.dessertUpgradeSelections300 || []).length +
        (prev.dessertUpgradeSelections350 || []).length +
        (prev.dessertUpgradeSelections400 || []).length +
        (prev.dessertUpgradeSelections450 || []).length;
    
      const currentSelections = prev.dessertUpgradeSelections450 || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDessertSelections < dessertLimit ? [...currentSelections, option] : currentSelections;
      return { ...prev, dessertUpgradeSelections450: selections };
    });
  };

  const handleDrinksChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.drinksSelections || [];
      
      // Calculate total drinks selections
      const totalDrinksSelections = 
        (prev.drinksSelections || []).length +
        (prev.drinksUpgradeSelections130 || []).length +
        (prev.drinksUpgradeSelections150 || []).length;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDrinksSelections < 2 ? [...currentSelections, option] : currentSelections;
      return { ...prev, drinksSelections: selections };
    });
  };

  const handleDrinksUpgrade130Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.drinksUpgradeSelections130 || [];
      
      const totalDrinksSelections = 
        (prev.drinksSelections || []).length +
        (prev.drinksUpgradeSelections130 || []).length +
        (prev.drinksUpgradeSelections150 || []).length;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDrinksSelections < 2 ? [...currentSelections, option] : currentSelections;
      return { ...prev, drinksUpgradeSelections130: selections };
    });
  };
  
  const handleDrinksUpgrade150Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.drinksUpgradeSelections150 || [];
      
      const totalDrinksSelections = 
        (prev.drinksSelections || []).length +
        (prev.drinksUpgradeSelections130 || []).length +
        (prev.drinksUpgradeSelections150 || []).length;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalDrinksSelections < 2 ? [...currentSelections, option] : currentSelections;
      return { ...prev, drinksUpgradeSelections150: selections };
    });
  };

  const handleOysterChange = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.oysterBarSelections || [];
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : currentSelections.length < 4 ? [...currentSelections, option] : currentSelections;
      return { ...prev, oysterBarSelections: selections };
    });
  };

  const handleAppetizer125Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.appetizerUpgradeSelections125 || [];
      const totalAppetizer = (prev.appetizerUpgradeSelections125 || []).length + 
                             (prev.appetizerUpgradeSelections150 || []).length;
      const limit = menuLimits.appetizer || 999;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalAppetizer < limit ? [...currentSelections, option] : currentSelections;
      return { ...prev, appetizerUpgradeSelections125: selections };
    });
  };

  const handleAppetizer150Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.appetizerUpgradeSelections150 || [];
      const totalAppetizer = (prev.appetizerUpgradeSelections125 || []).length + 
                             (prev.appetizerUpgradeSelections150 || []).length;
      const limit = menuLimits.appetizer || 999;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalAppetizer < limit ? [...currentSelections, option] : currentSelections;
      return { ...prev, appetizerUpgradeSelections150: selections };
    });
  };

  const handleSalad125Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.saladUpgradeSelections125 || [];
      const totalSalad = (prev.saladUpgradeSelections125 || []).length + 
                         (prev.saladUpgradeSelections150 || []).length;
      const limit = menuLimits.salad || 999;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalSalad < limit ? [...currentSelections, option] : currentSelections;
      return { ...prev, saladUpgradeSelections125: selections };
    });
  };

  const handleSalad150Change = (option) => {
    setPBuffet(prev => {
      const currentSelections = prev.saladUpgradeSelections150 || [];
      const totalSalad = (prev.saladUpgradeSelections125 || []).length + 
                         (prev.saladUpgradeSelections150 || []).length;
      const limit = menuLimits.salad || 999;
      
      const selections = currentSelections.includes(option)
        ? currentSelections.filter(s => s !== option)
        : totalSalad < limit ? [...currentSelections, option] : currentSelections;
      return { ...prev, saladUpgradeSelections150: selections };
    });
  };

    return (
      <div className="page">
        <div className="menu-section">
          <h5>Cocktail Hour</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Cocktail Selections: {totalCocktailSelections}/{cocktailLimit}</p>
          <div className="menu-grid">
            {[
              "Money Bag with Pork, Shrimp & Leeks",
              "Wrap Pork Sisig/Wrap Ala Portofino",
              "Pork Belly with Chili Caramel Sauce",
              "Cone of Caesar Salad with Bacon Bits and Anchovy Croutons",
              "Palabok Spring Rolls with Dried Smoked Fish and Salted Egg",
              "Coconut Lime Spanish Mackerel Ceviche",
              "Chicken Kebabs Skewers",
              "Baked Mussel Nicoise",
              "Chicken Express in Lemon Grass Skewers with Spicy Cream Sauce",
            ].map(option => (
              <label key={option} className="menu-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.cocktailSelections || []).includes(option)}
                  onChange={() => handleCocktailChange(option)}
                  disabled={!(pBuffet.cocktailSelections || []).includes(option) && totalCocktailSelections >= cocktailLimit}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
           <div className="menu-category">
          <h6>Upgrade Options +125 per pax</h6>
          <div className="menu-grid">
            {[
              "Tuna Tartare in Savory Cone",
              "Bacon Chives Mini Cheese Balls",
            ].map(option => (
              <label key={option} className="upgrade-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.upgradeSelections125 || []).includes(option)}
                    onChange={() => handleUpgrade125Change(option)}
                    disabled={!(pBuffet.upgradeSelections125 || []).includes(option) && totalCocktailSelections >= cocktailLimit}
                  />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="menu-category">
          <h6>Upgrade Options +150 per pax</h6>
          <div className="menu-grid">
            {[
              "Shrimp Tapas with Mango Shooters",
              "Blueberry Walnut Toast",
              "Strawberry Raisin Pine Nuts Toast",
              "Prosciutto Red Grapes Arugula Toast",
              "Heirloom Tomatoes Basil Balsamic Toast",
              "Prosciutto Wrapped Pears with Arugula and Grissini Stick",
            ].map(option => (
              <label key={option} className="upgrade-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.upgradeSelections150 || []).includes(option)}
                    onChange={() => handleUpgrade150Change(option)}
                    disabled={!(pBuffet.upgradeSelections150 || []).includes(option) && totalCocktailSelections >= cocktailLimit}
                  />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        </div>

        <div className="menu-section">
          <h5>Food Stations (Optional)</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Food Stations Selected: {getCurrentSelectionCounts.foodStations}/{menuLimits.foodStations || 1}
          </p>
          {[...new Set(FOOD_STATIONS.map(s => s.cost))].sort((a,b)=>a-b).map(cost => (
            <div key={cost} className="menu-category">
              <h6>+{cost} per pax</h6>
              <div className="menu-grid">
                {FOOD_STATIONS.filter(s => s.cost === cost).map(station => (
                  <label key={station.name} className="menu-item">
                    <input
                      type="checkbox"
                      checked={(pBuffet.foodStations || []).some(s => s.name === station.name)}
                      onChange={() => handleFoodStationChange(station)}
                      disabled={!(pBuffet.foodStations || []).some(s => s.name === station.name) && getCurrentSelectionCounts.foodStations >= (menuLimits.foodStations || 1)}
                    />
                    {station.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {pBuffet.foodStations.some(s => s.name === "Oyster Bar") && (
          <div className="menu-section">
            <h5>Oyster Bar Choices (Select 4)</h5>
            <div className="menu-grid">
              {OYSTER_BAR_OPTIONS.map(option => (
                <label key={option} className="menu-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.oysterBarSelections || []).includes(option)}
                    onChange={() => handleOysterChange(option)}
                    disabled={!(pBuffet.oysterBarSelections || []).includes(option) && (pBuffet.oysterBarSelections || []).length >= 4}
                  />
                  {option}
                </label>
              ))}
            </div>
            <p style={{fontWeight: 'bold', color: '#2196F3'}}>Oyster Selections: {(pBuffet.oysterBarSelections || []).length}/4</p>
          </div>
        )}
        </div>

        <div className="menu-section">
          <h5>Appetizer (Optional)</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Appetizer Selected: {getCurrentSelectionCounts.appetizer}/{menuLimits.appetizer || 1}
          </p>
          <div className="menu-category">
            <h6>+125 per pax</h6>
            <div className="menu-grid">
              {APPETIZER_UPGRADE_125_OPTIONS.map(option => (
                <label key={option} className="menu-item">
                 <input
                    type="checkbox"
                    checked={(pBuffet.appetizerUpgradeSelections125 || []).includes(option)}
                    onChange={() => handleAppetizer125Change(option)}
                    disabled={!(pBuffet.appetizerUpgradeSelections125 || []).includes(option) && getCurrentSelectionCounts.appetizer >= (menuLimits.appetizer || 1)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="menu-category">
            <h6>+150 per pax</h6>
            <div className="menu-grid">
              {APPETIZER_UPGRADE_150_OPTIONS.map(option => (
                <label key={option} className="menu-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.appetizerUpgradeSelections150 || []).includes(option)}
                    onChange={() => handleAppetizer150Change(option)}
                    disabled={!(pBuffet.appetizerUpgradeSelections150 || []).includes(option) && getCurrentSelectionCounts.appetizer >= (menuLimits.appetizer || 1)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="menu-section">
          <h5>Soup</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
          Soup Selections: {(pBuffet.soupSelections || []).length + (pBuffet.upgradeSoupSelections100 || []).length}/1</p>
          <div className="menu-grid">
            {SOUP_OPTIONS.map(option => (
              <label key={option} className="menu-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.soupSelections || []).includes(option)}
                  onChange={() => handleSoupChange(option)}
                  disabled={!(pBuffet.soupSelections || []).includes(option) && ((pBuffet.soupSelections || []).length + (pBuffet.upgradeSoupSelections100 || []).length) >= 1}
                />
                {option}
              </label>
            ))}
          </div>
          <div className="menu-category">
          <h6>Upgrade Options +100 per pax</h6>
          <div className="menu-grid">
            {UPGRADE_SOUP_OPTIONS.map(option => (
              <label key={option} className="upgrade-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradeSoupSelections100 || []).includes(option)}
                  onChange={() => handleUpgradeSoupChange(option)}
                  disabled={!(pBuffet.upgradeSoupSelections100 || []).includes(option) && ((pBuffet.soupSelections || []).length + (pBuffet.upgradeSoupSelections100 || []).length) >= 1}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        </div>
        
        <div className="menu-section">
          <h5>Salad (Optional)</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Salad Selected: {getCurrentSelectionCounts.salad}/{menuLimits.salad || 1}
          </p>
          <div className="menu-category">
            <h6>+125 per pax</h6>
            <div className="menu-grid">
              {SALAD_UPGRADE_125_OPTIONS.map(option => (
                <label key={option} className="menu-item">
                 <input
                    type="checkbox"
                    checked={(pBuffet.saladUpgradeSelections125 || []).includes(option)}
                    onChange={() => handleSalad125Change(option)}
                    disabled={!(pBuffet.saladUpgradeSelections125 || []).includes(option) && getCurrentSelectionCounts.salad >= (menuLimits.salad || 1)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="menu-category">
            <h6>++150 per pax</h6>
            <div className="menu-grid">
              {SALAD_UPGRADE_150_OPTIONS.map(option => (
                <label key={option} className="menu-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.saladUpgradeSelections150 || []).includes(option)}
                    onChange={() => handleSalad150Change(option)}
                    disabled={!(pBuffet.saladUpgradeSelections150 || []).includes(option) && getCurrentSelectionCounts.salad >= (menuLimits.salad || 1)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="menu-section">
          <h5>Main Entrees</h5>
          {pBuffet.selectedPackage === "Buffet Package 1" || pBuffet.selectedPackage === "Buffet Package 2" ? (
            <p style={{fontWeight: 'bold', color: '#2196F3'}}>
              Beef OR Pork Selected: {getCurrentSelectionCounts.beefPork}/{menuLimits.beefPorkCombined || 1}
            </p>
          ) : pBuffet.selectedPackage === "Buffet Package 3" ? (
            <>
              <p style={{fontWeight: 'bold', color: '#2196F3'}}>
                Beef Selected: {getCurrentSelectionCounts.beef}/{menuLimits.beef || 1}
              </p>
              <p style={{fontWeight: 'bold', color: '#2196F3'}}>
                Pork Selected: {getCurrentSelectionCounts.pork}/{menuLimits.pork || 1}
              </p>
            </>
          ) : null}
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Fish OR Seafood Selected: {getCurrentSelectionCounts.fishSeafood}/{menuLimits.fishSeafoodCombined || 1}
          </p>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Chicken Selected: {getCurrentSelectionCounts.chicken}/{menuLimits.chicken || 1}
          </p>
          {pBuffet.selectedPackage === "Buffet Package 1" ? (
            <p style={{fontWeight: 'bold', color: '#2196F3'}}>
              Pasta OR Noodles OR Vegetables Selected: {getCurrentSelectionCounts.pastaNoodlesVeg}/{menuLimits.pastaNoodlesVegCombined || 1}
            </p>
          ) : (pBuffet.selectedPackage === "Buffet Package 2" || pBuffet.selectedPackage === "Buffet Package 3") ? (
            <>
              <p style={{fontWeight: 'bold', color: '#2196F3'}}>
                Pasta OR Noodles Selected: {getCurrentSelectionCounts.pastaNoodles}/{menuLimits.pastaNoodlesCombined || 1}
              </p>
              <p style={{fontWeight: 'bold', color: '#2196F3'}}>
                Vegetables Selected: {getCurrentSelectionCounts.vegetables}/{menuLimits.vegetables || 1}
              </p>
            </>
          ) : null}
          <div className="menu-category">
            <h5>Beef</h5>
            <div className="menu-grid">
              {MAIN_BEEF_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainBeefSelections || []).includes(option);
                const isDisabled = !isChecked && (
                  (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.beef >= menuLimits.beef) ||
                  ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
                );
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainBeefChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+100 per pax</h6>
            <div className="menu-grid">
            {BEEF_UPGRADE_100_OPTIONS.map(option => {
              const isChecked = (pBuffet.beefUpgradeSelections100 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.beef >= menuLimits.beef) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                      id={`beef-upgrade-100-${option}`}
                      checked={isChecked}
                      onChange={() => handleBeefUpgrade100Change(option)}
                      disabled={isDisabled}
                      />
                      <label htmlFor={`beef-upgrade-100-${option}`}>{option}</label>
                    </div>
              );
            })}
            </div>
            </div>
            <div className="menu-category">
            <h6>+125 per pax</h6>
            <div className="menu-grid">
            {BEEF_UPGRADE_125_OPTIONS.map(option => {
              const isChecked = (pBuffet.beefUpgradeSelections125 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.beef >= menuLimits.beef) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`beef-upgrade-125-${option}`}
                    checked={isChecked}
                    onChange={() => handleBeefUpgrade125Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`beef-upgrade-125-${option}`}>{option}</label>
                </div>
              );
            })}

            </div>
            </div>

            <div className="menu-category">
            <h6>+500 per pax</h6>
            <div className="menu-grid">
            {BEEF_UPGRADE_500_OPTIONS.map(option => {
              const isChecked = (pBuffet.beefUpgradeSelections500 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.beef >= menuLimits.beef) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`beef-upgrade-500-${option}`}
                    checked={isChecked}
                    onChange={() => handleBeefUpgrade500Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`beef-upgrade-500-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+1100 per pax</h6>
            <div className="menu-grid">
            {BEEF_UPGRADE_1100_OPTIONS.map(option => {
              const isChecked = (pBuffet.beefUpgradeSelections1100 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.beef >= menuLimits.beef) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`beef-upgrade-1100-${option}`}
                    checked={isChecked}
                    onChange={() => handleBeefUpgrade1100Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`beef-upgrade-1100-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>
          

          <div className="menu-category">
            <h5>Pork</h5>
            <div className="menu-grid">
              {MAIN_PORK_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainPorkSelections || []).includes(option);
                const isDisabled = !isChecked && (
                  (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.pork >= menuLimits.pork) ||
                  ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
                );
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainPorkChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+200 per pax</h6>
            <div className="menu-grid">
            {PORK_UPGRADE_200_OPTIONS.map(option => {
              const isChecked = (pBuffet.porkUpgradeSelections200 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.pork >= menuLimits.pork) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`pork-upgrade-200-${option}`}
                    checked={isChecked}
                    onChange={() => handlePorkUpgrade200Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`pork-upgrade-200-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+250 per pax</h6>
            <div className="menu-grid">
            {PORK_UPGRADE_250_OPTIONS.map(option => {
              const isChecked = (pBuffet.porkUpgradeSelections250 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.pork >= menuLimits.pork) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`pork-upgrade-250-${option}`}
                    checked={isChecked}
                    onChange={() => handlePorkUpgrade250Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`pork-upgrade-250-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+275 per pax</h6>
            <div className="menu-grid">
            {PORK_UPGRADE_275_OPTIONS.map(option => {
              const isChecked = (pBuffet.porkUpgradeSelections275 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.pork >= menuLimits.pork) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`pork-upgrade-275-${option}`}
                    checked={isChecked}
                    onChange={() => handlePorkUpgrade275Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`pork-upgrade-275-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+15000 (good for 60-70 pax)</h6>
            <div className="menu-grid">
            {PORK_UPGRADE_15000_OPTIONS.map(option => {
              const isChecked = (pBuffet.porkUpgradeSelections15000 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 3' && getCurrentSelectionCounts.pork >= menuLimits.pork) ||
                ((pBuffet.selectedPackage === 'Buffet Package 1' || pBuffet.selectedPackage === 'Buffet Package 2') && getCurrentSelectionCounts.beefPork >= menuLimits.beefPorkCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`pork-upgrade-15000-${option}`}
                    checked={isChecked}
                    onChange={() => handlePorkUpgrade15000Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`pork-upgrade-15000-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>
          
          

          <div className="menu-category">
            <h5>Fish</h5>
            <div className="menu-grid">
              {MAIN_FISH_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainFishSelections || []).includes(option);
                const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainFishChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+200 per pax</h6>
            <div className="menu-grid">
            {FISH_UPGRADE_200_OPTIONS.map(option => {
              const isChecked = (pBuffet.fishUpgradeSelections200 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`fish-upgrade-200-${option}`}
                    checked={isChecked}
                    onChange={() => handleFishUpgrade200Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`fish-upgrade-200-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+225 per pax</h6>
            <div className="menu-grid">
            {FISH_UPGRADE_225_OPTIONS.map(option => {
              const isChecked = (pBuffet.fishUpgradeSelections225 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`fish-upgrade-225-${option}`}
                    checked={isChecked}
                    onChange={() => handleFishUpgrade225Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`fish-upgrade-225-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>

          

          <div className="menu-category">
            <h5>Seafood</h5>
            <div className="menu-grid">
              {MAIN_SEAFOOD_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainSeafoodSelections || []).includes(option);
                const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainSeafoodChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+200 per pax</h6>
            <div className="menu-grid">
            {SEAFOOD_UPGRADE_200_OPTIONS.map(option => {
              const isChecked = (pBuffet.seafoodUpgradeSelections200 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`seafood-upgrade-200-${option}`}
                    checked={isChecked}
                    onChange={() => handleSeafoodUpgrade200Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`seafood-upgrade-200-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+235 per pax</h6>
            <div className="menu-grid">
            {SEAFOOD_UPGRADE_235_OPTIONS.map(option => {
              const isChecked = (pBuffet.seafoodUpgradeSelections235 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`seafood-upgrade-235-${option}`}
                    checked={isChecked}
                    onChange={() => handleSeafoodUpgrade235Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`seafood-upgrade-235-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+335 per pax</h6>
            <div className="menu-grid">
            {SEAFOOD_UPGRADE_335_OPTIONS.map(option => {
              const isChecked = (pBuffet.seafoodUpgradeSelections335 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.fishSeafood >= menuLimits.fishSeafoodCombined;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`seafood-upgrade-335-${option}`}
                    checked={isChecked}
                    onChange={() => handleSeafoodUpgrade335Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`seafood-upgrade-335-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>

          

          <div className="menu-category">
            <h5>Chicken</h5>
            <div className="menu-grid">
              {MAIN_CHICKEN_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainChickenSelections || []).includes(option);
                const isDisabled = !isChecked && getCurrentSelectionCounts.chicken >= menuLimits.chicken;
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainChickenChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+95 per pax</h6>
            <div className="menu-grid">
            {CHICKEN_UPGRADE_95_OPTIONS.map(option => {
              const isChecked = (pBuffet.chickenUpgradeSelections95 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.chicken >= menuLimits.chicken;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`chicken-upgrade-95-${option}`}
                    checked={isChecked}
                    onChange={() => handleChickenUpgrade95Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`chicken-upgrade-95-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+100 per pax</h6>
            <div className="menu-grid">
            {CHICKEN_UPGRADE_100_OPTIONS.map(option => {
              const isChecked = (pBuffet.chickenUpgradeSelections100 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.chicken >= menuLimits.chicken;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`chicken-upgrade-100-${option}`}
                    checked={isChecked}
                    onChange={() => handleChickenUpgrade100Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`chicken-upgrade-100-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+110 per pax</h6>
            <div className="menu-grid">
            {CHICKEN_UPGRADE_110_OPTIONS.map(option => {
              const isChecked = (pBuffet.chickenUpgradeSelections110 || []).includes(option);
              const isDisabled = !isChecked && getCurrentSelectionCounts.chicken >= menuLimits.chicken;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`chicken-upgrade-110-${option}`}
                    checked={isChecked}
                    onChange={() => handleChickenUpgrade110Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`chicken-upgrade-110-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>

          <div className="menu-category">
            <h5>Pasta</h5>
            <div className="menu-grid">
              {MAIN_PASTA_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainPastaSelections || []).includes(option);
                const isDisabled = !isChecked && (
                  (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                  ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.pastaNoodles >= menuLimits.pastaNoodlesCombined)
                );
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainPastaChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <div className="menu-category">
            <h6>+150 per pax</h6>
            <div className="menu-grid">
            {PASTA_UPGRADE_150_OPTIONS.map(option => {
              const isChecked = (pBuffet.pastaUpgradeSelections150 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.pastaNoodles >= menuLimits.pastaNoodlesCombined)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`pasta-upgrade-150-${option}`}
                    checked={isChecked}
                    onChange={() => handlePastaUpgrade150Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`pasta-upgrade-150-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
          </div>

          <div className="menu-category">
            <h5>Noodles</h5>
            <div className="menu-grid">
              {MAIN_NOODLES_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainNoodlesSelections || []).includes(option);
                const isDisabled = !isChecked && (
                  (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                  ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.pastaNoodles >= menuLimits.pastaNoodlesCombined)
                );
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainNoodlesChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="menu-category">
            <h5>Vegetables</h5>
            <div className="menu-grid">
              {MAIN_VEG_OPTIONS.map(option => {
                const isChecked = (pBuffet.mainVegSelections || []).includes(option);
                const isDisabled = !isChecked && (
                  (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                  ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.vegetables >= menuLimits.vegetables)
                );
                return (
                  <label key={option} className="menu-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMainVegChange(option)}
                      disabled={isDisabled}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="menu-category">
            <h6>+50 per pax</h6>
            <div className="menu-grid">
            {VEG_UPGRADE_50_OPTIONS.map(option => {
              const isChecked = (pBuffet.vegUpgradeSelections50 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.vegetables >= menuLimits.vegetables)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`veg-upgrade-50-${option}`}
                    checked={isChecked}
                    onChange={() => handleVegUpgrade50Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`veg-upgrade-50-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+60 per pax</h6>
            <div className="menu-grid">
            {VEG_UPGRADE_60_OPTIONS.map(option => {
              const isChecked = (pBuffet.vegUpgradeSelections60 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.vegetables >= menuLimits.vegetables)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`veg-upgrade-60-${option}`}
                    checked={isChecked}
                    onChange={() => handleVegUpgrade60Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`veg-upgrade-60-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+75 per pax</h6>
            <div className="menu-grid">
            {VEG_UPGRADE_75_OPTIONS.map(option => {
              const isChecked = (pBuffet.vegUpgradeSelections75 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.vegetables >= menuLimits.vegetables)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`veg-upgrade-75-${option}`}
                    checked={isChecked}
                    onChange={() => handleVegUpgrade75Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`veg-upgrade-75-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
            <div className="menu-category">
            <h6>+650 per pax</h6>
            <div className="menu-grid">
            {VEG_UPGRADE_650_OPTIONS.map(option => {
              const isChecked = (pBuffet.vegUpgradeSelections650 || []).includes(option);
              const isDisabled = !isChecked && (
                (pBuffet.selectedPackage === 'Buffet Package 1' && getCurrentSelectionCounts.pastaNoodlesVeg >= menuLimits.pastaNoodlesVegCombined) ||
                ((pBuffet.selectedPackage === 'Buffet Package 2' || pBuffet.selectedPackage === 'Buffet Package 3') && getCurrentSelectionCounts.vegetables >= menuLimits.vegetables)
              );
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`veg-upgrade-650-${option}`}
                    checked={isChecked}
                    onChange={() => handleVegUpgrade650Change(option)}
                    disabled={isDisabled}
                  />
                  <label htmlFor={`veg-upgrade-650-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
        </div>

       <div className="menu-section">
  <h5>Rice</h5>
  <p style={{fontWeight: 'bold', color: '#2196F3'}}>
    Rice Selected: {((pBuffet.riceSelections || []).length + (pBuffet.riceUpgradeSelections50 || []).length + (pBuffet.riceUpgradeSelections95 || []).length + (pBuffet.riceUpgradeSelections110 || []).length)}/1
  </p>
  <div className="menu-grid">
    {RICE_OPTIONS.map(option => {
      const totalRiceCount = ((pBuffet.riceSelections || []).length + (pBuffet.riceUpgradeSelections50 || []).length + (pBuffet.riceUpgradeSelections95 || []).length + (pBuffet.riceUpgradeSelections110 || []).length);
      const isChecked = (pBuffet.riceSelections || []).includes(option);
      return (
        <label key={option} className="menu-item">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleRiceChange(option)}
            disabled={!isChecked && totalRiceCount >= 1}
          />
          {option}
        </label>
      );
    })}
    
  </div>
  <div className="menu-category">
    <h6>+50 per pax</h6>
    <div className="menu-grid">
      {RICE_UPGRADE_50_OPTIONS.map(option => {
        const totalRiceCount = ((pBuffet.riceSelections || []).length + (pBuffet.riceUpgradeSelections50 || []).length + (pBuffet.riceUpgradeSelections95 || []).length + (pBuffet.riceUpgradeSelections110 || []).length);
        const isChecked = (pBuffet.riceUpgradeSelections50 || []).includes(option);
        return (
          <div key={option}>
            <input
              type="checkbox"
              id={`rice-upgrade-50-${option}`}
              checked={isChecked}
              onChange={() => handleRiceUpgrade50Change(option)}
              disabled={!isChecked && totalRiceCount >= 1}
            />
            <label htmlFor={`rice-upgrade-50-${option}`}>{option}</label>
          </div>
        );
      })}
    </div>
  </div>

  <div className="menu-category">
    <h6>+95 per pax</h6>
    <div className="menu-grid">
      {RICE_UPGRADE_95_OPTIONS.map(option => {
        const totalRiceCount = ((pBuffet.riceSelections || []).length + (pBuffet.riceUpgradeSelections50 || []).length + (pBuffet.riceUpgradeSelections95 || []).length + (pBuffet.riceUpgradeSelections110 || []).length);
        const isChecked = (pBuffet.riceUpgradeSelections95 || []).includes(option);
        return (
          <div key={option}>
            <input
              type="checkbox"
              id={`rice-upgrade-95-${option}`}
              checked={isChecked}
              onChange={() => handleRiceUpgrade95Change(option)}
              disabled={!isChecked && totalRiceCount >= 1}
            />
            <label htmlFor={`rice-upgrade-95-${option}`}>{option}</label>
          </div>
        );
      })}
    </div>
  </div>

  <div className="menu-category">
    <h6>+110 per pax</h6>
    <div className="menu-grid">
      {RICE_UPGRADE_110_OPTIONS.map(option => {
        const totalRiceCount = ((pBuffet.riceSelections || []).length + (pBuffet.riceUpgradeSelections50 || []).length + (pBuffet.riceUpgradeSelections95 || []).length + (pBuffet.riceUpgradeSelections110 || []).length);
        const isChecked = (pBuffet.riceUpgradeSelections110 || []).includes(option);
        return (
          <div key={option}>
            <input
              type="checkbox"
              id={`rice-upgrade-110-${option}`}
              checked={isChecked}
              onChange={() => handleRiceUpgrade110Change(option)}
              disabled={!isChecked && totalRiceCount >= 1}
            />
            <label htmlFor={`rice-upgrade-110-${option}`}>{option}</label>
          </div>
        );
      })}
    </div>
  </div>
</div>

        <div className="menu-section">
          <h5>Dessert</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Dessert Selections: {(
              (pBuffet.dessertSelections || []).length +
              (pBuffet.dessertUpgradeSelections250 || []).length +
              (pBuffet.dessertUpgradeSelections300 || []).length +
              (pBuffet.dessertUpgradeSelections350 || []).length +
              (pBuffet.dessertUpgradeSelections400 || []).length +
              (pBuffet.dessertUpgradeSelections450 || []).length
            )}/{dessertLimit}</p>
          <div className="menu-grid">
            {DESSERT_OPTIONS.map(option => {
              const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <label key={option} className="menu-item">
                  <input
                    type="checkbox"
                    checked={(pBuffet.dessertSelections || []).includes(option)}
                    onChange={() => handleDessertChange(option)}
                    disabled={!(pBuffet.dessertSelections || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  {option}
                </label>
              );
            })}
          </div>
          <div className="menu-category">
            <h6>+250 per pax</h6>
            <div className="menu-grid">
            {DESSERT_UPGRADE_250_OPTIONS.map(option => {
              const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`dessert-upgrade-250-${option}`}
                    checked={(pBuffet.dessertUpgradeSelections250 || []).includes(option)}
                    onChange={() => handleDessertUpgrade250Change(option)}
                    disabled={!(pBuffet.dessertUpgradeSelections250 || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  <label htmlFor={`dessert-upgrade-250-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+300 per pax</h6>
            <div className="menu-grid">
            {DESSERT_UPGRADE_300_OPTIONS.map(option => {
               const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`dessert-upgrade-300-${option}`}
                    checked={(pBuffet.dessertUpgradeSelections300 || []).includes(option)}
                    onChange={() => handleDessertUpgrade300Change(option)}
                    disabled={!(pBuffet.dessertUpgradeSelections300 || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  <label htmlFor={`dessert-upgrade-300-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+350 per pax</h6>
            <div className="menu-grid">
            {DESSERT_UPGRADE_350_OPTIONS.map(option => {
              const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`dessert-upgrade-350-${option}`}
                    checked={(pBuffet.dessertUpgradeSelections350 || []).includes(option)}
                    onChange={() => handleDessertUpgrade350Change(option)}
                    disabled={!(pBuffet.dessertUpgradeSelections350 || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  <label htmlFor={`dessert-upgrade-350-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+400 per pax</h6>
            <div className="menu-grid">
            {DESSERT_UPGRADE_400_OPTIONS.map(option => {
              const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`dessert-upgrade-400-${option}`}
                    checked={(pBuffet.dessertUpgradeSelections400 || []).includes(option)}
                    onChange={() => handleDessertUpgrade400Change(option)}
                    disabled={!(pBuffet.dessertUpgradeSelections400 || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  <label htmlFor={`dessert-upgrade-400-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+450 per pax</h6>
            <div className="menu-grid">
            {DESSERT_UPGRADE_450_OPTIONS.map(option => {
              const totalDessertSelections = (pBuffet.dessertSelections || []).length + (pBuffet.dessertUpgradeSelections250 || []).length + (pBuffet.dessertUpgradeSelections300 || []).length + (pBuffet.dessertUpgradeSelections350 || []).length + (pBuffet.dessertUpgradeSelections400 || []).length + (pBuffet.dessertUpgradeSelections450 || []).length;
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`dessert-upgrade-450-${option}`}
                    checked={(pBuffet.dessertUpgradeSelections450 || []).includes(option)}
                    onChange={() => handleDessertUpgrade450Change(option)}
                    disabled={!(pBuffet.dessertUpgradeSelections450 || []).includes(option) && totalDessertSelections >= dessertLimit}
                  />
                  <label htmlFor={`dessert-upgrade-450-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
        </div>

        <div className="menu-section">
          <h5>Drinks</h5>
          <p style={{fontWeight: 'bold', color: '#2196F3'}}>
            Drinks Selections: {(pBuffet.drinksSelections || []).length + (pBuffet.drinksUpgradeSelections130 || []).length + (pBuffet.drinksUpgradeSelections150 || []).length}/2</p>
          <div className="menu-grid">
            {DRINKS_OPTIONS.map(option => {
              const totalDrinksSelections = (pBuffet.drinksSelections || []).length + (pBuffet.drinksUpgradeSelections130 || []).length + (pBuffet.drinksUpgradeSelections150 || []).length;
              const isChecked = (pBuffet.drinksSelections || []).includes(option);
              return (
                <label key={option} className="menu-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleDrinksChange(option)}
                    disabled={!isChecked && totalDrinksSelections >= 2}
                  />
                  {option}
                </label>
              );
            })}
          </div>
          <div className="menu-category">
            <h6>+130 per pax</h6>
            <div className="menu-grid">
            {DRINK_UPGRADE_130_OPTIONS.map(option => {
              const totalDrinksSelections = (pBuffet.drinksSelections || []).length + (pBuffet.drinksUpgradeSelections130 || []).length + (pBuffet.drinksUpgradeSelections150 || []).length;
              const isChecked = (pBuffet.drinksUpgradeSelections130 || []).includes(option);
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`drinks-upgrade-130-${option}`}
                    checked={isChecked}
                    onChange={() => handleDrinksUpgrade130Change(option)}
                    disabled={!isChecked && totalDrinksSelections >= 2}
                  />
                  <label htmlFor={`drinks-upgrade-130-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>

            <div className="menu-category">
            <h6>+150 per pax</h6>
            <div className="menu-grid">
            {DRINK_UPGRADE_150_OPTIONS.map(option => {
              const totalDrinksSelections = (pBuffet.drinksSelections || []).length + (pBuffet.drinksUpgradeSelections130 || []).length + (pBuffet.drinksUpgradeSelections150 || []).length;
              const isChecked = (pBuffet.drinksUpgradeSelections150 || []).includes(option);
              return (
                <div key={option}>
                  <input
                    type="checkbox"
                    id={`drinks-upgrade-150-${option}`}
                    checked={isChecked}
                    onChange={() => handleDrinksUpgrade150Change(option)}
                    disabled={!isChecked && totalDrinksSelections >= 2}
                  />
                  <label htmlFor={`drinks-upgrade-150-${option}`}>{option}</label>
                </div>
              );
            })}
           </div>
            </div>
        </div>

      </div>
    );
  };

  const renderPage5 = () => {
    // This calculates the final price per plate for display purposes.
    // It takes the base price and adds the cost of all selected upgrades.
    const basePricePerPlate = parseFloat(String(p3.pricePerPlate).replace(/,/g, '')) || 0;
    const finalPricePerPlate = basePricePerPlate + totalUpgradeCostPerPax;
    
    return (
    <div className="page">
      {/* --- MODIFIED PRICE PER PLATE SECTION --- */}
      <div className="form-group">
        <label>Price Per Plate (Calculated) <span className="required-asterisk">*</span></label>
        <input 
            value={formatNumber(finalPricePerPlate.toFixed(2))} 
            readOnly 
            className="calculated-field"
        />
        <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
            (Base: {formatNumber(p3.pricePerPlate)} + Upgrades: {formatNumber(totalUpgradeCostPerPax.toFixed(2))})
        </small>
      </div>

      <h4>Menu Details</h4>
      {/* These textareas are now readOnly because their values are set automatically */}
      <div className="form-group">
        <label>Cocktail Hour</label>
        <textarea
          value={p3.cocktailHour}
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <div className="form-group">
        <label>Food Stations</label>
        <textarea 
          value={p3.foodStations} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <h4>Main Entree and Sides</h4>
      <div className="form-group">
        <label>Appetizer</label>
        <textarea 
          value={p3.appetizer} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <div className="form-group">
        <label>Soup</label>
        <textarea 
          value={p3.soup} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <div className="form-group">
        <label>Salad</label>
        <textarea 
          value={p3.salad} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <div className="form-group">
        <label>Main Entrée</label>
        <textarea 
          value={p3.mainEntree} 
          rows={9}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
       <div className="form-group">
        <label>Rice</label>
        <textarea 
          value={p3.rice} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
      <div className="form-group">
        <label>Dessert</label>
        <textarea 
          value={p3.dessert} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>
       <div className="form-group">
        <label>Drinks</label>
        <textarea 
          value={p3.drinks} 
          rows={3}
          readOnly
          placeholder="Menu selections will appear here..."
        />
      </div>

      {/* These fields below remain editable */}
      <div className="form-row two">
        <div className="form-group">
          <label>Roasted Pig</label>
          <textarea 
            value={p3.roastedPig} 
            onChange={(e)=>setP3({...p3, roastedPig:convertToUppercase(e.target.value)})} 
            rows={2}
            placeholder="Enter roasted pig details..."
          />
        </div>
        <div className="form-group">
          <label>Roasted Calf</label>
          <textarea 
            value={p3.roastedCalf} 
            onChange={(e)=>setP3({...p3, roastedCalf:convertToUppercase(e.target.value)})} 
            rows={2}
            placeholder="Enter roasted calf details..."
          />
        </div>
      </div>

      <h4>Total Cash Layout</h4>
      <div className="form-group">
        <label>Total Menu Cost <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.totalMenuCost)} readOnly />
      </div>
      <div className="form-group">
        <label>Total Special Requirements Cost <span className="required-asterisk">*</span></label>
        <input value={p3.totalSpecialReqCost} onChange={(e)=>setP3({...p3, totalSpecialReqCost:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Mobilization Charge <span className="required-asterisk">*</span></label>
        <input value={p3.mobilizationCharge} onChange={(e)=>setP3({...p3, mobilizationCharge:e.target.value})} />
      </div>
      <div className="form-group">
        <label>TAX (12% VAT) <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.taxes)} readOnly />
      </div>
      <div className="form-group">
        <label>Service Charge (10%) <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.serviceCharge)} readOnly />
      </div>
      <div className="form-group">
        <label>Grand Total <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.grandTotal)} readOnly />
      </div>

      <h4>Payment Details</h4>
      
      <h5>Downpayment (40%)</h5>
      <div className="form-row two">
        <div className="form-group"><label>Downpayment Due On</label><input type="date" value={p3.fortyPercentDueOn} onChange={(e)=>setP3({...p3, fortyPercentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Downpayment Amount <span className="required-asterisk">*</span></label><input value={formatNumber(p3.fortyPercentAmount)} readOnly /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Downpayment Received by</label><input value={p3.fortyPercentReceivedBy} onChange={(e)=>setP3({...p3, fortyPercentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Downpayment Date Received</label><input type="date" value={p3.fortyPercentDateReceived} onChange={(e)=>setP3({...p3, fortyPercentDateReceived:e.target.value})} /></div>
      </div>

      <h5>Full Payment</h5>
      <div className="form-row two">
        <div className="form-group"><label>Remaining Balance Due On <span className="required-asterisk">*</span></label><input type="date" value={p3.fullPaymentDueOn} onChange={(e)=>setP3({...p3, fullPaymentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Remaining Balance Amount <span className="required-asterisk">*</span></label><input value={formatNumber(p3.fullPaymentAmount)} readOnly /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Remaining Balance Received By</label><input value={p3.fullPaymentReceivedBy} onChange={(e)=>setP3({...p3, fullPaymentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Remaining Balance Date Received <span className="required-asterisk">*</span></label><input type="date" value={p3.fullPaymentDateReceived} onChange={(e)=>setP3({...p3, fullPaymentDateReceived:e.target.value})} /></div>
      </div>

      <div className="form-group"><label>Remarks</label><textarea value={p3.remarks} onChange={(e)=>setP3({...p3, remarks:e.target.value})} /></div>
    </div>
  )};

  return (
    <div className="contract-form">
      <div className="form-header">
        <h3>Contract {existing ? "(Edit)" : "(New)"}</h3>
        {nextNumber && <div className="number">Contract No.: {nextNumber}</div>}
      </div>

      <form onKeyDown={(e) => { 
        // Allow Enter key in textarea fields, prevent it in other form elements
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { 
          e.preventDefault(); 
        } 
      }}>
        {activePage === 1 && renderPage1()}
        {activePage === 2 && renderPage2()}
        {activePage === 3 && (totalPages === 3 ? renderPage5() : renderPage3())}
        {activePage === 4 && (totalPages === 5 ? renderPage4() : renderPage5())}
        {activePage === 5 && renderPage5()}

      <div className="form-actions">
        <button type="button" className="btn-danger" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-secondary" onClick={async () => {
          // Save form as draft before going back
          const success = await handleSave(new Event('submit', { cancelable: true }));
          if (success) onCancel();
        }}>Back to Dashboard</button>

        <div className="pager">
          <button type="button" className="pager-btn" onClick={back} disabled={activePage === 1}>← Back</button>
          <span>Page {activePage} of {totalPages}</span>
          {activePage < totalPages ? (
            <button type="button" className="pager-btn" onClick={next}>Next →</button>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                Send for Approval
              </button>
              {!isFormValid() && <div className="validation-error">Please fill all required fields marked with *.</div>}
            </>
          )}
        </div>
      </div>
      </form>
    </div>
  );
}

export default ContractForm;