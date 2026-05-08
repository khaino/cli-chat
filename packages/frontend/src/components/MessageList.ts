import type { MessageWithSender } from '@cli-chat/shared';

export interface MessageGroup {
  senderId: string;
  senderUsername: string;
  isOwn: boolean;
  headerTime: string;
  contents: string[];
}

const SAME_AUTHOR_WINDOW_MS = 60_000;

export function formatClockTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = minutes.toString().padStart(2, '0');
  return `${hours}:${mm} ${meridiem}`;
}

export function capitalize(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text];
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const lines: string[] = [];
  let current = '';

  const pushLong = (word: string) => {
    if (current) {
      lines.push(current);
      current = '';
    }
    for (let i = 0; i < word.length; i += maxWidth) {
      const chunk = word.slice(i, i + maxWidth);
      if (chunk.length === maxWidth) lines.push(chunk);
      else current = chunk;
    }
  };

  for (const word of words) {
    if (word.length > maxWidth) {
      pushLong(word);
    } else if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

export function groupMessages(
  messages: MessageWithSender[],
  currentUserId: string
): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let lastSenderId: string | null = null;
  let lastTimeMs = 0;

  for (const msg of messages) {
    const timeMs = new Date(msg.created_at).getTime();
    const sameAuthor = msg.sender_id === lastSenderId;
    const withinWindow = Math.abs(timeMs - lastTimeMs) <= SAME_AUTHOR_WINDOW_MS;

    if (sameAuthor && withinWindow && groups.length > 0) {
      groups[groups.length - 1].contents.push(msg.content);
    } else {
      groups.push({
        senderId: msg.sender_id,
        senderUsername: msg.sender_username,
        isOwn: msg.sender_id === currentUserId,
        headerTime: formatClockTime(msg.created_at),
        contents: [msg.content],
      });
    }

    lastSenderId = msg.sender_id;
    lastTimeMs = timeMs;
  }

  return groups;
}
