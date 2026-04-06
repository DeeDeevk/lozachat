import api from "@/lib/axios";

export const otpService = {
  // gửi OTP
  async sendOTP(email: string) {
    const res = await api.post("/otp/send", { email });
    return res.data.message;
  },

  // verify OTP
  async verifyOTP(email: string, otp: string) {
    const res = await api.post("/otp/verify", { email, otp });
    return res.data.message;
  },

  // reset password (sau khi verify)
  async resetPassword(email: string, newPassword: string) {
    const res = await api.post("/otp/reset", {
      email,
      newPassword,
    });
    return res.data.message;
  },
};