export type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";
export type ChatFeedback = "LIKE" | "DISLIKE" | null;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  feedback: ChatFeedback;
  approved: boolean | null;
  createdAt: string;
  pending?: boolean;
  reworkPending?: boolean;
}
