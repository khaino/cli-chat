import {
  ApiPaths,
  type LoginResponse,
  type GetUsersResponse,
  type StartChatResponse,
  type GetMessagesResponse,
} from '@cli-chat/shared';

export type UsersFilter = 'all' | 'online';

export interface ApiClient {
  login(username: string, password: string): Promise<LoginResponse>;
  getUsers(filter?: UsersFilter): Promise<GetUsersResponse>;
  startChat(currentUserId: string, targetUserId: string): Promise<StartChatResponse>;
  getMessages(chatId: string): Promise<GetMessagesResponse>;
}

export interface HttpApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export function createHttpApiClient({
  baseUrl,
  fetchImpl = fetch,
}: HttpApiClientOptions): ApiClient {
  const url = (path: string) => `${baseUrl}${path}`;

  return {
    async login(username, password) {
      const res = await fetchImpl(url(ApiPaths.Login), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return (await res.json()) as LoginResponse;
    },

    async getUsers(filter = 'all') {
      const query = filter === 'online' ? '?online=true' : '';
      const res = await fetchImpl(url(`${ApiPaths.Users}${query}`));
      return (await res.json()) as GetUsersResponse;
    },

    async startChat(currentUserId, targetUserId) {
      const res = await fetchImpl(url(ApiPaths.ChatStart), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, targetUserId }),
      });
      return (await res.json()) as StartChatResponse;
    },

    async getMessages(chatId) {
      const res = await fetchImpl(url(ApiPaths.ChatMessages(chatId)));
      return (await res.json()) as GetMessagesResponse;
    },
  };
}
