export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type MessageType = 'TEXT' | 'AI' | 'SYSTEM' | 'FILE' | 'IMAGE';

export interface UserSummary {
  pubId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
}

// ------------------------------------------
// CUSTOMER TYPES
// ------------------------------------------

export interface CustomerResponseDto {
  pubId: string;
  id: number;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  organizationPubId: string;
  ticketCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  organizationPubId: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
}

export interface CustomerFilterInput {
  search?: string;
}

export interface DeleteCustomerResponseDto {
  success: boolean;
  message: string;
}

// ------------------------------------------
// TICKET TYPES
// ------------------------------------------

export interface TicketCommentResponseDto {
  pubId: string;
  id: number;
  ticketPubId: string;
  content: string;
  author?: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketResponseDto {
  pubId: string;
  id: number;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customerPubId: string;
  customer?: CustomerResponseDto | null;
  assignedTo?: UserSummary | null;
  commentsCount?: number | null;
  comments?: TicketCommentResponseDto[] | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  customerPubId: string;
  title: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToUserPubId?: string;
  conversationPubId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToUserPubId?: string;
}

export interface AssignTicketInput {
  ticketPubId: string;
  assignedToUserPubId?: string | null;
}

export interface TicketFilterInput {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  customerPubId?: string;
  assignedToUserPubId?: string;
}

export interface DeleteTicketResponseDto {
  success: boolean;
  message: string;
}

export interface CreateTicketCommentInput {
  ticketPubId: string;
  content: string;
}

export interface UpdateTicketCommentInput {
  commentPubId: string;
  content: string;
}

export interface DeleteTicketCommentResponseDto {
  success: boolean;
  message: string;
}

// ------------------------------------------
// CONVERSATION & MESSAGE TYPES
// ------------------------------------------

export interface MessageResponseDto {
  pubId: string;
  id: number;
  conversationPubId: string;
  content: string;
  type: MessageType;
  sender?: UserSummary | null;
  createdAt: string;
}

export interface ConversationResponseDto {
  pubId: string;
  id: number;
  title?: string | null;
  customerPubId: string;
  customer?: CustomerResponseDto | null;
  participants?: UserSummary[] | null;
  messages?: MessageResponseDto[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationInput {
  customerPubId: string;
  title?: string;
  participantUserPubIds?: string[];
}

export interface SendMessageInput {
  conversationPubId: string;
  content: string;
  type?: MessageType;
}

export interface PublicInquiryInput {
  name: string;
  email: string;
  content: string;
  organizationPubId?: string;
  conversationPubId?: string;
  phone?: string;
}

export interface PublicInquiryResponseDto {
  success: boolean;
  customerPubId: string;
  conversationPubId: string;
  messagePubId: string;
}
