export type VoteType = 'yes' | 'no' | 'meh';
export type RoomStatus = 'open' | 'closed';

export interface Room {
  id: string;
  code: string;
  question: string;
  created_at: string;
  duration_seconds: number;
  status: RoomStatus;
}

export interface Option {
  id: string;
  room_id: string;
  text: string;
  emoji: string;
}

export interface Vote {
  id: string;
  room_id: string;
  option_id: string;
  voter_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface OptionWithVotes extends Option {
  yes_count?: number;
  no_count?: number;
  meh_count?: number;
  user_vote?: VoteType | null;
}

export interface Profile {
  voter_id: string;
  display_name: string | null;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_rooms: number;
}
