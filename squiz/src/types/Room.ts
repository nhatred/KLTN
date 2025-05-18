import { Quiz } from "./Quiz";

export type RoomStatus = 'scheduled' | 'active' | 'completed';

export interface Room {
  _id: string;
  status: RoomStatus;
  host: string;
  roomCode: string;
  createdAt: string;
  updatedAt: string;
  quiz: Quiz;
  startTime: string | null;
  durationMinutes: number;
  participants: string[];
  questionOrder: string[];
  isActive: boolean;
  autoStart: boolean;
  lastActivationCheck: string | null;
}

export interface GroupedRooms {
  scheduled: Room[];
  active: Room[];
  completed: Room[];
}