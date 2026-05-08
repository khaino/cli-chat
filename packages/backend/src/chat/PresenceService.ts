export class PresenceService {
  private readonly userToSocket = new Map<string, string>();
  private readonly socketToUser = new Map<string, string>();

  setOnline(userId: string, socketId: string): void {
    const previousSocket = this.userToSocket.get(userId);
    if (previousSocket && previousSocket !== socketId) {
      this.socketToUser.delete(previousSocket);
    }
    this.userToSocket.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
  }

  setOfflineBySocket(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;
    this.socketToUser.delete(socketId);
    if (this.userToSocket.get(userId) === socketId) {
      this.userToSocket.delete(userId);
    }
    return userId;
  }

  isOnline(userId: string): boolean {
    return this.userToSocket.has(userId);
  }

  decorate<T extends { id: string }>(items: T[]): (T & { online: boolean })[] {
    return items.map((item) => ({ ...item, online: this.isOnline(item.id) }));
  }
}
