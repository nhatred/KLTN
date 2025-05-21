import { Quiz } from "./Quiz";
import { Participant } from "./Participant";

export type RoomStatus = "scheduled" | "active" | "completed";

export interface Room {
  _id: string;
  status: RoomStatus;
  host: string;
  roomCode: string;
  createdAt: string;
  updatedAt: string;
  quiz: Quiz;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  participants: Participant[];
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
