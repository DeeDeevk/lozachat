export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser extends User {
  role: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isNew?: boolean;
}

export type RequestStatus = "none" | "sent" | "received" | "friend" | "self";

export interface FriendRequest {
  _id: string;
  from?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };

  to?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };

  message: string;
  createdAt: string;
  updatedAt: string;
}
