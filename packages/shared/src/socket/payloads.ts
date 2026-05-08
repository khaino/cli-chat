export interface SendMessagePayload {
  chatId: string;
  senderId: string;
  content: string;
}

export interface TypingPayload {
  chatId: string;
  userId: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  online: boolean;
}

export interface TypingIndicatorPayload {
  userId: string;
}
