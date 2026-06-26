/* ------------------------------------------------------------------ *
 * Database row types — hand-written to mirror the Postgres schema in   *
 * supabase/migrations/0001_init.sql. These replace the types that used *
 * to come from `@prisma/client`. Column names are camelCase (the SQL   *
 * tables use quoted camelCase identifiers) so Supabase query results    *
 * line up 1:1 with these shapes. Money is whole naira (number).        *
 * ------------------------------------------------------------------ */

export type Condition = "new" | "used";
export type PlanType = "outright" | "solo" | "group";
export type PlanFrequency = "daily" | "weekly" | "monthly";
export type PlanStatus = "active" | "processing" | "delivered" | "completed" | "awaiting_substitution";
export type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "in_plan"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type GroupStatus = "open" | "closed" | "completed";
export type DeliveryMethod = "delivery" | "pickup";
export type TxnType = "deposit" | "allocation" | "delivery_deduction" | "surplus_return";
export type NotificationChannel = "sms" | "in_app";
export type AdminRole = "super" | "sub";
export type AdminPermission =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "groups"
  | "arrears"
  | "settings"
  | "team";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  phoneVerified: boolean;
  blocked: boolean;
  createdAt: string;
}

export interface Wallet {
  id: string;
  customerId: string;
  totalBalance: number;
  availableBalance: number;
  spentOnProducts: number;
}

export interface OtpCode {
  id: string;
  phone: string;
  codeHash: string;
  purpose: string;
  attempts: number;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  iconSvg: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  deliveryFee: number;
  stockQuantity: number;
  condition: Condition;
  images: string[];
  specs: unknown | null;
  active: boolean;
  createdAt: string;
  categoryId: string | null;
  brandId: string | null;
}

export interface Group {
  id: string;
  reference: string;
  name: string;
  totalSlots: number;
  slotsFilled: number;
  cycleLengthDays: number;
  status: GroupStatus;
  createdAt: string;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  customerId: string;
  position: number;
  slotsHeld: number;
  cycleNumber: number;
}

export interface Plan {
  id: string;
  customerId: string;
  type: PlanType;
  productId: string | null;
  productPrice: number;
  deliveryFee: number;
  slots: number;
  perPayment: number;
  frequency: PlanFrequency;
  startDate: string;
  amountAllocated: number;
  status: PlanStatus;
  groupId: string | null;
  originalProductId: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  customerId: string;
  status: OrderStatus;
  paymentPlan: PlanType;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipLandmark: string | null;
  planId: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  brand: string | null;
  condition: Condition;
  price: number;
  qty: number;
  image: string | null;
}

export interface PlanPayment {
  id: string;
  planId: string;
  periodIndex: number;
  amount: number;
  dueDate: string;
  confirmedAt: string;
  confirmedById: string | null;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TxnType;
  amount: number;
  planId: string | null;
  approved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  customerId: string;
  channel: NotificationChannel;
  type: string;
  planId: string | null;
  body: string;
  sentAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  mustChangePassword: boolean;
  disabled: boolean;
  createdById: string | null;
  createdAt: string;
}

export interface AdminPermissionGrant {
  id: string;
  adminUserId: string;
  permission: AdminPermission;
}

export interface Settings {
  id: string;
  storeName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  whatsappNumber: string;
  slotDaily: number;
  cycleDays: number;
  groupSlots: number;
  groupPriceCap: number;
}
