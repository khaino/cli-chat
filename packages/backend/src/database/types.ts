/**
 * Backend-only user shape that includes the password hash.
 * The frontend only ever sees `SafeUser` from `@cli-chat/shared`.
 */
export interface UserRecord {
  id: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}
