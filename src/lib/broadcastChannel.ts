/**
 * Broadcast Channel để giao tiếp giữa các tab
 * Khi user đăng nhập/đăng xuất ở tab 1, sẽ thông báo cho tab 2, 3...
 */

let channel: BroadcastChannel | null = null;

export const getBroadcastChannel = (): BroadcastChannel => {
  if (!channel) {
    channel = new BroadcastChannel("auth-channel");
  }
  return channel;
};

export const closeBroadcastChannel = () => {
  if (channel) {
    channel.close();
    channel = null;
  }
};
