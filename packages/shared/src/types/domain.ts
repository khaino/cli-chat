export interface SafeUser {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  online?: boolean;
}

export interface Chat {
  id: string;
  created_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender_username: string;
}
