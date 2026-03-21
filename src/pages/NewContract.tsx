import { useState, useEffect, useMemo, type ComponentProps } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useRole } from '@/contexts/AuthContext';
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

const MAIN_MENU_KEYS = ['beef', 'pork', 'chicken', 'fish', 'seafood'] as const;
const SIDE_MENU_KEYS = ['pasta', 'vegetables', 'rice'] as const;

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
  acquisition?: {
    cost?: number;
  };
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
  acquisition?: {
    cost?: number;
  };
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
  purchasePrice?: number;
  rentalPricePerDay?: number;
  pricePerItem?: number;
  images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
}

type SetupSuggestionKey = 'tables' | 'chairs' | 'plates' | 'utensils' | 'glasses' | 'tablecloths';

interface CreativeAssetEntry {
  itemId: string;
  itemName: string;
  category: string;
  itemCode: string;
  imageUrl: string;
  availableQuantity: number;
  quantity: number;
  pricePerItem: number;
  notes: string;
}

interface LinenRequirementEntry {
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
  autoRule?: SetupSuggestionKey;
}

interface StockroomRequirementEntry {
  itemId: string;
  itemName: string;
  category: string;
  itemCode: string;
  imageUrl: string;
  availableQuantity: number;
  quantity: number;
  pricePerItem: number;
  notes: string;
  autoRule?: SetupSuggestionKey;
}

interface SuggestedSetupFeedback {
  guestCount: number;
  tableCount: number;
  matched: Array<{
    key: SetupSuggestionKey;
    itemName: string;
    quantity: number;
  }>;
  missing: SetupSuggestionKey[];
}

type ContractFormTabKey = 'client' | 'event' | 'package' | 'addons' | 'summary';

type FieldLabelProps = ComponentProps<typeof Label> & {
  required?: boolean;
  optional?: boolean;
};

function FieldLabel({ children, required = false, optional = false, className, ...props }: FieldLabelProps) {
  return (
    <Label className={cn('flex items-center gap-1', className)} {...props}>
      <span>{children}</span>
      {required ? <span className="text-red-500">*</span> : null}
      {optional ? <span className="text-xs font-normal text-muted-foreground">(optional)</span> : null}
    </Label>
  );
}

const CONTRACT_ERROR_FIELD_ORDER = [
  'celebratorName',
  'celebratorMobile',
  'celebratorEmail',
  'celebratorAddress',
  'eventType',
  'eventDate',
  'venue',
  'guests',
  'package',
  'menu',
] as const;

const CONTRACT_ERROR_TAB_BY_FIELD: Record<string, ContractFormTabKey> = {
  celebratorName: 'client',
  celebratorMobile: 'client',
  celebratorEmail: 'client',
  celebratorAddress: 'client',
  eventType: 'event',
  eventDate: 'event',
  venue: 'event',
  guests: 'event',
  package: 'package',
  menu: 'package',
  addons: 'addons',
};

const BACKEND_CONTRACT_ERROR_FIELD_MAP: Record<string, string> = {
  clientName: 'celebratorName',
  clientContact: 'celebratorMobile',
  clientEmail: 'celebratorEmail',
  clientType: 'eventType',
  eventDate: 'eventDate',
  'venue.name': 'venue',
  totalPacks: 'guests',
  packageSelected: 'package',
  menuDetails: 'menu',
};

const inferFieldFromContractIssue = (message?: string) => {
  const normalizedMessage = String(message || '').toLowerCase();

  if (!normalizedMessage) {
    return '';
  }

  if (
    normalizedMessage.includes('main dish')
    || normalizedMessage.includes('side dish')
    || normalizedMessage.includes('dessert')
    || normalizedMessage.includes('drink')
    || normalizedMessage.includes('package')
    || normalizedMessage.includes('menu')
  ) {
    return normalizedMessage.includes('package') && !normalizedMessage.includes('dish') && !normalizedMessage.includes('dessert') && !normalizedMessage.includes('drink')
      ? 'package'
      : 'menu';
  }

  if (normalizedMessage.includes('venue') || normalizedMessage.includes('hall')) {
    return 'venue';
  }

  if (normalizedMessage.includes('event date') || normalizedMessage.includes('date before saving')) {
    return 'eventDate';
  }

  if (
    normalizedMessage.includes('guest')
    || normalizedMessage.includes('capacity')
    || normalizedMessage.includes('minimum 75')
    || normalizedMessage.includes('pax')
  ) {
    return 'guests';
  }

  if (
    normalizedMessage.includes('inventory')
    || normalizedMessage.includes('purchasing')
    || normalizedMessage.includes('rental')
    || normalizedMessage.includes('short by')
    || normalizedMessage.includes('available on')
    || normalizedMessage.includes('same-day stock')
    || normalizedMessage.includes('same day')
  ) {
    return 'addons';
  }

  return '';
};

interface InventoryMatchRule {
  category?: string;
  keywords: string[];
  preferredKeywords?: string[];
  excludedKeywords?: string[];
}

const GUESTS_PER_TABLE = 10;
const AUTO_SETUP_LABELS: Record<SetupSuggestionKey, string> = {
  tables: 'Tables',
  chairs: 'Chairs',
  plates: 'Plates',
  utensils: 'Utensils',
  glasses: 'Glasses',
  tablecloths: 'Tablecloths',
};

const STOCKROOM_SETUP_RULES: Record<Exclude<SetupSuggestionKey, 'tablecloths'>, InventoryMatchRule> = {
  tables: {
    category: 'Table',
    keywords: ['table'],
    preferredKeywords: ['table round', 'round table', 'table'],
    excludedKeywords: ['stand', 'plate', 'bowl'],
  },
  chairs: {
    category: 'Chair',
    keywords: ['chair'],
    preferredKeywords: ['chair tiffany', 'tiffany chair', 'chair'],
  },
  plates: {
    category: 'Table',
    keywords: ['plate'],
    preferredKeywords: ['dinner plate', 'plate'],
    excludedKeywords: ['salad', 'bowl'],
  },
  utensils: {
    category: 'Tool',
    keywords: ['utensil', 'cutlery', 'flatware', 'fork', 'spoon', 'knife'],
    preferredKeywords: ['utensil', 'cutlery', 'flatware', 'fork', 'spoon', 'knife'],
    excludedKeywords: ['cleaning'],
  },
  glasses: {
    category: 'Table',
    keywords: ['glass', 'goblet', 'wine glass', 'champagne'],
    preferredKeywords: ['wine glass', 'glass goblet', 'goblet', 'glass'],
  },
};

const LINEN_SETUP_RULES: Record<'tablecloths', InventoryMatchRule> = {
  tablecloths: {
    category: 'Tablecloth',
    keywords: ['tablecloth', 'cloth', 'rtc'],
    preferredKeywords: ['tablecloth', 'rtc', 'cloth'],
    excludedKeywords: ['napkin', 'runner', 'sash', 'chair', 'couch'],
  },
};

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => pesoFormatter.format(amount || 0);
const getMinimumContractEventDate = () => startOfDay(addMonths(new Date(), 6));

const normalizeMatchText = (value?: string) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const buildStableFallbackPrice = (seed: string, min: number, max: number) => {
  const normalized = normalizeMatchText(seed) || 'fallback-price';
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index);
    hash |= 0;
  }

  const range = max - min + 1;
  return min + (Math.abs(hash) % range);
};

const scoreInventoryMatch = (text: string, category: string, availableQuantity: number, rule: InventoryMatchRule) => {
  let score = 0;

  if (rule.category && category === rule.category) {
    score += 60;
  }

  (rule.keywords || []).forEach((keyword) => {
    if (text.includes(normalizeMatchText(keyword))) {
      score += 80;
    }
  });

  (rule.preferredKeywords || []).forEach((keyword) => {
    if (text.includes(normalizeMatchText(keyword))) {
      score += 120;
    }
  });

  (rule.excludedKeywords || []).forEach((keyword) => {
    if (text.includes(normalizeMatchText(keyword))) {
      score -= 180;
    }
  });

  return score + Math.min(availableQuantity || 0, 999) / 100;
};

const findBestStockroomMatch = (
  items: StockroomItem[],
  key: Exclude<SetupSuggestionKey, 'tablecloths'>,
): StockroomItem | null => {
  const rule = STOCKROOM_SETUP_RULES[key];
  let bestItem: StockroomItem | null = null;
  let bestScore = 0;

  for (const item of items) {
    const score = scoreInventoryMatch(
      normalizeMatchText(`${item.name} ${item.category} ${item.description || ''}`),
      item.category,
      item.availableQuantity || 0,
      rule,
    );

    if (score > bestScore) {
      bestItem = item;
      bestScore = score;
    }
  }

  return bestItem;
};

const findBestLinenMatch = (items: LinenItem[], key: 'tablecloths'): LinenItem | null => {
  const rule = LINEN_SETUP_RULES[key];
  let bestItem: LinenItem | null = null;
  let bestScore = 0;

  for (const item of items) {
    const score = scoreInventoryMatch(
      normalizeMatchText(`${item.name} ${item.category} ${item.color || ''} ${item.material || ''}`),
      item.category,
      item.availableQuantity || 0,
      rule,
    );

    if (score > bestScore) {
      bestItem = item;
      bestScore = score;
    }
  }

  return bestItem;
};

const buildAutoSetupNote = (key: SetupSuggestionKey, guestCount: number, tableCount: number) => {
  const detailByKey: Record<SetupSuggestionKey, string> = {
    tables: `1 table per ${GUESTS_PER_TABLE} seated guests.`,
    chairs: '1 chair per seated guest.',
    plates: '1 plate per seated guest.',
    utensils: '1 utensil setting per seated guest.',
    glasses: '1 glass per seated guest.',
    tablecloths: '1 tablecloth per suggested table.',
  };

  const countLabel = key === 'tables' || key === 'tablecloths'
    ? `${tableCount} table${tableCount === 1 ? '' : 's'}`
    : `${guestCount} guest${guestCount === 1 ? '' : 's'}`;

  return `Auto-filled from ${countLabel}. ${detailByKey[key]}`;
};

const mergeSuggestedEntries = <T extends { itemId: string; itemName: string; quantity: number; notes: string; autoRule?: SetupSuggestionKey }>(
  existing: T[],
  suggestions: T[],
) => {
  const next = [...existing];

  suggestions.forEach((suggestion) => {
    const autoRuleIndex = next.findIndex((entry) => entry.autoRule && suggestion.autoRule && entry.autoRule === suggestion.autoRule);
    if (autoRuleIndex >= 0) {
      const previous = next[autoRuleIndex];
      next[autoRuleIndex] = previous.itemId
        ? {
            ...previous,
            quantity: suggestion.quantity,
            autoRule: suggestion.autoRule,
            notes: previous.notes || suggestion.notes,
          }
        : {
            ...previous,
            ...suggestion,
            notes: previous.notes || suggestion.notes,
          };
      return;
    }

    const sameItemIndex = next.findIndex((entry) => entry.itemId && suggestion.itemId && entry.itemId === suggestion.itemId);
    if (sameItemIndex >= 0) {
      const previous = next[sameItemIndex];
      next[sameItemIndex] = {
        ...previous,
        ...suggestion,
        notes: previous.notes || suggestion.notes,
      };
      return;
    }

    next.push(suggestion);
  });

  return next;
};

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
  const { isSales, isAdmin, isCreative, isLinen, isPurchasing } = useRole();
  const editorTab = searchParams.get('tab');
  const tastingId = searchParams.get('tasting');
  const isEditMode = Boolean(editingContractId);
  const isCreativeInventoryEditor = isEditMode && isCreative() && !isSales() && !isAdmin();
  const isLinenInventoryEditor = isEditMode && isLinen() && !isSales() && !isAdmin();
  const isStockroomInventoryEditor = isEditMode && isPurchasing() && !isSales() && !isAdmin();
  const isInventoryDraftEditor = isCreativeInventoryEditor || isLinenInventoryEditor || isStockroomInventoryEditor;
  
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
  const [creativeAssets, setCreativeAssets] = useState<CreativeAssetEntry[]>([]);
  const [linenRequirements, setLinenRequirements] = useState<LinenRequirementEntry[]>([]);
  const [stockroomRequirements, setStockroomRequirements] = useState<StockroomRequirementEntry[]>([]);
  const [suggestedSetupFeedback, setSuggestedSetupFeedback] = useState<SuggestedSetupFeedback | null>(null);
  const [isApplyingSuggestedSetup, setIsApplyingSuggestedSetup] = useState(false);

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
    if (isInventoryDraftEditor) {
      setActiveTab('addons');
      return;
    }

    if (!editorTab) {
      return;
    }

    const validTabs = ['client', 'event', 'package', 'addons', 'summary'];
    if (validTabs.includes(editorTab)) {
      setActiveTab(editorTab);
    }
  }, [editorTab, isInventoryDraftEditor]);

  const showCreativeEditorSection = !isInventoryDraftEditor || isCreativeInventoryEditor;
  const showLinenEditorSection = !isInventoryDraftEditor || isLinenInventoryEditor;
  const showStockroomEditorSection = !isInventoryDraftEditor || isStockroomInventoryEditor;
  const inventoryEditorTitle = isCreativeInventoryEditor
    ? 'Creative Inventory Draft Review'
    : isLinenInventoryEditor
      ? 'Linen Inventory Draft Review'
      : 'Stockroom Inventory Draft Review';
  const inventoryEditorDescription = isCreativeInventoryEditor
    ? 'Review the saved creative items for this draft contract, add missing decor assets, then save your validation back to the contract.'
    : isLinenInventoryEditor
      ? 'Review the saved linen items for this draft contract, add any missing pieces, then save your validation back to the contract.'
      : 'Review the saved stockroom items for this draft contract, add missing equipment, then save your validation back to the contract.';

  const mapCreativeItemsWithPrice = (items: CreativeItem[]) => {
    return items.map(item => ({
      ...item,
      pricePerItem: [item.pricePerItem, item.acquisition?.cost].find((value) => Number(value) > 0) ?? buildStableFallbackPrice(`${item.itemCode} ${item.name} ${item.category}`, 100, 600),
    }));
  };

  const mapLinenItemsWithPrice = (items: LinenItem[]) => {
    return items.map(item => ({
      ...item,
      pricePerItem: [item.pricePerItem, item.acquisition?.cost].find((value) => Number(value) > 0) ?? buildStableFallbackPrice(`${item.itemCode} ${item.name} ${item.color} ${item.material}`, 20, 70),
    }));
  };

  const mapStockroomItemsWithPrice = (items: StockroomItem[]) => {
    return items.map(item => ({
      ...item,
      pricePerItem: [
        item.pricePerItem,
        item.rentalPricePerDay,
        item.purchasePrice,
      ].find((value) => Number(value) > 0) ?? buildStableFallbackPrice(`${item.itemCode} ${item.name} ${item.category}`, 150, 850),
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
        occasion: '',
        venue: parsedVenue.venue,
        hall: parsedVenue.hall,
        venueAddress: contract.venue?.address || '',
        eventDate: contract.eventDate || '',
        arrivalOfGuests: parsedNotes.arrivalOfGuests,
        servingTime: parsedNotes.servingTime,
        vipGuests: '',
        regularGuests: guestCount > 0 ? String(guestCount) : '',
        themeSetup: '',
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
            pricePerItem: item.pricePerItem || 0,
          }
        : entry
    ));
  };

  const loadSuggestedSetupInventory = async () => {
    const [linenRes, stockroomRes] = await Promise.all([
      api.request('/linen-inventory?limit=100'),
      api.request('/stockroom-inventory?limit=100'),
    ]);

    const nextLinenItems = mapLinenItemsWithPrice((linenRes as LinenItem[]) || []);
    const nextStockroomItems = mapStockroomItemsWithPrice((stockroomRes as StockroomItem[]) || []);

    setLinenItems(nextLinenItems);
    setStockroomItems(nextStockroomItems);

    return {
      nextLinenItems,
      nextStockroomItems,
    };
  };

  const handleApplySuggestedSetup = async () => {
    if (seatedGuestCount <= 0) {
      toast.error('Enter the seated guest count first.');
      return;
    }

    setIsApplyingSuggestedSetup(true);

    try {
      const { nextLinenItems, nextStockroomItems } = await loadSuggestedSetupInventory();
      const matched: SuggestedSetupFeedback['matched'] = [];
      const missing: SetupSuggestionKey[] = [];
      const nextStockroomSuggestions: StockroomRequirementEntry[] = [];
      const nextLinenSuggestions: LinenRequirementEntry[] = [];

      const addStockroomSuggestion = (key: Exclude<SetupSuggestionKey, 'tablecloths'>, quantity: number) => {
        if (quantity <= 0) {
          return;
        }

        const matchedItem = findBestStockroomMatch(nextStockroomItems, key);
        if (!matchedItem) {
          missing.push(key);
          return;
        }

        matched.push({
          key,
          itemName: matchedItem.name,
          quantity,
        });

        nextStockroomSuggestions.push({
          itemId: matchedItem._id,
          itemName: matchedItem.name,
          category: matchedItem.category || '',
          itemCode: matchedItem.itemCode || '',
          imageUrl: getPrimaryImage(matchedItem.images),
          availableQuantity: matchedItem.availableQuantity || 0,
          quantity,
          pricePerItem: matchedItem.pricePerItem || 0,
          notes: buildAutoSetupNote(key, seatedGuestCount, suggestedTableCount),
          autoRule: key,
        });
      };

      const addLinenSuggestion = (key: 'tablecloths', quantity: number) => {
        if (quantity <= 0) {
          return;
        }

        const matchedItem = findBestLinenMatch(nextLinenItems, key);
        if (!matchedItem) {
          missing.push(key);
          return;
        }

        matched.push({
          key,
          itemName: matchedItem.name,
          quantity,
        });

        nextLinenSuggestions.push({
          itemId: matchedItem._id,
          itemName: matchedItem.name,
          category: matchedItem.category || '',
          itemCode: matchedItem.itemCode || '',
          imageUrl: getPrimaryImage(matchedItem.images),
          availableQuantity: matchedItem.availableQuantity || 0,
          size: matchedItem.size || '',
          material: matchedItem.material || '',
          color: matchedItem.color || '',
          quantity,
          pricePerItem: matchedItem.pricePerItem || 0,
          notes: buildAutoSetupNote(key, seatedGuestCount, suggestedTableCount),
          autoRule: key,
        });
      };

      addStockroomSuggestion('tables', suggestedTableCount);
      addStockroomSuggestion('chairs', seatedGuestCount);
      addStockroomSuggestion('plates', seatedGuestCount);
      addStockroomSuggestion('utensils', seatedGuestCount);
      addStockroomSuggestion('glasses', seatedGuestCount);
      addLinenSuggestion('tablecloths', suggestedTableCount);

      if (!nextStockroomSuggestions.length && !nextLinenSuggestions.length) {
        toast.error('No matching inventory items were found for the suggested setup.');
        setSuggestedSetupFeedback({
          guestCount: seatedGuestCount,
          tableCount: suggestedTableCount,
          matched,
          missing,
        });
        return;
      }

      if (nextStockroomSuggestions.length) {
        setStockroomRequirements((prev) => mergeSuggestedEntries(prev, nextStockroomSuggestions));
      }

      if (nextLinenSuggestions.length) {
        setLinenRequirements((prev) => mergeSuggestedEntries(prev, nextLinenSuggestions));
      }

      setSuggestedSetupFeedback({
        guestCount: seatedGuestCount,
        tableCount: suggestedTableCount,
        matched,
        missing,
      });

      if (missing.length > 0) {
        toast.warning(`Suggested setup applied. Still missing inventory matches for: ${missing.map((key) => AUTO_SETUP_LABELS[key]).join(', ')}.`);
      } else {
        toast.success('Suggested setup applied to the contract.');
      }
    } catch (error) {
      toast.error('Failed to build the guest-based setup.');
    } finally {
      setIsApplyingSuggestedSetup(false);
    }
  };

  const buildClientNotes = () => {
    const notes = [
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

  const seatedGuestCount = useMemo(() => {
    const vip = parseInt(clientInfo.vipGuests) || 0;
    const regular = parseInt(clientInfo.regularGuests) || 0;
    return vip + regular;
  }, [clientInfo.vipGuests, clientInfo.regularGuests]);

  // Total guests = VIP + Regular + 25 extra buffer
  const totalGuests = useMemo(() => {
    return seatedGuestCount + 25;
  }, [seatedGuestCount]);

  const suggestedTableCount = useMemo(() => {
    return seatedGuestCount > 0 ? Math.ceil(seatedGuestCount / GUESTS_PER_TABLE) : 0;
  }, [seatedGuestCount]);

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

    setMenuSelections(prev => {
      const currentSelections = prev[category] || [];
      const exists = currentSelections.includes(itemName);

      if (exists) {
        return { ...prev, [category]: currentSelections.filter(i => i !== itemName) };
      }

      const categoryType = getCategoryType(category);
      const nextSelectionCountForCategory = currentSelections.length + 1;

      if (categoryType === 'main') {
        const totalSelectedMains = MAIN_MENU_KEYS.reduce((count, key) => count + (prev[key]?.length || 0), 0);
        if (totalSelectedMains >= pkg.inclusions.mains) {
          toast.warning(`Package allows only ${pkg.inclusions.mains} main dish selection(s) total.`);
          return prev;
        }
      } else if (categoryType === 'side') {
        const totalSelectedSides = SIDE_MENU_KEYS.reduce((count, key) => count + (prev[key]?.length || 0), 0);
        if (totalSelectedSides >= pkg.inclusions.sides) {
          toast.warning(`Package allows only ${pkg.inclusions.sides} side dish selection(s) total.`);
          return prev;
        }
      } else if (category === 'dessert' && nextSelectionCountForCategory > pkg.inclusions.desserts) {
        toast.warning(`Package allows only ${pkg.inclusions.desserts} dessert selection(s).`);
        return prev;
      } else if (category === 'drinks' && nextSelectionCountForCategory > pkg.inclusions.drinks) {
        toast.warning(`Package allows only ${pkg.inclusions.drinks} drink selection(s).`);
        return prev;
      }

      return { ...prev, [category]: [...currentSelections, itemName] };
    });
  };

  const getOrderedValidationEntries = (validationErrors: Record<string, string>) => {
    const knownEntries = CONTRACT_ERROR_FIELD_ORDER
      .filter((field) => validationErrors[field])
      .map((field) => [field, validationErrors[field]] as [string, string]);
    const knownFields = new Set(knownEntries.map(([field]) => field));
    const remainingEntries = Object.entries(validationErrors).filter(([field]) => !knownFields.has(field));

    return [...knownEntries, ...remainingEntries];
  };

  const focusTabForErrorField = (field?: string) => {
    const nextTab = field ? CONTRACT_ERROR_TAB_BY_FIELD[field] : undefined;
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const getCategoryType = (category: string): 'main' | 'side' | 'other' => {
    if (MAIN_MENU_KEYS.includes(category as typeof MAIN_MENU_KEYS[number])) return 'main';
    if (SIDE_MENU_KEYS.includes(category as typeof SIDE_MENU_KEYS[number])) return 'side';
    return 'other';
  };

  const getSelectedMainsCount = () => {
    return MAIN_MENU_KEYS.reduce((count, cat) => {
      return count + (menuSelections[cat]?.length || 0);
    }, 0);
  };

  const getSelectedSidesCount = () => {
    return SIDE_MENU_KEYS.reduce((count, cat) => {
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
      const dessertCount = menuSelections.dessert?.length || 0;
      const drinksCount = menuSelections.drinks?.length || 0;
      const menuIssues: string[] = [];

      if (mainsCount !== pkg.inclusions.mains) {
        menuIssues.push(`Select exactly ${pkg.inclusions.mains} main dish(es) (${mainsCount} selected).`);
      }
      if (sidesCount !== pkg.inclusions.sides) {
        menuIssues.push(`Select exactly ${pkg.inclusions.sides} side dish(es) (${sidesCount} selected).`);
      }
      if (dessertCount !== pkg.inclusions.desserts) {
        menuIssues.push(`Select exactly ${pkg.inclusions.desserts} dessert(s) (${dessertCount} selected).`);
      }
      if (drinksCount !== pkg.inclusions.drinks) {
        menuIssues.push(`Select exactly ${pkg.inclusions.drinks} drink(s) (${drinksCount} selected).`);
      }

      if (menuIssues.length > 0) {
        newErrors.menu = menuIssues.join(' ');
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (isInventoryDraftEditor) {
      if (!editingContractId) {
        toast.error('Draft inventory validation is only available while editing an existing contract.');
        return;
      }

      setIsSubmitting(true);

      try {
        const inventoryPayload = isCreativeInventoryEditor
          ? {
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
            }
          : isLinenInventoryEditor
            ? {
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
              }
            : {
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
              };

        await api.updateContract(editingContractId, inventoryPayload);
        toast.success(
          isCreativeInventoryEditor
            ? 'Creative draft items updated.'
            : isLinenInventoryEditor
              ? 'Linen draft items updated.'
              : 'Stockroom draft items updated.'
        );
        navigate(`/contracts/${editingContractId}?tab=inventory`);
      } catch (error: any) {
        const firstBackendValidation = Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors[0] : null;
        const primaryMessage = Array.isArray(error?.issues) && error.issues.length > 0
          ? error.issues[0]
          : firstBackendValidation?.msg || firstBackendValidation?.message || error?.detail || error?.message || 'Failed to save draft inventory';
        toast.error(primaryMessage);
        if (Array.isArray(error?.issues) && error.issues.length > 1) {
          toast.info(`There ${error.issues.length - 1 === 1 ? 'is' : 'are'} ${error.issues.length - 1} more inventory issue(s) to review.`);
        }
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const validationErrors = validateForm();
    const orderedValidationEntries = getOrderedValidationEntries(validationErrors);

    if (orderedValidationEntries.length > 0) {
      const [firstField, firstMessage] = orderedValidationEntries[0];
      focusTabForErrorField(firstField);
      toast.error(firstMessage);
      if (orderedValidationEntries.length > 1) {
        toast.info(`There ${orderedValidationEntries.length - 1 === 1 ? 'is' : 'are'} ${orderedValidationEntries.length - 1} more field(s) to review.`);
      }
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
        eventType: clientInfo.eventType,
        packageSelected: selectedPackage,
        totalPacks: totalGuests,
        menuDetails: buildMenuDetails(),
        preferredColor: clientInfo.colorMotif,
        specialRequests: buildClientNotes(),
        creativeRequirements: {
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
      const firstBackendValidation = Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors[0] : null;
      const primaryMessage = Array.isArray(error?.issues) && error.issues.length > 0
        ? error.issues[0]
        : firstBackendValidation?.msg || firstBackendValidation?.message || error?.detail || error?.message || '';
      const backendField = BACKEND_CONTRACT_ERROR_FIELD_MAP[firstBackendValidation?.path || firstBackendValidation?.param || '']
        || firstBackendValidation?.path
        || firstBackendValidation?.param
        || inferFieldFromContractIssue(primaryMessage)
        || '';

      focusTabForErrorField(backendField);
      toast.error(primaryMessage || (isEditMode ? 'Failed to update contract' : 'Failed to create contract'));
      if (Array.isArray(error?.issues) && error.issues.length > 1) {
        toast.info(`There ${error.issues.length - 1 === 1 ? 'is' : 'are'} ${error.issues.length - 1} more contract issue(s) to fix before saving.`);
      } else if (Array.isArray(error?.errors) && error.errors.length > 1) {
        toast.info(`There ${error.errors.length - 1 === 1 ? 'is' : 'are'} ${error.errors.length - 1} more contract validation issue(s) to fix.`);
      }
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
              {isInventoryDraftEditor
                ? inventoryEditorTitle
                : isEditMode
                  ? 'Edit Contract'
                  : tastingId
                    ? 'Create Contract from Tasting'
                    : 'New Contract'}
            </h1>
            <p className="text-muted-foreground">
              {isInventoryDraftEditor
                ? inventoryEditorDescription
                : 'All pricing is calculated automatically based on your selections.'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {isInventoryDraftEditor ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="addons">Draft Inventory Review</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="client">Client Info</TabsTrigger>
              <TabsTrigger value="event">Event Details</TabsTrigger>
              <TabsTrigger value="package">Package & Menu</TabsTrigger>
              <TabsTrigger value="addons">Add-ons</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
          )}

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
                    <FieldLabel required>Full Name</FieldLabel>
                    <Input
                      value={clientInfo.celebratorName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorName: e.target.value }))}
                      placeholder="e.g., Maria Santos"
                      className={errors.celebratorName ? 'border-red-500' : ''}
                    />
                    {errors.celebratorName && <p className="text-sm text-red-500">{errors.celebratorName}</p>}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel required>Mobile Number (11 digits)</FieldLabel>
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
                    <FieldLabel required>Email Address</FieldLabel>
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
                    <FieldLabel required>Complete Address</FieldLabel>
                    <Input
                      value={clientInfo.celebratorAddress}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, celebratorAddress: e.target.value }))}
                      placeholder="Street, City, Province ZIP"
                      className={errors.celebratorAddress ? 'border-red-500' : ''}
                    />
                    {errors.celebratorAddress && <p className="text-sm text-red-500">{errors.celebratorAddress}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Representative Information (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel optional>Representative Name</FieldLabel>
                    <Input
                      value={clientInfo.representativeName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, representativeName: e.target.value }))}
                      placeholder="e.g., John Santos"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Relationship</FieldLabel>
                    <Input
                      value={clientInfo.representativeRelationship}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, representativeRelationship: e.target.value }))}
                      placeholder="e.g., Husband, Mother"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <FieldLabel optional>Mobile Number</FieldLabel>
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
                <CardTitle>Coordinator Information (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel optional>Coordinator Name</FieldLabel>
                    <Input
                      value={clientInfo.coordinatorName}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, coordinatorName: e.target.value }))}
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Mobile Number</FieldLabel>
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
                <div className="space-y-2 md:max-w-md">
                  <FieldLabel required>Event Type</FieldLabel>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel required>Event Date</FieldLabel>
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
                    <FieldLabel optional>Arrival of Guests</FieldLabel>
                    <Input
                      type="time"
                      value={clientInfo.arrivalOfGuests}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, arrivalOfGuests: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel required>Venue</FieldLabel>
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
                      <FieldLabel optional>Hall / Function Room</FieldLabel>
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
                    <FieldLabel optional>Venue Address</FieldLabel>
                    <Input value={clientInfo.venueAddress} disabled />
                  </div>
                )}

                {/* Guest Count - VIP + Regular = Total */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Guest Count</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <FieldLabel optional>VIP Guests</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={clientInfo.vipGuests}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, vipGuests: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel required>Regular Guests</FieldLabel>
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

                <div className="space-y-2 md:max-w-md">
                  <FieldLabel optional>Color Motif</FieldLabel>
                  <Input
                    value={clientInfo.colorMotif}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, colorMotif: e.target.value }))}
                    placeholder="e.g., Blush Pink & Gold"
                  />
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
                  Select Package *
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
                  <CardTitle>Menu Selection *</CardTitle>
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
            {isInventoryDraftEditor ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Draft Contract Context</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Client</p>
                    <p className="mt-2 font-medium">{clientInfo.celebratorName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Event Date</p>
                    <p className="mt-2 font-medium">{eventDate ? format(eventDate, 'PPP') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Venue</p>
                    <p className="mt-2 font-medium">{clientInfo.venue ? `${clientInfo.venue}${clientInfo.hall ? ` - ${clientInfo.hall}` : ''}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Guest Count</p>
                    <p className="mt-2 font-medium">{totalGuests.toLocaleString()} total ({seatedGuestCount.toLocaleString()} seated)</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!isInventoryDraftEditor ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Guest-Based Setup
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Based on {seatedGuestCount.toLocaleString()} seated guests. Food still uses the separate +25 buffer, while the setup below focuses on actual guest seating. You can apply this once, then still edit every row manually.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      { key: 'tables', value: suggestedTableCount, note: `1 per ${GUESTS_PER_TABLE} guests` },
                      { key: 'chairs', value: seatedGuestCount, note: '1 per guest' },
                      { key: 'plates', value: seatedGuestCount, note: '1 per guest' },
                      { key: 'utensils', value: seatedGuestCount, note: '1 set per guest' },
                      { key: 'glasses', value: seatedGuestCount, note: '1 per guest' },
                      { key: 'tablecloths', value: suggestedTableCount, note: 'Matches table count' },
                    ].map((item) => (
                      <div key={item.key} className="rounded-lg border bg-background/80 p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          {AUTO_SETUP_LABELS[item.key as SetupSuggestionKey]}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{item.value.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 rounded-lg border bg-background/80 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Core dining setup only</p>
                      <p className="text-muted-foreground">
                        This updates the core stockroom and linen rows with guest-based quantities. Manual extras stay untouched, and you can still swap items, change quantities, or remove rows afterward.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleApplySuggestedSetup}
                      disabled={isApplyingSuggestedSetup || seatedGuestCount <= 0}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      {isApplyingSuggestedSetup ? 'Applying Setup...' : 'Apply Suggested Setup'}
                    </Button>
                  </div>

                  {suggestedSetupFeedback ? (
                    <div className="rounded-lg border bg-background/70 p-4">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="font-medium">Latest applied setup</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestedSetupFeedback.guestCount.toLocaleString()} seated guests | {suggestedSetupFeedback.tableCount.toLocaleString()} suggested tables
                        </p>
                      </div>

                      {suggestedSetupFeedback.matched.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestedSetupFeedback.matched.map((item) => (
                            <Badge key={`${item.key}-${item.itemName}`} variant="outline" className="bg-background">
                              {AUTO_SETUP_LABELS[item.key]}: {item.itemName} x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      {suggestedSetupFeedback.missing.length > 0 ? (
                        <p className="mt-3 text-sm text-amber-700">
                          Still needs a manual inventory match for: {suggestedSetupFeedback.missing.map((key) => AUTO_SETUP_LABELS[key]).join(', ')}.
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-green-700">
                          All core setup items found matching inventory rows.
                        </p>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {showCreativeEditorSection ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Creative / Decor Items (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <FieldLabel optional>Selected Creative Items</FieldLabel>
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
            ) : null}

            {showLinenEditorSection ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="h-5 w-5" />
                  Linen Items (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <FieldLabel optional>Selected Linen Items</FieldLabel>
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
                              <div className="flex flex-wrap items-center gap-2">
                                {item.autoRule ? (
                                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                    Auto setup
                                  </Badge>
                                ) : null}
                                <span>{item.itemCode || 'No code'} | {item.material || 'No material'} | {item.color || 'No color'}</span>
                              </div>
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
            ) : null}

            {showStockroomEditorSection ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Stockroom Items (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <FieldLabel optional>Selected Stockroom Items</FieldLabel>
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
                                getItemSummary={(stockroomItem) => `${stockroomItem.itemCode || 'No code'} | ${stockroomItem.category || 'No category'} | ${stockroomItem.availableQuantity} available | ${formatCurrency(stockroomItem.pricePerItem || 0)}`}
                          />
                          {item.itemId ? (
                            <div className="text-xs text-muted-foreground">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.autoRule ? (
                                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                    Auto setup
                                  </Badge>
                                ) : null}
                                <span>{item.itemCode || 'No code'} | {item.category || 'No category'}</span>
                              </div>
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
            ) : null}

            {isInventoryDraftEditor ? (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate(`/contracts/${editingContractId}?tab=inventory`)}>
                  Back To Contract
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving Inventory...' : 'Save Inventory Draft'}
                </Button>
              </div>
            ) : (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('package')}>Back</Button>
                <Button onClick={() => setActiveTab('summary')}>
                  Next: Summary <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* SUMMARY TAB */}
          {!isInventoryDraftEditor ? (
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
          ) : null}
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


