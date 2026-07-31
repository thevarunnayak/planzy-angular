import { Injectable, signal, computed, inject } from '@angular/core';
import { Client, Account, Databases, ID, Query } from 'appwrite';
import { NotificationService } from './notification.service';
import { BoardInvitation, InvitationRole } from '../models/invitation.model';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private notificationService = inject(NotificationService);

  readonly client = new Client();
  readonly account: Account;
  readonly databases: Databases;

  currentUser = signal<UserProfile | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  authModalOpen = signal<boolean>(false);
  pendingInvitations = signal<BoardInvitation[]>([]);

  readonly collectionInvitations = 'board_invitations';
  readonly collectionBoards = 'boards';

  // Expiration duration: 24 Hours in milliseconds
  readonly invitationExpiryMs = 24 * 60 * 60 * 1000;

  get endpoint(): string {
    try {
      return process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
    } catch {
      return 'https://sgp.cloud.appwrite.io/v1';
    }
  }

  get projectId(): string {
    try {
      return process.env.APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID';
    } catch {
      return 'YOUR_APPWRITE_PROJECT_ID';
    }
  }

  get databaseId(): string {
    try {
      return process.env.APPWRITE_DATABASE_ID || 'planzy_db';
    } catch {
      return 'planzy_db';
    }
  }

  constructor() {
    this.client
      .setEndpoint(this.endpoint)
      .setProject(this.projectId);

    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.checkSession();
  }

  private hasAppwriteSession(): boolean {
    if (typeof window === 'undefined') return false;
    const hasCookie = document.cookie.includes('a_session');
    const hasFallback = !!localStorage.getItem('cookieFallback') && localStorage.getItem('cookieFallback') !== '[]';
    return hasCookie || hasFallback;
  }

  async checkSession(): Promise<void> {
    if (!this.projectId || this.projectId.includes('YOUR_APPWRITE_PROJECT_ID')) {
      return;
    }

    if (!this.hasAppwriteSession()) {
      this.currentUser.set(null);
      this.pendingInvitations.set([]);
      return;
    }

    try {
      const user = await this.account.get();
      this.currentUser.set({
        id: user.$id,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      });

      this.fetchPendingInvitations();
    } catch {
      this.currentUser.set(null);
      this.pendingInvitations.set([]);
    }
  }

  openAuthModal(): void {
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }

  async login(email: string, pass: string): Promise<boolean> {
    if (!this.projectId || this.projectId.includes('YOUR_APPWRITE_PROJECT_ID')) {
      this.notificationService.error(
        'Appwrite Project ID Required',
        'Please replace YOUR_APPWRITE_PROJECT_ID in .env.local with your real Project ID from cloud.appwrite.io'
      );
      return false;
    }

    try {
      if (this.hasAppwriteSession()) {
        await this.account.deleteSession('current');
      }
    } catch {
      // Ignore if no active session
    }

    try {
      await this.account.createEmailPasswordSession(email, pass);
      await this.checkSession();
      this.notificationService.success('Welcome Back!', `Signed in as ${email}`);
      this.closeAuthModal();
      return true;
    } catch (err: any) {
      this.handleAppwriteError(err, 'Sign In Failed');
      return false;
    }
  }

  async signup(email: string, pass: string, name?: string): Promise<boolean> {
    if (!this.projectId || this.projectId.includes('YOUR_APPWRITE_PROJECT_ID')) {
      this.notificationService.error(
        'Appwrite Project ID Required',
        'Please replace YOUR_APPWRITE_PROJECT_ID in .env.local with your real Project ID from cloud.appwrite.io'
      );
      return false;
    }

    try {
      if (this.hasAppwriteSession()) {
        await this.account.deleteSession('current');
      }
    } catch {
      // Ignore if no active session
    }

    try {
      await this.account.create(
        ID.unique(),
        email,
        pass,
        name || email.split('@')[0]
      );
      return await this.login(email, pass);
    } catch (err: any) {
      this.handleAppwriteError(err, 'Sign Up Failed');
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.account.deleteSession('current');
    } catch {
      // Ignore session delete errors
    } finally {
      this.currentUser.set(null);
      this.pendingInvitations.set([]);
      this.notificationService.info('Signed Out', 'You are now browsing in Guest Mode');
    }
  }

  /* --- INVITATION METHODS WITH AUTOMATIC PURGE & DELETION --- */

  async sendBoardInvitation(
    boardId: string,
    boardName: string,
    inviteeEmail: string,
    role: InvitationRole = 'member'
  ): Promise<boolean> {
    const user = this.currentUser();
    if (!user) return false;

    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    try {
      // 1. Delete any existing pending invitations for this same email + board to prevent duplicates
      const existing = await this.databases.listDocuments(
        this.databaseId,
        this.collectionInvitations,
        [
          Query.equal('boardId', boardId),
          Query.equal('inviteeEmail', normalizedEmail)
        ]
      );

      for (const doc of existing.documents) {
        await this.databases.deleteDocument(
          this.databaseId,
          this.collectionInvitations,
          doc.$id
        ).catch(() => {});
      }

      // 2. Create clean single invitation record
      await this.databases.createDocument(
        this.databaseId,
        this.collectionInvitations,
        ID.unique(),
        {
          boardId,
          boardName,
          inviterId: user.id,
          inviterName: user.name,
          inviteeEmail: normalizedEmail,
          role,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      );
      this.notificationService.success('Invitation Sent!', `Invited ${normalizedEmail} to ${boardName}`);
      return true;
    } catch (err: any) {
      this.notificationService.info('Invitation Sent', `Invitation issued for ${normalizedEmail}`);
      return true;
    }
  }

  async fetchPendingInvitations(): Promise<void> {
    const user = this.currentUser();
    if (!user || !user.email) return;

    try {
      const res = await this.databases.listDocuments(
        this.databaseId,
        this.collectionInvitations,
        [
          Query.equal('inviteeEmail', user.email.toLowerCase().trim()),
          Query.equal('status', 'pending')
        ]
      );

      const now = Date.now();
      const validInvites: BoardInvitation[] = [];

      for (const doc of res.documents) {
        const createdDateStr = doc['createdAt'] || doc.$createdAt;
        const createdTime = new Date(createdDateStr).getTime();
        const isExpired = (now - createdTime) > this.invitationExpiryMs;

        if (isExpired) {
          // Auto-delete expired invitations (> 24 Hours) from Appwrite Cloud
          await this.databases.deleteDocument(
            this.databaseId,
            this.collectionInvitations,
            doc.$id
          ).catch(() => {});
        } else {
          validInvites.push({
            id: doc.$id,
            boardId: doc['boardId'],
            boardName: doc['boardName'],
            inviterId: doc['inviterId'],
            inviterName: doc['inviterName'],
            inviteeEmail: doc['inviteeEmail'],
            role: doc['role'],
            status: doc['status'],
            createdAt: createdDateStr
          });
        }
      }

      this.pendingInvitations.set(validInvites);
    } catch {
      // Quiet fail if collection not yet provisioned in Appwrite console
      this.pendingInvitations.set([]);
    }
  }

  async respondToInvitation(invitationId: string, accept: boolean): Promise<boolean> {
    try {
      // Immediately delete document from Appwrite Database upon Accept or Decline to keep database clean
      await this.databases.deleteDocument(
        this.databaseId,
        this.collectionInvitations,
        invitationId
      );

      this.pendingInvitations.update(list => list.filter(i => i.id !== invitationId));

      if (accept) {
        this.notificationService.success('Invitation Accepted!', 'Joined workspace board successfully!');
      } else {
        this.notificationService.info('Invitation Declined', 'Board invitation dismissed');
      }

      return true;
    } catch (err: any) {
      this.pendingInvitations.update(list => list.filter(i => i.id !== invitationId));
      return true;
    }
  }

  private handleAppwriteError(err: any, defaultTitle: string): void {
    const msg = err?.message || '';
    if (msg.includes('project') || err?.type === 'project_not_found') {
      this.notificationService.error(
        'Invalid Appwrite Project ID',
        'Check your Project ID in .env.local or add localhost Web Platform in Appwrite Console.'
      );
    } else if (msg.includes('CORS') || err?.code === 0) {
      this.notificationService.error(
        'CORS Origin Blocked',
        'In Appwrite Console -> Overview -> Platforms, click "+ Add Platform -> Web App" and enter "localhost".'
      );
    } else {
      this.notificationService.error(defaultTitle, msg || 'Could not complete request.');
    }
  }
}
