import api from "@/lib/axios";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  phone?: string;
}

interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

export const userService = {
  updateMe: async (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    const res = await api.put("/users/me", payload);
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<{ message: string; user: UserProfile }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
    },
};