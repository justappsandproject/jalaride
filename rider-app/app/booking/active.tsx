import { ImmersiveRideCard } from '@/components/ImmersiveRideCard';

const DEMO_TRIP = {
  driverName: 'Adeyemi James',
  driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  rating: 4.9,
  totalTrips: 2341,
  vehicleMake: 'Toyota',
  vehicleModel: 'Corolla',
  vehicleYear: 2022,
  vehicleColor: 'White',
  plateNumber: 'JA-234-ABA',
  dssCleared: true,
  policeCleared: true,
  ninVerified: true,
  eta: '4 mins away',
  pickupAddress: 'Wuse Market, Abuja',
  dropoffAddress: 'Maitama, Abuja',
  estimatedFare: 1850,
  shareToken: 'demo-share-token',
  status: 'driver_en_route',
};

export default function ActiveRideScreen() {
  return (
    <ImmersiveRideCard
      trip={DEMO_TRIP}
      onCall={() => {}}
    />
  );
}
