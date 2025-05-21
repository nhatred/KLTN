export interface Participant {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  quizRoom: string;
  connectionId?: string;
  lastActive?: Date;
}
