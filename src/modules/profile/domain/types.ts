export interface Profile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roles: string[];
  permissions?: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}
