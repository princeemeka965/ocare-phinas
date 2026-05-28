export interface User {
  id: string;
  email: string;
  name: string;
  role?: "patient" | "provider" | "admin";
  avatarUrl?: string;
}
