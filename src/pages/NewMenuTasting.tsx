import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
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
import { addMonths, format, startOfDay } from 'date-fns';
import { CalendarIcon, ArrowLeft, Save, User, Mail, Phone, MapPin, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const getMinimumPreferredEventDate = () => startOfDay(addMonths(new Date(), 6));

export default function NewMenuTasting() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tastingDate, setTastingDate] = useState<Date>();
  const [preferredEventDate, setPreferredEventDate] = useState<Date | undefined>(() => getMinimumPreferredEventDate());
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: {
      street: '',
      city: '',
      province: '',
      zipCode: ''
    },
    eventType: '',
    expectedGuests: '',
    tastingTime: '',
    numberOfPax: '2',
    clientNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const minimumPreferredEventDate = getMinimumPreferredEventDate();

    // Name validation
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Name is required';
    } else if (formData.clientName.length < 2) {
      newErrors.clientName = 'Name must be at least 2 characters';
    } else if (formData.clientName.length > 100) {
      newErrors.clientName = 'Name cannot exceed 100 characters';
    }

    // Email validation
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Phone number is required';
    }

    // Address validation
    if (!formData.clientAddress.street.trim()) {
      newErrors['clientAddress.street'] = 'Street address is required';
    }
    if (!formData.clientAddress.city.trim()) {
      newErrors['clientAddress.city'] = 'City is required';
    }
    if (!formData.clientAddress.province.trim()) {
      newErrors['clientAddress.province'] = 'Province is required';
    }
    if (!formData.clientAddress.zipCode.trim()) {
      newErrors['clientAddress.zipCode'] = 'ZIP code is required';
    } else if (!/^\d{4,6}$/.test(formData.clientAddress.zipCode)) {
      newErrors['clientAddress.zipCode'] = 'Please enter a valid ZIP code (4-6 digits)';
    }

    // Event type validation
    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    // Expected guests validation
    if (!formData.expectedGuests) {
      newErrors.expectedGuests = 'Expected guests is required';
    } else {
      const guests = parseInt(formData.expectedGuests);
      if (guests < 1) {
        newErrors.expectedGuests = 'Must have at least 1 guest';
      } else if (guests > 5000) {
        newErrors.expectedGuests = 'Cannot exceed 5000 guests';
      }
    }

    // Tasting date validation
    if (!tastingDate) {
      newErrors.tastingDate = 'Tasting date is required';
    }

    // Preferred event date validation
    if (!preferredEventDate) {
      newErrors.preferredEventDate = 'Preferred event date is required';
    } else if (preferredEventDate < minimumPreferredEventDate) {
      newErrors.preferredEventDate = 'Preferred event date must be at least 6 months from today';
    }

    // Tasting time validation
    if (!formData.tastingTime) {
      newErrors.tastingTime = 'Tasting time is required';
    }

    // Number of pax validation
    const pax = parseInt(formData.numberOfPax);
    if (pax < 1) {
      newErrors.numberOfPax = 'Minimum 1 person';
    } else if (pax > 10) {
      newErrors.numberOfPax = 'Maximum 10 people for tasting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      clientAddress: { ...prev.clientAddress, [field]: value }
    }));
    if (errors[`clientAddress.${field}`]) {
      setErrors(prev => ({ ...prev, [`clientAddress.${field}`]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const tastingData = {
        ...formData,
        tastingDate: tastingDate!.toISOString(),
        preferredEventDate: preferredEventDate!.toISOString(),
        expectedGuests: parseInt(formData.expectedGuests),
        numberOfPax: parseInt(formData.numberOfPax)
      };

      await api.createMenuTasting(tastingData);
      toast.success('Menu tasting booked successfully!');
      navigate('/menu-tastings');
    } catch (error: any) {
      // Show detailed validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => e.msg || e.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else if (error.message?.includes('Validation failed')) {
        toast.error(error.message);
      } else {
        toast.error(error.message || 'Failed to book tasting');
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
            <h1 className="text-3xl font-bold tracking-tight">Book Menu Tasting</h1>
            <p className="text-muted-foreground">
              Schedule a menu tasting session for a new client
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="e.g., Maria Santos"
                    className={errors.clientName ? 'border-red-500' : ''}
                  />
                  {errors.clientName && (
                    <p className="text-sm text-red-500">{errors.clientName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      placeholder="e.g., maria@email.com"
                      className={`pl-10 ${errors.clientEmail ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.clientEmail && (
                    <p className="text-sm text-red-500">{errors.clientEmail}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                    placeholder="e.g., 0917-123-4567"
                    className={`pl-10 ${errors.clientPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.clientPhone && (
                  <p className="text-sm text-red-500">{errors.clientPhone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Client Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.clientAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="e.g., 123 Main Street, Apartment 4B"
                  className={errors['clientAddress.street'] ? 'border-red-500' : ''}
                />
                {errors['clientAddress.street'] && (
                  <p className="text-sm text-red-500">{errors['clientAddress.street']}</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.clientAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="e.g., Makati"
                    className={errors['clientAddress.city'] ? 'border-red-500' : ''}
                  />
                  {errors['clientAddress.city'] && (
                    <p className="text-sm text-red-500">{errors['clientAddress.city']}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={formData.clientAddress.province}
                    onChange={(e) => handleAddressChange('province', e.target.value)}
                    placeholder="e.g., Metro Manila"
                    className={errors['clientAddress.province'] ? 'border-red-500' : ''}
                  />
                  {errors['clientAddress.province'] && (
                    <p className="text-sm text-red-500">{errors['clientAddress.province']}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.clientAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    placeholder="e.g., 1200"
                    maxLength={6}
                    className={errors['clientAddress.zipCode'] ? 'border-red-500' : ''}
                  />
                  {errors['clientAddress.zipCode'] && (
                    <p className="text-sm text-red-500">{errors['clientAddress.zipCode']}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleInputChange('eventType', value)}
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
                  {errors.eventType && (
                    <p className="text-sm text-red-500">{errors.eventType}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedGuests">Expected Number of Guests *</Label>
                  <Input
                    id="expectedGuests"
                    type="number"
                    min="1"
                    max="5000"
                    value={formData.expectedGuests}
                    onChange={(e) => handleInputChange('expectedGuests', e.target.value)}
                    placeholder="e.g., 150"
                    className={errors.expectedGuests ? 'border-red-500' : ''}
                  />
                  {errors.expectedGuests && (
                    <p className="text-sm text-red-500">{errors.expectedGuests}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Event Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        errors.preferredEventDate ? 'border-red-500' : ''
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {preferredEventDate ? format(preferredEventDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={preferredEventDate}
                      onSelect={(date) => {
                        setPreferredEventDate(date);
                        if (errors.preferredEventDate) {
                          setErrors(prev => ({ ...prev, preferredEventDate: '' }));
                        }
                      }}
                      initialFocus
                      disabled={(date) => date < getMinimumPreferredEventDate()}
                    />
                  </PopoverContent>
                </Popover>
                {errors.preferredEventDate && (
                  <p className="text-sm text-red-500">{errors.preferredEventDate}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasting Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tasting Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tasting Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          errors.tastingDate ? 'border-red-500' : ''
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tastingDate ? format(tastingDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tastingDate}
                        onSelect={(date) => {
                          setTastingDate(date);
                          if (errors.tastingDate) {
                            setErrors(prev => ({ ...prev, tastingDate: '' }));
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.tastingDate && (
                    <p className="text-sm text-red-500">{errors.tastingDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tastingTime">Tasting Time *</Label>
                  <Select
                    value={formData.tastingTime}
                    onValueChange={(value) => handleInputChange('tastingTime', value)}
                  >
                    <SelectTrigger className={errors.tastingTime ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tastingTime && (
                    <p className="text-sm text-red-500">{errors.tastingTime}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPax">Number of People for Tasting *</Label>
                <Input
                  id="numberOfPax"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfPax}
                  onChange={(e) => handleInputChange('numberOfPax', e.target.value)}
                  className={errors.numberOfPax ? 'border-red-500' : ''}
                />
                {errors.numberOfPax && (
                  <p className="text-sm text-red-500">{errors.numberOfPax}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Maximum 10 people allowed for tasting session
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/menu-tastings')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Booking...' : 'Book Tasting'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
