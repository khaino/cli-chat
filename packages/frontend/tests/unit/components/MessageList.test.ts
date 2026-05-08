import {
  capitalize,
  formatClockTime,
  groupMessages,
  wrapText,
} from '../../../src/components/MessageList.js';
import type { MessageWithSender } from '@cli-chat/shared';

function msg(
  id: string,
  senderId: string,
  username: string,
  content: string,
  isoTime: string
): MessageWithSender {
  return {
    id,
    chat_id: 'c1',
    sender_id: senderId,
    sender_username: username,
    content,
    created_at: isoTime,
  };
}

describe('formatClockTime', () => {
  test('formats morning hours in 12-hour clock', () => {
    expect(formatClockTime(new Date('2024-01-01T07:46:00.000Z').toISOString()))
      .toMatch(/^\d{1,2}:46 (AM|PM)$/);
  });

  test('renders midnight as 12 AM and noon as 12 PM (local)', () => {
    const midnight = new Date(2024, 0, 1, 0, 5);
    const noon = new Date(2024, 0, 1, 12, 5);
    expect(formatClockTime(midnight)).toBe('12:05 AM');
    expect(formatClockTime(noon)).toBe('12:05 PM');
  });

  test('returns empty string for invalid input', () => {
    expect(formatClockTime('not-a-date')).toBe('');
  });
});

describe('groupMessages', () => {
  test('returns empty list for no messages', () => {
    expect(groupMessages([], 'me')).toEqual([]);
  });

  test('flags own messages with isOwn=true', () => {
    const groups = groupMessages(
      [msg('m1', 'me', 'bob', 'hi', '2024-01-01T00:00:00.000Z')],
      'me'
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].isOwn).toBe(true);
    expect(groups[0].senderUsername).toBe('bob');
  });

  test('groups same-author messages within 60s into one group', () => {
    const groups = groupMessages(
      [
        msg('m1', 'u2', 'alice', 'Hello', '2024-01-01T00:00:00.000Z'),
        msg('m2', 'u2', 'alice', 'hi', '2024-01-01T00:00:30.000Z'),
        msg('m3', 'u2', 'alice', 'how are you?', '2024-01-01T00:00:55.000Z'),
      ],
      'me'
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].contents).toEqual(['Hello', 'hi', 'how are you?']);
  });

  test('breaks the group when the author changes', () => {
    const groups = groupMessages(
      [
        msg('m1', 'u2', 'alice', 'hi', '2024-01-01T00:00:00.000Z'),
        msg('m2', 'me', 'bob', 'hello', '2024-01-01T00:00:10.000Z'),
        msg('m3', 'u2', 'alice', 'how are you?', '2024-01-01T00:00:20.000Z'),
      ],
      'me'
    );
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.senderId)).toEqual(['u2', 'me', 'u2']);
  });

  test('breaks the group when more than 60 seconds elapse', () => {
    const groups = groupMessages(
      [
        msg('m1', 'u2', 'alice', 'first', '2024-01-01T00:00:00.000Z'),
        msg('m2', 'u2', 'alice', 'much later', '2024-01-01T00:02:00.000Z'),
      ],
      'me'
    );
    expect(groups).toHaveLength(2);
  });

  test('headerTime is taken from the first message of each group', () => {
    const groups = groupMessages(
      [
        msg('m1', 'u2', 'alice', 'A', '2024-01-01T07:46:00.000Z'),
        msg('m2', 'u2', 'alice', 'B', '2024-01-01T07:46:30.000Z'),
      ],
      'me'
    );
    expect(groups[0].headerTime).toMatch(/^\d{1,2}:46 (AM|PM)$/);
  });
});

describe('capitalize', () => {
  test('uppercases the first letter', () => {
    expect(capitalize('alice')).toBe('Alice');
    expect(capitalize('bob')).toBe('Bob');
  });

  test('leaves the rest of the string unchanged', () => {
    expect(capitalize('aLICE')).toBe('ALICE');
  });

  test('handles empty input', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('wrapText', () => {
  test('returns the original string as one line if shorter than width', () => {
    expect(wrapText('hello world', 20)).toEqual(['hello world']);
  });

  test('wraps at word boundaries when possible', () => {
    expect(wrapText('the quick brown fox', 10)).toEqual([
      'the quick',
      'brown fox',
    ]);
  });

  test('hard-splits words longer than the width', () => {
    expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  test('returns a single empty line for empty input', () => {
    expect(wrapText('', 10)).toEqual(['']);
  });

  test('collapses consecutive whitespace', () => {
    expect(wrapText('hi    there', 20)).toEqual(['hi there']);
  });
});
