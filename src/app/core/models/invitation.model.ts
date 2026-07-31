export type InvitationRole = 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface BoardInvitation {
  id: string;
  boardId: string;
  boardName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: InvitationRole;
  status: InvitationStatus;
  createdAt: string;
}

export interface CreateInvitationDto {
  boardId: string;
  boardName: string;
  inviteeEmail: string;
  role?: InvitationRole;
}
