import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format, addMonths, startOfDay, subMonths } from 'date-fns';
import { CalendarIcon, Plus, Trash2, ArrowLeft, Save, User, MapPin, Utensils, Palette, Shirt, Calculator, ChevronRight, Box, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// SIMPLIFIED MENU OPTIONS
// ============================================

const MENU_CATEGORIES = {
  beef: {
    name: 'Beef',
    options: [
      { name: 'Beef Caldereta', cost: 0 },
      { name: 'Beef Steak', cost: 0 },
      { name: 'Beef Broccoli', cost: 0 },
      { name: 'Beef Salpicao', cost: 0 },
    ]
  },
  pork: {
    name: 'Pork',
    options: [
      { name: 'Pork Humba', cost: 0 },
      { name: 'Pork BBQ', cost: 0 },
      { name: 'Lechon Kawali', cost: 0 },
      { name: 'Pork Liempo', cost: 0 },
    ]
  },
  chicken: {
    name: 'Chicken',
    options: [
      { name: 'Fried Chicken', cost: 0 },
      { name: 'Chicken Curry', cost: 0 },
      { name: 'Chicken Afritada', cost: 0 },
      { name: 'Buttered Chicken', cost: 0 },
    ]
  },
  fish: {
    name: 'Fish',
    options: [
      { name: 'Fish Fillet', cost: 0 },
      { name: 'Sweet & Sour Fish', cost: 0 },
      { name: 'Escabeche', cost: 0 },
      { name: 'Grilled Fish', cost: 0 },
    ]
  },
  seafood: {
    name: 'Seafood',
    options: [
      { name: 'Shrimp Tempura', cost: 150 },
      { name: 'Garlic Butter Shrimp', cost: 150 },
      { name: 'Calamares', cost: 100 },
      { name: 'Baked Mussels', cost: 100 },
    ]
  },
  pasta: {
    name: 'Pasta',
    options: [
      { name: 'Carbonara', cost: 0 },
      { name: 'Spaghetti', cost: 0 },
      { name: 'Pesto Pasta', cost: 0 },
      { name: 'Baked Macaroni', cost: 0 },
    ]
  },
  vegetables: {
    name: 'Vegetables',
    options: [
      { name: 'Chopsuey', cost: 0 },
      { name: 'Buttered Vegetables', cost: 0 },
      { name: 'Pinakbet', cost: 0 },
      { name: 'Lumpiang Shanghai', cost: 50 },
    ]
  },
  rice: {
    name: 'Rice',
    options: [
      { name: 'Steamed Rice', cost: 0 },
      { name: 'Garlic Rice', cost: 0 },
      { name: 'Yang Chow Fried Rice', cost: 50 },
      { name: 'Paella', cost: 95 },
    ]
  },
  dessert: {
    name: 'Dessert',
    options: [
      { name: 'Fruit Salad', cost: 0 },
      { name: 'Leche Flan', cost: 0 },
      { name: 'Buko Pandan', cost: 0 },
      { name: 'Mango Float', cost: 50 },
      { name: 'Chocolate Cake', cost: 75 },
    ]
  },
  drinks: {
    name: 'Drinks',
    options: [
      { name: 'Iced Tea', cost: 0 },
      { name: 'Lemonade', cost: 0 },
      { name: 'Blue Lemonade', cost: 0 },
      { name: 'Mango Juice', cost: 30 },
    ]
  },
};

// ============================================
// PACKAGES WITH DIFFERENT INCLUSIONS
// ============================================

interface PackageConfig {
  name: string;
  description: string;
  basePrice: number;
  inclusions: {
    mains: number; // How many main dishes (beef, pork, chicken, fish, seafood)
    sides: number; // pasta, vegetables, rice
    desserts: number;
    drinks: number;
  };
  extras: string[];
}

const PACKAGES: Record<string, PackageConfig> = {
  'basic': {
    name: 'Basic Package',
    description: 'Perfect for intimate gatherings',
    basePrice: 550,
    inclusions: {
      mains: 3,      // Choose 3 from: beef, pork, chicken, fish, seafood
      sides: 2,      // Choose 2 from: pasta, vegetables, rice
      desserts: 1,
      drinks: 1,
    },
    extras: ['Standard Table Setup', 'Basic Centerpieces', 'Standard Chairs'],
  },
  'standard': {
    name: 'Standard Package',
    description: 'Great for medium-sized events',
    basePrice: 750,
    inclusions: {
      mains: 4,      // Choose 4 from: beef, pork, chicken, fish, seafood
      sides: 3,      // Choose 3 from: pasta, vegetables, rice
      desserts: 2,
      drinks: 2,
    },
    extras: ['Elegant Table Setup', 'Floral Centerpieces', 'VIP Chairs', 'Welcome Drinks'],
  },
  'premium': {
    name: 'Premium Package',
    description: 'Complete package for grand celebrations',
    basePrice: 950,
    inclusions: {
      mains: 5,      // Choose 5 from: beef, pork, chicken, fish, seafood
      sides: 3,      // Choose 3 from: pasta, vegetables, rice
      desserts: 2,
      drinks: 2,
    },
    extras: ['Luxury Table Setup', 'Premium Floral Arrangements', 'VIP Chairs', 'Welcome Drinks', 'Cheese Station', 'Photo Booth Area'],
  },
  'deluxe': {
    name: 'Deluxe Package',
    description: 'The ultimate celebration experience',
    basePrice: 1250,
    inclusions: {
      mains: 6,      // All mains included
      sides: 4,      // All sides included
      desserts: 3,
      drinks: 3,
    },
    extras: ['Luxury Table Setup', 'Premium Floral Arrangements', 'VIP Chairs', 'Welcome Drinks', 'Cheese & Charcuterie Station', 'Seafood Station', 'Live Cooking Station', 'Dedicated Event Coordinator'],
  },
};

// ============================================
// VENUE DATA
// ============================================

interface VenueInfo {
  address: string;
  halls: Record<string, number>;
}

const VENUES: Record<string, VenueInfo> = {
  'OLD GROVE': {
    address: 'Purok 5, U. Mojares Street Barangay Lodlod, Lipa City, 4217 Batangas',
    halls: { 'The Barn': 300 }
  },
  'FERNWOOD GARDENS': {
    address: 'Neogan, Tagaytay City',
    halls: { 'Indoor Function Hall': 200, 'Mozart Hall': 150, 'Schubert Hall': 150, 'Vivaldi Hall': 150 }
  },
  'WORLD TRADE CENTER': {
    address: 'Mezzanine Level WTCMM Building, Sen. Gil J. Puyat Ave. cor. Diosdado Macapagal Blvd., Pasay City 1300',
    halls: { 'Hall A': 1000, 'Hall B': 1000, 'Hall C': 700 }
  },
  'SMX MANILA': {
    address: 'Seashell Lane, Mall of Asia Complex, Pasay City 1300',
    halls: { 'Hall 1': 1500, 'Hall 2': 1000, 'Hall 3': 1000, 'Hall 4': 1500, 'Function Room 1': 500, 'Function Room 2': 500 }
  },
  'BLUE LEAF PAVILION': {
    address: '100 Park Avenue, McKinley Hill Village, Fort Bonifacio, Taguig',
    halls: { 'Banyan': 400, 'Silk': 300, 'Jade': 200 }
  },
  'OTHERS': {
    address: '',
    halls: {}
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

interface MenuTasting {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
  eventType: string;
  expectedGuests: number;
  preferredEventDate: string;
}

interface CreativeItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  pricePerItem?: number;
  images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
}

interface LinenItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  size: string;
  material: string;
  color: string;
  quantity: number;
  availableQuantity: number;
  pricePerItem?: number;
  images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
}

interface StockroomItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
  rentalPricePerDay?: number;
  images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => pesoFormatter.format(amount || 0);
const getMinimumContractEventDate = () => startOfDay(addMonths(new Date(), 6));

interface InventoryPickerProps<T extends { _id: string }> {
  value: string;
  selectedLabel: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  items: T[];
  onSearch: (search: string) => void;
  onSelect: (item: T) => void;
  getItemLabel: (item: T) => string;
  getItemSummary: (item: T) => string;
}

function InventoryPicker<T extends { _id: string }>({
  value,
  selectedLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  items,
  onSearch,
  onSelect,
  getItemLabel,
  getItemSummary,
}: InventoryPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch('');
      onSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', !value && 'text-muted-foreground')}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={(nextValue) => {
              setSearch(nextValue);
              onSearch(nextValue);
            }}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item._id}
                  value={`${getItemLabel(item)} ${getItemSummary(item)}`}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex items-start gap-3 py-3"
                >
                  <Check className={cn('mt-0.5 h-4 w-4', value === item._id ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{getItemLabel(item)}</div>
                    <div className="text-xs text-muted-foreground">{getItemSummary(item)}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function NewContract() {
  const { id: editingContractId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editorTab = searchParams.get('tab');
  const tastingId = searchParams.get('tasting');
  const isEditMode = Boolean(editingContractId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('client');
  const [eventDate, setEventDate] = useState<Date | undefined>(() => getMinimumContractEventDate());
  const [, setTastingData] = useState<MenuTasting | null>(null);
  const [paymentPlanConfig, setPaymentPlanConfig] = useState({
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
  });
  
  // Database items for dropdowns
  const [creativeItems, setCreativeItems] = useState<CreativeItem[]>([]);
  const [linenItems, setLinenItems] = useState<LinenItem[]>([]);
  const [stockroomItems, setStockroomItems] = useState<StockroomItem[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  
  // Client & Event Info
  const [clientInfo, setClientInfo] = useState({
    celebratorName: '',
    celebratorAddress: '',
    celebratorMobile: '',
    celebratorEmail: '',
    representativeName: '',
    representativeRelationship: '',
    representativeMobile: '',
    coordinatorName: '',
    coordinatorMobile: '',
    eventType: '',
    occasion: '',
    venue: '',
    hall: '',
    venueAddress: '',
    eventDate: '',
    arrivalOfGuests: '',
    servingTime: '',
    vipGuests: '',
    regularGuests: '',
    themeSetup: '',
    colorMotif: '',
  });

  // Package & Menu Selection
  const [selectedPackage, setSelectedPackage] = useState('');
  const [menuSelections, setMenuSelections] = useState<Record<string, string[]>>({});

  // Creative & Linen with pricing
  const [creativeAssets, setCreativeAssets] = useState<Array<{
    itemId: string;
    itemName: string;
    category: string;
    itemCode: string;
    imageUrl: string;
    availableQuantity: number;
    quantity: number;
    pricePerItem: number;
    notes: string;
  }>>([]);
  
  const [linenRequirements, setLinenRequirements] = useState<Array<{
    itemId: string;
    itemName: string;
    category: string;
    itemCode: string;
    imageUrl: string;
    availableQuantity: number;
    size: string;
    material: string;
    color: string;
    quantity: number;
    pricePerItem: number;
    notes: string;
  }>>([]);

  const [stockroomRequirements, setStockroomRequirements] = useState<Array<{
    itemId: string;
    itemName: string;
    category: string;
    itemCode: string;
    imageUrl: string;
    availableQuantity: number;
    quantity: number;
    pricePerItem: number;
    notes: string;
  }>>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    if (isEditMode) {
      loadExistingContract();
      return;
    }

    if (tastingId) {
      loadTastingData();
    }
  }, [isEditMode, editingContractId, tastingId]);

  useEffect(() => {
    if (!editorTab) {
      return;
    }

    const validTabs = ['client', 'event', 'package', 'addons', 'summary'];
    if (validTabs.includes(editorTab)) {
      setActiveTab(editorTab);
    }
  }, [editorTab]);

  const mapCreativeItemsWithPrice = (items: CreativeItem[]) => {
    return items.map(item => ({
      ...item,
      pricePerItem: item.pricePerItem ?? Math.floor(Math.random() * 500) + 100,
    }));
  };

  const mapLinenItemsWithPrice = (items: LinenItem[]) => {
    return items.map(item => ({
      ...item,
      pricePerItem: item.pricePerItem ?? Math.floor(Math.random() * 50) + 20,
    }));
  };

  const mapStockroomItemsWithPrice = (items: StockroomItem[]) => {
    return items.map(item => ({
      ...item,
      rentalPricePerDay: item.rentalPricePerDay ?? Math.floor(Math.random() * 700) + 150,
    }));
  };

  const loadCreativeItems = async (search = '') => {
    try {
      const query = new URLSearchParams({ limit: '24' });
      if (search.trim()) query.set('search', search.trim());
      const creativeRes = await api.request(`/creative-inventory?${query.toString()}`);
      setCreativeItems(mapCreativeItemsWithPrice((creativeRes as CreativeItem[]) || []));
    } catch (error) {
      console.error('Failed to load creative inventory items:', error);
    }
  };

  const loadLinenItems = async (search = '') => {
    try {
      const query = new URLSearchParams({ limit: '24' });
      if (search.trim()) query.set('search', search.trim());
      const linenRes = await api.request(`/linen-inventory?${query.toString()}`);
      setLinenItems(mapLinenItemsWithPrice((linenRes as LinenItem[]) || []));
    } catch (error) {
      console.error('Failed to load linen inventory items:', error);
    }
  };

  const loadStockroomItems = async (search = '') => {
    try {
      const query = new URLSearchParams({ limit: '12' });
      if (search.trim()) query.set('search', search.trim());
      const stockroomRes = await api.request(`/stockroom-inventory?${query.toString()}`);
      setStockroomItems(mapStockroomItemsWithPrice((stockroomRes as StockroomItem[]) || []));
    } catch (error) {
      console.error('Failed to load stockroom inventory items:', error);
    }
  };

  const loadTastingData = async () => {
    try {
      const data = await api.getMenuTasting(tastingId!);
      const minimumEventDate = getMinimumContractEventDate();
      setTastingData(data);
      setClientInfo(prev => ({
        ...prev,
        celebratorName: data.clientName,
        celebratorMobile: data.clientPhone,
        celebratorEmail: data.clientEmail,
        celebratorAddress: `${data.clientAddress.street}, ${data.clientAddress.city}, ${data.clientAddress.province} ${data.clientAddress.zipCode}`,
        eventType: data.eventType,
        regularGuests: String(data.expectedGuests),
      }));
      if (data.preferredEventDate) {
        const preferredEventDate = startOfDay(new Date(data.preferredEventDate));
        setEventDate(preferredEventDate < minimumEventDate ? minimumEventDate : preferredEventDate);
      }
    } catch (error) {
      toast.error('Failed to load tasting data');
    }
  };

  const loadExistingContract = async () => {
    if (!editingContractId) {
      return;
    }

    try {
      const contract: any = await api.getContract(editingContractId);
      const parsedVenue = parseVenueDetails(contract.venue?.name);
      const parsedNotes = parseContractNotes([
        contract.specialRequests,
        contract.venue?.notes,
        contract.clientNotes,
        contract.internalNotes,
      ].filter(Boolean).join(' | '));
      const guestCount = Math.max((Number(contract.totalPacks) || 0) - 25, 0);
      const loadedEventDate = contract.eventDate ? startOfDay(new Date(contract.eventDate)) : getMinimumContractEventDate();

      setClientInfo((prev) => ({
        ...prev,
        celebratorName: contract.clientName || '',
        celebratorAddress: formatClientAddress(contract.clientAddress),
        celebratorMobile: contract.clientContact || '',
        celebratorEmail: contract.clientEmail || '',
        representativeName: parsedNotes.representativeName,
        representativeRelationship: parsedNotes.representativeRelationship,
        representativeMobile: parsedNotes.representativeMobile,
        coordinatorName: parsedNotes.coordinatorName,
        coordinatorMobile: parsedNotes.coordinatorMobile || contract.venue?.contact || '',
        eventType: contract.clientType || '',
        occasion: contract.eventType || parsedNotes.occasion,
        venue: parsedVenue.venue,
        hall: parsedVenue.hall,
        venueAddress: contract.venue?.address || '',
        eventDate: contract.eventDate || '',
        arrivalOfGuests: parsedNotes.arrivalOfGuests,
        servingTime: parsedNotes.servingTime,
        vipGuests: '',
        regularGuests: guestCount > 0 ? String(guestCount) : '',
        themeSetup: contract.backdropRequirements || contract.creativeRequirements?.theme || '',
        colorMotif: contract.preferredColor || '',
      }));
      setEventDate(loadedEventDate);
      setSelectedPackage(contract.packageSelected || '');
      setPaymentPlanConfig({
        downPaymentPercent: Number(contract.downPaymentPercent) || 60,
        finalPaymentPercent: Number(contract.finalPaymentPercent) || 40,
      });
      setMenuSelections((contract.menuDetails || []).reduce((selectionMap: Record<string, string[]>, item: any) => {
        const categoryKey = getMenuCategoryKey(item.category, item.item);
        if (!categoryKey) {
          return selectionMap;
        }

        selectionMap[categoryKey] = [...(selectionMap[categoryKey] || []), item.item];
        return selectionMap;
      }, {}));
      setCreativeAssets((contract.creativeAssets || []).map((asset: any) => ({
        itemId: asset.itemId || '',
        itemName: asset.item || '',
        category: asset.category || '',
        itemCode: asset.itemCode || '',
        imageUrl: asset.imageUrl || '',
        availableQuantity: 0,
        quantity: Number(asset.quantity) || 1,
        pricePerItem: Number(asset.pricePerItem) || 0,
        notes: asset.notes || '',
      })));
      setLinenRequirements((contract.linenRequirements || []).map((item: any) => ({
        itemId: item.itemId || '',
        itemName: (item.type || '').replace(/\s*\(.+\)\s*$/, ''),
        category: item.category || '',
        itemCode: item.itemCode || '',
        imageUrl: item.imageUrl || '',
        availableQuantity: 0,
        size: item.size || '',
        material: item.material || '',
        color: item.color || '',
        quantity: Number(item.quantity) || 1,
        pricePerItem: Number(item.unitPrice) || 0,
        notes: item.notes || '',
      })));
      setStockroomRequirements((contract.equipmentChecklist || []).map((item: any) => ({
        itemId: item.itemId || '',
        itemName: item.item || '',
        category: item.category || '',
        itemCode: item.itemCode || '',
        imageUrl: item.imageUrl || '',
        availableQuantity: 0,
        quantity: Number(item.quantity) || 1,
        pricePerItem: Number(item.unitPrice) || 0,
        notes: item.notes || '',
      })));
    } catch (error) {
      toast.error('Failed to load contract for editing');
      navigate('/contracts');
    }
  };

  const parseClientAddress = (address: string) => {
    const parts = address
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length < 3) {
      return null;
    }

    const street = parts[0];
    const city = parts[1];
    const lastPart = parts.slice(2).join(', ');
    const zipMatch = lastPart.match(/(\d{4,6})$/);
    const province = lastPart.replace(/(\d{4,6})$/, '').trim();
    const zipCode = zipMatch?.[1] || '';

    if (!street || !city || !province || !zipCode) {
      return null;
    }

    return {
      street,
      city,
      province,
      zipCode,
    };
  };

  const buildMenuDetails = () => {
    return Object.entries(menuSelections).flatMap(([category, selections]) =>
      selections.map(item => ({
        category: MENU_CATEGORIES[category as keyof typeof MENU_CATEGORIES]?.name || category,
        item,
        quantity: totalGuests,
        confirmed: false,
      }))
    );
  };

  const getPrimaryImage = (images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>) => {
    if (!images?.length) return '';
    return images.find(image => image.isPrimary)?.url || images[0].url || '';
  };

  const createEmptyCreativeAsset = () => ({
    itemId: '',
    itemName: '',
    category: '',
    itemCode: '',
    imageUrl: '',
    availableQuantity: 0,
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  const createEmptyLinenRequirement = () => ({
    itemId: '',
    itemName: '',
    category: '',
    itemCode: '',
    imageUrl: '',
    availableQuantity: 0,
    size: '',
    material: '',
    color: '',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  const createEmptyStockroomRequirement = () => ({
    itemId: '',
    itemName: '',
    category: '',
    itemCode: '',
    imageUrl: '',
    availableQuantity: 0,
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  const formatClientAddress = (address?: { street?: string; city?: string; province?: string; zipCode?: string }) => {
    if (!address) {
      return '';
    }

    return [address.street, address.city, address.province]
      .filter(Boolean)
      .join(', ')
      .concat(address.zipCode ? ` ${address.zipCode}` : '');
  };

  const parseVenueDetails = (venueName?: string) => {
    const [venue = '', hall = ''] = (venueName || '').split(' - ');
    return {
      venue,
      hall,
    };
  };

  const parseContractNotes = (rawNotes: string) => {
    const extract = (pattern: RegExp) => rawNotes.match(pattern)?.[1]?.trim() || '';
    const representativeRaw = extract(/Representative:\s*([^|]+)/i);
    const coordinatorRaw = extract(/Coordinator:\s*([^|]+)/i);

    const representativeMatch = representativeRaw.match(/^(.+?)(?:\s*\((.+?)\))?(?:\s*-\s*(.+))?$/);
    const coordinatorMatch = coordinatorRaw.match(/^(.+?)(?:\s*-\s*(.+))?$/);

    return {
      occasion: extract(/Occasion:\s*([^|]+)/i),
      arrivalOfGuests: extract(/Guest arrival:\s*([^|]+)/i),
      servingTime: extract(/Serving time:\s*([^|]+)/i),
      representativeName: representativeMatch?.[1]?.trim() || '',
      representativeRelationship: representativeMatch?.[2]?.trim() || '',
      representativeMobile: representativeMatch?.[3]?.trim() || '',
      coordinatorName: coordinatorMatch?.[1]?.trim() || '',
      coordinatorMobile: coordinatorMatch?.[2]?.trim() || '',
    };
  };

  const getMenuCategoryKey = (categoryLabel?: string, itemName?: string) => {
    const normalizedLabel = (categoryLabel || '').trim().toLowerCase();
    const labelMatch = Object.entries(MENU_CATEGORIES).find(([, category]) => category.name.toLowerCase() === normalizedLabel);
    if (labelMatch) {
      return labelMatch[0];
    }

    const itemMatch = Object.entries(MENU_CATEGORIES).find(([, category]) => (
      category.options.some((option) => option.name === itemName)
    ));

    return itemMatch?.[0] || '';
  };

  const applyCreativeItemToAsset = (index: number, item: CreativeItem) => {
    setCreativeAssets(prev => prev.map((asset, assetIndex) =>
      assetIndex === index
        ? {
            ...asset,
            itemId: item._id,
            itemName: item.name,
            category: item.category || '',
            itemCode: item.itemCode || '',
            imageUrl: getPrimaryImage(item.images),
            availableQuantity: item.availableQuantity || 0,
            pricePerItem: item.pricePerItem || 0,
          }
        : asset
    ));
  };

  const applyLinenItemToRequirement = (index: number, item: LinenItem) => {
    setLinenRequirements(prev => prev.map((linen, linenIndex) =>
      linenIndex === index
        ? {
            ...linen,
            itemId: item._id,
            itemName: item.name,
            category: item.category || '',
            itemCode: item.itemCode || '',
            imageUrl: getPrimaryImage(item.images),
            availableQuantity: item.availableQuantity || 0,
            size: item.size || '',
            material: item.material || '',
            color: item.color || '',
            pricePerItem: item.pricePerItem || 0,
          }
        : linen
    ));
  };

  const applyStockroomItemToRequirement = (index: number, item: StockroomItem) => {
    setStockroomRequirements(prev => prev.map((entry, entryIndex) =>
      entryIndex === index
        ? {
            ...entry,
            itemId: item._id,
            itemName: item.name,
            category: item.category || '',
            itemCode: item.itemCode || '',
            imageUrl: getPrimaryImage(item.images),
            availableQuantity: item.availableQuantity || 0,
            pricePerItem: item.rentalPricePerDay || 0,
          }
        : entry
    ));
  };

  const buildClientNotes = () => {
    const notes = [
      clientInfo.occasion ? `Occasion: ${clientInfo.occasion}` : '',
      clientInfo.representativeName
        ? `Representative: ${clientInfo.representativeName}${clientInfo.representativeRelationship ? ` (${clientInfo.representativeRelationship})` : ''}${clientInfo.representativeMobile ? ` - ${clientInfo.representativeMobile}` : ''}`
        : '',
      clientInfo.coordinatorName
        ? `Coordinator: ${clientInfo.coordinatorName}${clientInfo.coordinatorMobile ? ` - ${clientInfo.coordinatorMobile}` : ''}`
        : '',
      clientInfo.arrivalOfGuests ? `Guest arrival: ${clientInfo.arrivalOfGuests}` : '',
      clientInfo.servingTime ? `Serving time: ${clientInfo.servingTime}` : '',
    ].filter(Boolean);

    return notes.join(' | ');
  };

  // ============================================
  // AUTO-CALCULATED PRICING
  // ============================================

  const pkg = selectedPackage ? PACKAGES[selectedPackage] : null;

  // Total guests = VIP + Regular + 25 extra buffer
  const totalGuests = useMemo(() => {
    const vip = parseInt(clientInfo.vipGuests) || 0;
    const regular = parseInt(clientInfo.regularGuests) || 0;
    return vip + regular + 25;
  }, [clientInfo.vipGuests, clientInfo.regularGuests]);

  // Base menu cost
  const baseMenuCost = useMemo(() => {
    if (!pkg || totalGuests === 0) return 0;
    return pkg.basePrice * totalGuests;
  }, [pkg, totalGuests]);

  // Menu upgrade costs (items with cost > 0)
  const menuUpgradeCost = useMemo(() => {
    let total = 0;
    Object.entries(menuSelections).forEach(([category, selections]) => {
      const catOptions = MENU_CATEGORIES[category as keyof typeof MENU_CATEGORIES];
      if (catOptions) {
        selections.forEach(itemName => {
          const item = catOptions.options.find(o => o.name === itemName);
          if (item) total += item.cost * totalGuests;
        });
      }
    });
    return total;
  }, [menuSelections, totalGuests]);

  const selectedCreativeAssets = useMemo(
    () => creativeAssets.filter(asset => asset.itemId),
    [creativeAssets]
  );

  const selectedLinenRequirements = useMemo(
    () => linenRequirements.filter(item => item.itemId),
    [linenRequirements]
  );

  const selectedStockroomRequirements = useMemo(
    () => stockroomRequirements.filter(item => item.itemId),
    [stockroomRequirements]
  );

  // Creative assets cost
  const creativeCost = useMemo(() => {
    return selectedCreativeAssets.reduce((sum, asset) => {
      return sum + (asset.pricePerItem * asset.quantity);
    }, 0);
  }, [selectedCreativeAssets]);

  // Linen cost
  const linenCost = useMemo(() => {
    return selectedLinenRequirements.reduce((sum, item) => {
      return sum + (item.pricePerItem * item.quantity);
    }, 0);
  }, [selectedLinenRequirements]);

  const stockroomCost = useMemo(() => {
    return selectedStockroomRequirements.reduce((sum, item) => {
      return sum + (item.pricePerItem * item.quantity);
    }, 0);
  }, [selectedStockroomRequirements]);

  // Subtotal before taxes
  const subtotal = useMemo(() => {
    return baseMenuCost + menuUpgradeCost + creativeCost + linenCost + stockroomCost;
  }, [baseMenuCost, menuUpgradeCost, creativeCost, linenCost, stockroomCost]);

  // Service charge (10%)
  const serviceCharge = useMemo(() => {
    return subtotal * 0.10;
  }, [subtotal]);

  // Taxes (12%)
  const taxes = useMemo(() => {
    return subtotal * 0.12;
  }, [subtotal]);

  // Grand total
  const grandTotal = useMemo(() => {
    return subtotal + serviceCharge + taxes;
  }, [subtotal, serviceCharge, taxes]);

  // Payment breakdown
  const downPayment = useMemo(
    () => grandTotal * ((paymentPlanConfig.downPaymentPercent || 0) / 100),
    [grandTotal, paymentPlanConfig.downPaymentPercent]
  );
  const finalPayment = useMemo(
    () => grandTotal * ((paymentPlanConfig.finalPaymentPercent || 0) / 100),
    [grandTotal, paymentPlanConfig.finalPaymentPercent]
  );
  const isFullPaymentPlan = paymentPlanConfig.downPaymentPercent >= 100 || paymentPlanConfig.finalPaymentPercent <= 0;

  // ============================================
  // MENU SELECTION HANDLERS
  // ============================================

  const handleMenuSelection = (category: string, itemName: string) => {
    if (!pkg) return;

    const current = menuSelections[category] || [];
    const exists = current.includes(itemName);
    
    // Get the limit for this category
    let limit = 1;
    const categoryType = getCategoryType(category);
    
    if (categoryType === 'main') {
      limit = pkg.inclusions.mains;
    } else if (categoryType === 'side') {
      limit = pkg.inclusions.sides;
    } else if (category === 'dessert') {
      limit = pkg.inclusions.desserts;
    } else if (category === 'drinks') {
      limit = pkg.inclusions.drinks;
    }

    setMenuSelections(prev => {
      if (exists) {
        return { ...prev, [category]: current.filter(i => i !== itemName) };
      } else {
        if (current.length >= limit) {
          toast.warning(`Package allows only ${limit} selection(s) for ${MENU_CATEGORIES[category as keyof typeof MENU_CATEGORIES]?.name}`);
          return prev;
        }
        return { ...prev, [category]: [...current, itemName] };
      }
    });
  };

  const getCategoryType = (category: string): 'main' | 'side' | 'other' => {
    if (['beef', 'pork', 'chicken', 'fish', 'seafood'].includes(category)) return 'main';
    if (['pasta', 'vegetables', 'rice'].includes(category)) return 'side';
    return 'other';
  };

  const getSelectedMainsCount = () => {
    return ['beef', 'pork', 'chicken', 'fish', 'seafood'].reduce((count, cat) => {
      return count + (menuSelections[cat]?.length || 0);
    }, 0);
  };

  const getSelectedSidesCount = () => {
    return ['pasta', 'vegetables', 'rice'].reduce((count, cat) => {
      return count + (menuSelections[cat]?.length || 0);
    }, 0);
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const parsedAddress = parseClientAddress(clientInfo.celebratorAddress);
    const minimumEventDate = getMinimumContractEventDate();

    // Client validation
    if (!clientInfo.celebratorName.trim()) newErrors.celebratorName = 'Celebrator name is required';
    if (!clientInfo.celebratorMobile.trim()) newErrors.celebratorMobile = 'Mobile number is required';
    else if (!/^\d{11}$/.test(clientInfo.celebratorMobile)) newErrors.celebratorMobile = 'Mobile must be 11 digits';
    
    if (!clientInfo.celebratorEmail.trim()) newErrors.celebratorEmail = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(clientInfo.celebratorEmail)) newErrors.celebratorEmail = 'Invalid email format';
    if (!clientInfo.celebratorAddress.trim()) newErrors.celebratorAddress = 'Address is required';
    else if (!parsedAddress) newErrors.celebratorAddress = 'Use format: Street, City, Province ZIP';

    // Event validation
    if (!clientInfo.eventType) newErrors.eventType = 'Event type is required';
    if (!clientInfo.venue) newErrors.venue = 'Venue is required';
    if (!eventDate) newErrors.eventDate = 'Event date is required';
    else if (eventDate < minimumEventDate) newErrors.eventDate = 'Event date must be at least 6 months from today';

    // Guest validation
    const vip = parseInt(clientInfo.vipGuests) || 0;
    const regular = parseInt(clientInfo.regularGuests) || 0;
    if (vip + regular < 75) newErrors.guests = 'Minimum 75 guests required';
    
    if (clientInfo.venue && clientInfo.hall && VENUES[clientInfo.venue]?.halls[clientInfo.hall]) {
      const maxPax = VENUES[clientInfo.venue].halls[clientInfo.hall];
      if (totalGuests > maxPax) newErrors.guests = `Hall capacity exceeded (max: ${maxPax})`;
    }

    // Package validation
    if (!selectedPackage) newErrors.package = 'Please select a package';
    
    // Menu validation
    if (pkg) {
      const mainsCount = getSelectedMainsCount();
      const sidesCount = getSelectedSidesCount();
      
      if (mainsCount < pkg.inclusions.mains) {
        newErrors.menu = `Please select ${pkg.inclusions.mains} main dish(es) (${mainsCount} selected)`;
      }
      if (sidesCount < pkg.inclusions.sides) {
        newErrors.menu = `Please select ${pkg.inclusions.sides} side dish(es) (${sidesCount} selected)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const contractData = {
        clientName: clientInfo.celebratorName,
        clientContact: clientInfo.celebratorMobile,
        clientEmail: clientInfo.celebratorEmail,
        clientAddress: parseClientAddress(clientInfo.celebratorAddress),
        clientType: clientInfo.eventType,
        venue: {
          name: clientInfo.venue ? `${clientInfo.venue}${clientInfo.hall ? ` - ${clientInfo.hall}` : ''}` : '',
          address: clientInfo.venueAddress,
          contact: clientInfo.coordinatorMobile || clientInfo.representativeMobile || '',
          notes: buildClientNotes(),
        },
        eventType: clientInfo.occasion || clientInfo.eventType,
        packageSelected: selectedPackage,
        totalPacks: totalGuests,
        menuDetails: buildMenuDetails(),
        preferredColor: clientInfo.colorMotif,
        backdropRequirements: clientInfo.themeSetup,
        specialRequests: buildClientNotes(),
        creativeRequirements: {
          theme: clientInfo.themeSetup || undefined,
          colorPalette: clientInfo.colorMotif
            ? clientInfo.colorMotif.split(/[,&/]/).map(item => item.trim()).filter(Boolean)
            : [],
        },
        creativeAssets: selectedCreativeAssets.map(asset => ({
          itemId: asset.itemId,
          item: asset.itemName,
          itemCode: asset.itemCode,
          category: asset.category || 'Other',
          imageUrl: asset.imageUrl,
          quantity: asset.quantity,
          notes: asset.notes,
          cost: asset.pricePerItem * asset.quantity,
          pricePerItem: asset.pricePerItem,
        })),
        equipmentChecklist: selectedStockroomRequirements.map(item => ({
          itemId: item.itemId,
          item: item.itemName,
          itemCode: item.itemCode,
          category: item.category,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          unitPrice: item.pricePerItem,
          notes: item.notes,
          status: 'pending',
        })),
        linenRequirements: selectedLinenRequirements.map(item => ({
          itemId: item.itemId,
          type: item.color ? `${item.itemName} (${item.color})` : item.itemName,
          itemCode: item.itemCode,
          category: item.category,
          imageUrl: item.imageUrl,
          size: item.size,
          material: item.material,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.pricePerItem,
          notes: item.notes,
        })),
        packagePrice: baseMenuCost + menuUpgradeCost,
        totalContractValue: grandTotal,
        paymentTerms: clientInfo.eventType === 'corporate' ? 'corporate_flexible' : 'wedding_standard',
        downPaymentPercent: paymentPlanConfig.downPaymentPercent,
        finalPaymentPercent: paymentPlanConfig.finalPaymentPercent,
        internalNotes: `Pricing summary: subtotal ${formatCurrency(subtotal)}, service charge ${formatCurrency(serviceCharge)}, taxes ${formatCurrency(taxes)}, down payment ${formatCurrency(downPayment)}, final payment ${formatCurrency(finalPayment)}. Stockroom items: ${selectedStockroomRequirements.map(item => `${item.itemName} x${item.quantity}`).join(', ') || 'none'}.`,
        eventDate: eventDate!.toISOString(),
      };

      if (isEditMode && editingContractId) {
        await api.updateContract(editingContractId, contractData);
        toast.success('Contract updated successfully!');
        navigate(`/contracts/${editingContractId}`);
      } else {
        const newContract = await api.createContract({
          ...contractData,
          menuTasting: tastingId,
        });
        
        if (tastingId) {
          await api.linkContractToTasting(tastingId, newContract._id);
        }
        
        toast.success('Contract created successfully!');
        navigate('/contracts');
      }
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update contract' : 'Failed to create contract'));
  } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Contract' : tastingId ? 'Create Contract from Tasting' : 'New Contract'}
            </h1>
            <p className="text-muted-foreground">
              All pricing is calculated automatically based on your selections.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="client">Client Info</TabsTrigger>
            <TabsTrigger value="event">Event Details</TabsTrigger>
            <TabsTrigger value="package">Package & Menu</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* CLIENT INFO TAB */}
          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Celebrator Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={clientInfo.celebratorName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorName: e.target.value }))}
                      placeholder="e.g., Maria Santos"
                      className={errors.celebratorName ? 'border-red-500' : ''}
                    />
                    {errors.celebratorName && <p className="text-sm text-red-500">{errors.celebratorName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number (11 digits) *</Label>
                    <Input
                      value={clientInfo.celebratorMobile}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorMobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                      placeholder="09171234567"
                      className={errors.celebratorMobile ? 'border-red-500' : ''}
                    />
                    {errors.celebratorMobile && <p className="text-sm text-red-500">{errors.celebratorMobile}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={clientInfo.celebratorEmail}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorEmail: e.target.value }))}
                      placeholder="maria@email.com"
                      className={errors.celebratorEmail ? 'border-red-500' : ''}
                    />
                    {errors.celebratorEmail && <p className="text-sm text-red-500">{errors.celebratorEmail}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Complete Address</Label>
                    <Input
                      value={clientInfo.celebratorAddress}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorAddress: e.target.value }))}
                      placeholder="Street, City, Province"
                      className={errors.celebratorAddress ? 'border-red-500' : ''}
                    />
                    {errors.celebratorAddress && <p className="text-sm text-red-500">{errors.celebratorAddress}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Representative Information (if applicable)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Representative Name</Label>
                    <Input
                      value={clientInfo.representativeName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, representativeName: e.target.value }))}
                      placeholder="e.g., John Santos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Input
                      value={clientInfo.representativeRelationship}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, representativeRelationship: e.target.value }))}
                      placeholder="e.g., Husband, Mother"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={clientInfo.representativeMobile}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, representativeMobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                    placeholder="09171234567"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coordinator Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Coordinator Name</Label>
                    <Input
                      value={clientInfo.coordinatorName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, coordinatorName: e.target.value }))}
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      value={clientInfo.coordinatorMobile}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, coordinatorMobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                      placeholder="09171234567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('event')}>
                Next: Event Details <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* EVENT DETAILS TAB */}
          <TabsContent value="event" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Event Type *</Label>
                    <Select
                      value={clientInfo.eventType}
                      onValueChange={(value) => setClientInfo(prev => ({ ...prev, eventType: value }))}
                    >
                      <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="debut">Debut</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Occasion/Theme</Label>
                    <Input
                      value={clientInfo.occasion}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, occasion: e.target.value }))}
                      placeholder="e.g., 50th Birthday Celebration"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Event Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${errors.eventDate ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {eventDate ? format(eventDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={eventDate}
                          onSelect={setEventDate}
                          disabled={(date) => date < getMinimumContractEventDate()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival of Guests</Label>
                    <Input
                      type="time"
                      value={clientInfo.arrivalOfGuests}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, arrivalOfGuests: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Venue *</Label>
                    <Select
                      value={clientInfo.venue}
                      onValueChange={(value) => {
                        setClientInfo(prev => ({ 
                          ...prev, 
                          venue: value, 
                          hall: '',
                          venueAddress: VENUES[value]?.address || '' 
                        }));
                      }}
                    >
                      <SelectTrigger className={errors.venue ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(VENUES).map(venue => (
                          <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
                  </div>
                  {clientInfo.venue && VENUES[clientInfo.venue]?.halls && Object.keys(VENUES[clientInfo.venue].halls).length > 0 && (
                    <div className="space-y-2">
                      <Label>Hall/Function Room</Label>
                      <Select
                        value={clientInfo.hall}
                        onValueChange={(value) => setClientInfo(prev => ({ ...prev, hall: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hall" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VENUES[clientInfo.venue].halls).map(([hall, capacity]) => (
                            <SelectItem key={hall} value={hall}>
                              {hall} (Max: {capacity} pax)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {clientInfo.venueAddress && (
                  <div className="space-y-2">
                    <Label>Venue Address</Label>
                    <Input value={clientInfo.venueAddress} disabled />
                  </div>
                )}

                {/* Guest Count - VIP + Regular = Total */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Guest Count</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>VIP Guests</Label>
                      <Input
                        type="number"
                        min={0}
                        value={clientInfo.vipGuests}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, vipGuests: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Regular Guests</Label>
                      <Input
                        type="number"
                        min={0}
                        value={clientInfo.regularGuests}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, regularGuests: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-primary font-medium">Total Guests (+25 buffer)</Label>
                      <div className="h-10 flex items-center px-3 bg-primary/10 rounded-md font-bold text-lg">
                        {totalGuests.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Includes 25 extra for staff/buffer</p>
                    </div>
                  </div>
                  {errors.guests && <p className="text-sm text-red-500 mt-2">{errors.guests}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Theme Setup</Label>
                    <Input
                      value={clientInfo.themeSetup}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, themeSetup: e.target.value }))}
                      placeholder="e.g., Romantic Garden"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color Motif</Label>
                    <Input
                      value={clientInfo.colorMotif}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, colorMotif: e.target.value }))}
                      placeholder="e.g., Blush Pink & Gold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('client')}>Back</Button>
              <Button onClick={() => setActiveTab('package')}>
                Next: Package & Menu <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* PACKAGE & MENU TAB */}
          <TabsContent value="package" className="space-y-4">
            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Select Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(PACKAGES).map(([key, pkgData]) => (
                    <div
                      key={key}
                      onClick={() => {
                        setSelectedPackage(key);
                        setMenuSelections({}); // Clear selections when changing package
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPackage === key 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-semibold">{pkgData.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{pkgData.description}</p>
                      <div className="mt-3 space-y-1">
                        <p className="text-lg font-bold text-primary">₱{pkgData.basePrice.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/pax</span></p>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">{pkgData.inclusions.mains}</span> Main Dishes</p>
                        <p><span className="font-medium">{pkgData.inclusions.sides}</span> Side Dishes</p>
                        <p><span className="font-medium">{pkgData.inclusions.desserts}</span> Desserts</p>
                        <p><span className="font-medium">{pkgData.inclusions.drinks}</span> Drinks</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Extras:</p>
                        <ul className="text-xs text-muted-foreground mt-1">
                          {pkgData.extras.slice(0, 3).map((extra, i) => (
                            <li key={i}>• {extra}</li>
                          ))}
                          {pkgData.extras.length > 3 && <li>• +{pkgData.extras.length - 3} more</li>}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.package && <p className="text-sm text-red-500 mt-2">{errors.package}</p>}
              </CardContent>
            </Card>

            {/* Menu Selection */}
            {selectedPackage && pkg && (
              <Card>
                <CardHeader>
                  <CardTitle>Menu Selection</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select {pkg.inclusions.mains} main dishes, {pkg.inclusions.sides} side dishes, {pkg.inclusions.desserts} dessert(s), and {pkg.inclusions.drinks} drink(s).
                  </p>
                  {errors.menu && <p className="text-sm text-red-500">{errors.menu}</p>}
                </CardHeader>
                <CardContent>
                  {/* Progress indicator */}
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Mains:</span>
                        <Badge variant={getSelectedMainsCount() >= pkg.inclusions.mains ? 'default' : 'secondary'}>
                          {getSelectedMainsCount()}/{pkg.inclusions.mains}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sides:</span>
                        <Badge variant={getSelectedSidesCount() >= pkg.inclusions.sides ? 'default' : 'secondary'}>
                          {getSelectedSidesCount()}/{pkg.inclusions.sides}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Desserts:</span>
                        <Badge variant={(menuSelections.dessert?.length || 0) >= pkg.inclusions.desserts ? 'default' : 'secondary'}>
                          {menuSelections.dessert?.length || 0}/{pkg.inclusions.desserts}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Drinks:</span>
                        <Badge variant={(menuSelections.drinks?.length || 0) >= pkg.inclusions.drinks ? 'default' : 'secondary'}>
                          {menuSelections.drinks?.length || 0}/{pkg.inclusions.drinks}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Main Dishes */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Main Dishes <span className="text-sm text-muted-foreground font-normal">(Choose {pkg.inclusions.mains})</span></h4>
                      
                      {(['beef', 'pork', 'chicken', 'fish', 'seafood'] as const).map(category => (
                        <div key={category} className="space-y-2">
                          <Label className="capitalize">{MENU_CATEGORIES[category].name}</Label>
                          <div className="space-y-1">
                            {MENU_CATEGORIES[category].options.map(option => (
                              <div key={option.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={(menuSelections[category] || []).includes(option.name)}
                                    onCheckedChange={() => handleMenuSelection(category, option.name)}
                                  />
                                  <span className="text-sm">{option.name}</span>
                                </div>
                                {option.cost > 0 && (
                                  <Badge variant="secondary" className="text-xs">+{formatCurrency(option.cost)}/pax</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sides, Desserts, Drinks */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Side Dishes <span className="text-sm text-muted-foreground font-normal">(Choose {pkg.inclusions.sides})</span></h4>
                      
                      {(['pasta', 'vegetables', 'rice'] as const).map(category => (
                        <div key={category} className="space-y-2">
                          <Label className="capitalize">{MENU_CATEGORIES[category].name}</Label>
                          <div className="space-y-1">
                            {MENU_CATEGORIES[category].options.map(option => (
                              <div key={option.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={(menuSelections[category] || []).includes(option.name)}
                                    onCheckedChange={() => handleMenuSelection(category, option.name)}
                                  />
                                  <span className="text-sm">{option.name}</span>
                                </div>
                                {option.cost > 0 && (
                                  <Badge variant="secondary" className="text-xs">+{formatCurrency(option.cost)}/pax</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <Separator />

                      {/* Desserts */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Desserts <span className="text-sm text-muted-foreground font-normal">(Choose {pkg.inclusions.desserts})</span></h4>
                        <div className="space-y-1">
                          {MENU_CATEGORIES.dessert.options.map(option => (
                            <div key={option.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={(menuSelections.dessert || []).includes(option.name)}
                                  onCheckedChange={() => handleMenuSelection('dessert', option.name)}
                                />
                                <span className="text-sm">{option.name}</span>
                              </div>
                              {option.cost > 0 && (
                                <Badge variant="secondary" className="text-xs">+{formatCurrency(option.cost)}/pax</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Drinks */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Drinks <span className="text-sm text-muted-foreground font-normal">(Choose {pkg.inclusions.drinks})</span></h4>
                        <div className="space-y-1">
                          {MENU_CATEGORIES.drinks.options.map(option => (
                            <div key={option.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={(menuSelections.drinks || []).includes(option.name)}
                                  onCheckedChange={() => handleMenuSelection('drinks', option.name)}
                                />
                                <span className="text-sm">{option.name}</span>
                              </div>
                              {option.cost > 0 && (
                                <Badge variant="secondary" className="text-xs">+{formatCurrency(option.cost)}/pax</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Preview */}
            {selectedPackage && totalGuests > 0 && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Pricing Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Price ({pkg?.name}):</span>
                      <span className="font-medium">{formatCurrency(pkg?.basePrice || 0)} x {totalGuests} = {formatCurrency(baseMenuCost)}</span>
                    </div>
                    {menuUpgradeCost > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Menu Upgrades:</span>
                        <span className="font-medium">+{formatCurrency(menuUpgradeCost)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span>Food & Beverage Subtotal:</span>
                      <span className="font-bold">{formatCurrency(baseMenuCost + menuUpgradeCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('event')}>Back</Button>
              <Button onClick={() => setActiveTab('addons')}>
                Next: Add-ons <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* ADD-ONS TAB */}
          <TabsContent value="addons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Creative / Decor Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Selected Creative Items</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCreativeAssets(prev => [...prev, createEmptyCreativeAsset()])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {creativeAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No creative items added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {creativeAssets.map((asset, index) => (
                      <div key={index} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center">
                        <button
                          type="button"
                          className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted"
                          onClick={() => asset.imageUrl && setPreviewImage({ url: asset.imageUrl, title: asset.itemName || 'Creative item' })}
                        >
                          {asset.imageUrl ? (
                            <img src={asset.imageUrl} alt={asset.itemName || 'Creative item'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-2">
                          <InventoryPicker
                            value={asset.itemId}
                            selectedLabel={asset.itemName}
                            placeholder="Select creative item"
                            searchPlaceholder="Search creative items..."
                            emptyText="No matching creative items found."
                            items={creativeItems}
                            onSearch={loadCreativeItems}
                            onSelect={(item) => applyCreativeItemToAsset(index, item)}
                            getItemLabel={(item) => item.name}
                            getItemSummary={(item) => `${item.itemCode || 'No code'} | ${item.category || 'No category'} | ${item.availableQuantity} available | ${formatCurrency(item.pricePerItem || 0)}`}
                          />
                          {asset.itemId ? (
                            <div className="text-xs text-muted-foreground">
                              <div>{asset.itemCode || 'No code'} | {asset.category || 'No category'}</div>
                              <div>{asset.availableQuantity} available</div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Choose an item to load its details and price.</div>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={asset.quantity}
                          onChange={(e) => setCreativeAssets(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: parseInt(e.target.value) || 1 } : entry))}
                          className="w-full md:w-20"
                          min={1}
                        />
                        <div className="min-w-[120px] text-sm text-muted-foreground">{formatCurrency(asset.pricePerItem * asset.quantity)}</div>
                        <Input
                          placeholder="Notes"
                          value={asset.notes}
                          onChange={(e) => setCreativeAssets(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, notes: e.target.value } : entry))}
                          className="w-full md:flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setCreativeAssets(prev => prev.filter((_, entryIndex) => entryIndex !== index))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {creativeCost > 0 && (
                      <div className="flex justify-end text-sm">
                        <span className="text-muted-foreground">Creative Total: </span>
                        <span className="ml-2 font-medium">{formatCurrency(creativeCost)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="h-5 w-5" />
                  Linen Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Selected Linen Items</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLinenRequirements(prev => [...prev, createEmptyLinenRequirement()])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Linen
                  </Button>
                </div>

                {linenRequirements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No linen items added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {linenRequirements.map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center">
                        <button
                          type="button"
                          className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted"
                          onClick={() => item.imageUrl && setPreviewImage({ url: item.imageUrl, title: item.itemName || 'Linen item' })}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName || 'Linen item'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-2">
                          <InventoryPicker
                            value={item.itemId}
                            selectedLabel={item.itemName}
                            placeholder="Select linen item"
                            searchPlaceholder="Search linen items..."
                            emptyText="No matching linen items found."
                            items={linenItems}
                            onSearch={loadLinenItems}
                            onSelect={(linen) => applyLinenItemToRequirement(index, linen)}
                            getItemLabel={(linen) => linen.name}
                            getItemSummary={(linen) => `${linen.itemCode || 'No code'} | ${linen.color || 'No color'} | ${linen.material || 'No material'} | ${linen.availableQuantity} available | ${formatCurrency(linen.pricePerItem || 0)}`}
                          />
                          {item.itemId ? (
                            <div className="text-xs text-muted-foreground">
                              <div>{item.itemCode || 'No code'} | {item.material || 'No material'} | {item.color || 'No color'}</div>
                              <div>{item.availableQuantity} available</div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Choose a linen item to load its details and price.</div>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => setLinenRequirements(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: parseInt(e.target.value) || 1 } : entry))}
                          className="w-full md:w-20"
                          min={1}
                        />
                        <div className="min-w-[120px] text-sm text-muted-foreground">{formatCurrency(item.pricePerItem * item.quantity)}</div>
                        <Input
                          placeholder="Notes"
                          value={item.notes}
                          onChange={(e) => setLinenRequirements(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, notes: e.target.value } : entry))}
                          className="w-full md:flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setLinenRequirements(prev => prev.filter((_, entryIndex) => entryIndex !== index))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {linenCost > 0 && (
                      <div className="flex justify-end text-sm">
                        <span className="text-muted-foreground">Linen Total: </span>
                        <span className="ml-2 font-medium">{formatCurrency(linenCost)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Stockroom Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Selected Stockroom Items</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setStockroomRequirements(prev => [...prev, createEmptyStockroomRequirement()])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stockroom Item
                  </Button>
                </div>

                {stockroomRequirements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stockroom items added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {stockroomRequirements.map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center">
                        <button
                          type="button"
                          className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted"
                          onClick={() => item.imageUrl && setPreviewImage({ url: item.imageUrl, title: item.itemName || 'Stockroom item' })}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName || 'Stockroom item'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-2">
                          <InventoryPicker
                            value={item.itemId}
                            selectedLabel={item.itemName}
                            placeholder="Select stockroom item"
                            searchPlaceholder="Search stockroom items..."
                            emptyText="No matching stockroom items found."
                            items={stockroomItems}
                            onSearch={loadStockroomItems}
                            onSelect={(stockroomItem) => applyStockroomItemToRequirement(index, stockroomItem)}
                            getItemLabel={(stockroomItem) => stockroomItem.name}
                            getItemSummary={(stockroomItem) => `${stockroomItem.itemCode || 'No code'} | ${stockroomItem.category || 'No category'} | ${stockroomItem.availableQuantity} available | ${formatCurrency(stockroomItem.rentalPricePerDay || 0)}`}
                          />
                          {item.itemId ? (
                            <div className="text-xs text-muted-foreground">
                              <div>{item.itemCode || 'No code'} | {item.category || 'No category'}</div>
                              <div>{item.availableQuantity} available</div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Choose a stockroom item to load its details and price.</div>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => setStockroomRequirements(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: parseInt(e.target.value) || 1 } : entry))}
                          className="w-full md:w-20"
                          min={1}
                        />
                        <div className="min-w-[120px] text-sm text-muted-foreground">{formatCurrency(item.pricePerItem * item.quantity)}</div>
                        <Input
                          placeholder="Notes"
                          value={item.notes}
                          onChange={(e) => setStockroomRequirements(prev => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, notes: e.target.value } : entry))}
                          className="w-full md:flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setStockroomRequirements(prev => prev.filter((_, entryIndex) => entryIndex !== index))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {stockroomCost > 0 && (
                      <div className="flex justify-end text-sm">
                        <span className="text-muted-foreground">Stockroom Total: </span>
                        <span className="ml-2 font-medium">{formatCurrency(stockroomCost)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('package')}>Back</Button>
              <Button onClick={() => setActiveTab('summary')}>
                Next: Summary <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* SUMMARY TAB */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Contract Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Client Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Celebrator:</span>
                    <span>{clientInfo.celebratorName || '-'}</span>
                    <span className="text-muted-foreground">Event Date:</span>
                    <span>{eventDate ? format(eventDate, 'PPP') : '-'}</span>
                    <span className="text-muted-foreground">Venue:</span>
                    <span>{clientInfo.venue ? `${clientInfo.venue}${clientInfo.hall ? ` - ${clientInfo.hall}` : ''}` : '-'}</span>
                    <span className="text-muted-foreground">Total Guests:</span>
                    <span>{totalGuests.toLocaleString()} (VIP: {clientInfo.vipGuests || 0}, Regular: {clientInfo.regularGuests || 0}, +25 buffer)</span>
                  </div>
                </div>

                <Separator />

                {/* Package Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Package & Menu</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Package:</span>
                    <span>{pkg?.name || '-'}</span>
                    <span className="text-muted-foreground">Base Price:</span>
                    <span>{formatCurrency(pkg?.basePrice || 0)}/pax</span>
                  </div>
                </div>

                <Separator />

                {/* Add-ons Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Add-ons & Equipment</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Creative / Decor</div>
                      {selectedCreativeAssets.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {selectedCreativeAssets.map((asset, index) => (
                            <div key={`summary-creative-${asset.itemId}-${index}`} className="flex justify-between gap-4">
                              <span>{asset.itemName} x{asset.quantity}</span>
                              <span>{formatCurrency(asset.pricePerItem * asset.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">None selected.</p>
                      )}
                    </div>
                    <div>
                      <div className="text-muted-foreground">Linen</div>
                      {selectedLinenRequirements.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {selectedLinenRequirements.map((item, index) => (
                            <div key={`summary-linen-${item.itemId}-${index}`} className="flex justify-between gap-4">
                              <span>{item.itemName} x{item.quantity}</span>
                              <span>{formatCurrency(item.pricePerItem * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">None selected.</p>
                      )}
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stockroom / Equipment</div>
                      {selectedStockroomRequirements.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {selectedStockroomRequirements.map((item, index) => (
                            <div key={`summary-stockroom-${item.itemId}-${index}`} className="flex justify-between gap-4">
                              <span>{item.itemName} x{item.quantity}</span>
                              <span>{formatCurrency(item.pricePerItem * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">None selected.</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div>
                  <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Food & Beverage ({totalGuests} pax):</span>
                      <span>{formatCurrency(baseMenuCost)}</span>
                    </div>
                    {menuUpgradeCost > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span className="text-muted-foreground">Menu Upgrades:</span>
                        <span>+{formatCurrency(menuUpgradeCost)}</span>
                      </div>
                    )}
                    {creativeCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Creative/Decor Items:</span>
                        <span>+{formatCurrency(creativeCost)}</span>
                      </div>
                    )}
                    {linenCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Linen Items:</span>
                        <span>+{formatCurrency(linenCost)}</span>
                      </div>
                    )}
                    {stockroomCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stockroom / Equipment:</span>
                        <span>+{formatCurrency(stockroomCost)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Charge (10%):</span>
                      <span>{formatCurrency(serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes (12%):</span>
                      <span>{formatCurrency(taxes)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Grand Total:</span>
                      <span className="text-primary">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Schedule */}
                <div>
                  <h3 className="font-semibold mb-2">Payment Schedule</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isFullPaymentPlan ? 'Full Payment:' : `${paymentPlanConfig.downPaymentPercent}% Down Payment:`}
                      </span>
                      <span className="font-medium">{formatCurrency(downPayment)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isFullPaymentPlan
                        ? 'Agreed before signing. Full collection is posted after client signature and before preparation approval.'
                        : 'Agreed before signing. First collection is posted after client signature and before preparation approval.'}
                    </div>
                    {!isFullPaymentPlan ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{paymentPlanConfig.finalPaymentPercent}% Final Payment:</span>
                          <span className="font-medium">{formatCurrency(finalPayment)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due on: {eventDate ? format(subMonths(eventDate, 1), 'PPP') : '-'}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('addons')}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? (isEditMode ? 'Saving Changes...' : 'Creating Contract...') : (isEditMode ? 'Save Changes' : 'Create Contract')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewImage?.title || 'Item Preview'}</DialogTitle>
            </DialogHeader>
            {previewImage?.url ? (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


