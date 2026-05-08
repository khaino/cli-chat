export const ApiPaths = {
  Login: '/api/login',
  Users: '/api/users',
  ChatStart: '/api/chat/start',
  ChatMessages: (chatId: string) => `/api/chat/${chatId}/messages`,
} as const;
