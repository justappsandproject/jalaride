export type UserRole = "RIDER" | "DRIVER" | "ADMIN";

export type DriverStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  driverStatus?: DriverStatus;
}

export interface RideDto {
  id: string;
  riderId: string;
  driverId: string | null;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originLabel: string | null;
  destLabel: string | null;
  category: string;
  status: RideStatus;
  fareEstimate: number | null;
  fareFinal: number | null;
  createdAt: string;
  updatedAt: string;
}
