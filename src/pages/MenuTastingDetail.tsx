import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { mockApi } from '@/services/mockApi';
import { ArrowLeft, Ban, Calendar, Clock, Trash2, Users, Phone, Mail, MapPin, User, Utensils, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MenuTasting {
  _id: string;
  tastingNumber: string;
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
  tastingDate: string;
  tastingTime: string;
  numberOfPax: number;
  menuItems: Array<{
    category: string;
    itemName: string;
    selected: boolean;
    notes: string;
  }>;
  status: string;
  contractCreated: boolean;
  contract?: string;
  clientNotes?: string;
  internalNotes?: string;
  feedback?: {
    rating: number;
    comments: string;
    itemsLiked: string[];
    itemsToChange: string[];
  };
}

export default function MenuTastingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useMock } = useAuth();
  const { isSales, isAdmin } = useRole();
  const [tasting, setTasting] = useState<MenuTasting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const tastingService = useMock ? mockApi : api;

  useEffect(() => {
    fetchTasting();
  }, [id]);

  const fetchTasting = async () => {
    try {
      setIsLoading(true);
      const data = await tastingService.getMenuTasting(id!);
      setTasting(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load tasting details');
      navigate('/menu-tastings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      booked: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const canManageTasting = isSales() || isAdmin();
  const canCancelBooking = canManageTasting && !!tasting && !tasting.contractCreated && ['booked', 'confirmed'].includes(tasting.status);
  const canDeleteBooking = canManageTasting && !!tasting && !tasting.contractCreated;

  const handleCancelBooking = async () => {
    if (!tasting) return;

    try {
      setIsCancelling(true);
      const updatedTasting = await tastingService.updateMenuTasting(tasting._id, { status: 'cancelled' });
      setTasting(updatedTasting);
      toast.success('Menu tasting booking cancelled.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!tasting) return;

    try {
      setIsDeleting(true);
      await tastingService.deleteMenuTasting(tasting._id);
      toast.success('Menu tasting booking deleted.');
      navigate('/menu-tastings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!tasting) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Menu tasting not found</p>
          <Button onClick={() => navigate('/menu-tastings')} className="mt-4">
            Back to Menu Tastings
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Menu Tasting Details</h1>
              <p className="text-muted-foreground">{tasting.tastingNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusBadge(tasting.status)}>
              {tasting.status.charAt(0).toUpperCase() + tasting.status.slice(1)}
            </Badge>
            {canCancelBooking && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this tasting booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This keeps the record for reference and frees the tasting slot for other bookings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling}>
                      {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canDeleteBooking && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this tasting booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the booking. Use this only if the tasting should no longer appear in your records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBooking} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete Booking'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{tasting.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email
                </p>
                <p className="font-medium">{tasting.clientEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone
                </p>
                <p className="font-medium">{tasting.clientPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Address
                </p>
                <p className="font-medium">
                  {tasting.clientAddress.street}, {tasting.clientAddress.city},{' '}
                  {tasting.clientAddress.province} {tasting.clientAddress.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Event Type</p>
                <p className="font-medium capitalize">{tasting.eventType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" /> Expected Guests
                </p>
                <p className="font-medium">{tasting.expectedGuests} guests</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferred Event Date</p>
                <p className="font-medium">
                  {format(new Date(tasting.preferredEventDate), 'MMMM d, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tasting Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Tasting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Tasting Date
                </p>
                <p className="font-medium">
                  {format(new Date(tasting.tastingDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Tasting Time
                </p>
                <p className="font-medium">{tasting.tastingTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Pax</p>
                <p className="font-medium">{tasting.numberOfPax} people</p>
              </div>
            </CardContent>
          </Card>

          {/* Contract Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasting.contractCreated ? (
                <div className="space-y-4">
                  <Badge className="bg-green-100 text-green-800">Contract Created</Badge>
                  <div>
                    <Link to={`/contracts/${tasting.contract}`}>
                      <Button variant="outline">View Contract</Button>
                    </Link>
                  </div>
                </div>
              ) : tasting.status === 'cancelled' ? (
                <div className="space-y-4">
                  <Badge className="bg-red-100 text-red-800">Booking Cancelled</Badge>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge className="bg-yellow-100 text-yellow-800">No Contract Yet</Badge>
                  <div>
                    <Link to={`/contracts/new?tasting=${tasting._id}`}>
                      <Button>Create Contract</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Items */}
          {tasting.menuItems && tasting.menuItems.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Menu Items for Tasting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tasting.menuItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        item.selected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <p className="font-medium">{item.itemName}</p>
                      {item.selected && (
                        <Badge className="mt-2 bg-green-100 text-green-800">Selected</Badge>
                      )}
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {tasting.feedback && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tasting Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-medium">{'⭐'.repeat(tasting.feedback.rating)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="font-medium">{tasting.feedback.comments}</p>
                </div>
                {tasting.feedback.itemsLiked && tasting.feedback.itemsLiked.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Items Liked</p>
                    <p className="font-medium">{tasting.feedback.itemsLiked.join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(tasting.clientNotes || tasting.internalNotes) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasting.clientNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Client Notes</p>
                    <p className="font-medium">{tasting.clientNotes}</p>
                  </div>
                )}
                {tasting.internalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Internal Notes</p>
                    <p className="font-medium">{tasting.internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
