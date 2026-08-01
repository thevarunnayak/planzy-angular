import { Injectable, signal, computed, inject } from '@angular/core';
import { Client, Account, Databases, Storage, ID, Query, Models } from 'appwrite';
import { NotificationService } from './notification.service';
import { BoardInvitation, InvitationRole } from '../models/invitation.model';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private notificationService = inject(NotificationService);

  client = new Client();
  account = new Account(this.client);
  databases = new Databases(this.client);
  storage = new Storage(this.client);

  get storageBucketId(): string {
    try {
      return process.env.APPWRITE_STORAGE_BUCKET_ID || '6a6dbf3f00123bfb3174';
    } catch {
      return '6a6dbf3f00123bfb3174';
    }
  }

  currentUser = signal<User | null>(null);
  authModalOpen = signal<boolean>(false);

  // Computed login status signal
  isLoggedIn = computed<boolean>(() => !!this.currentUser());

  // In-app pending invitations signal & 24h expiration threshold
  pendingInvitations = signal<BoardInvitation[]>([]);
  readonly invitationExpiryMs = 24 * 60 * 60 * 1000;

  private readonly collectionInvitations = 'board_invitations';

  constructor() {
    this.initAppwrite();
    this.checkSession();
  }

  private initAppwrite(): void {
    try {
      const directEndpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
      const projectId = process.env.APPWRITE_PROJECT_ID || '6a6b908c00170e25d2d4';

      // On non-localhost (e.g. Vercel), proxy Appwrite through Vercel to avoid CORS
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const endpoint = isLocalhost
        ? directEndpoint
        : (typeof window !== 'undefined' ? window.location.origin + '/appwrite' : directEndpoint);

      this.client
        .setEndpoint(endpoint)
        .setProject(projectId);
    } catch {
      // Quiet initialization fallback
    }
  }

  get projectId(): string {
    try {
      return process.env.APPWRITE_PROJECT_ID || '6a6b908c00170e25d2d4';
    } catch {
      return '6a6b908c00170e25d2d4';
    }
  }

  get databaseId(): string {
    try {
      return process.env.APPWRITE_DATABASE_ID || '6a6b912b0013f04cef1e';
    } catch {
      return '6a6b912b0013f04cef1e';
    }
  }

  openAuthModal(): void {
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }

  async checkSession(): Promise<void> {
    try {
      const session = await this.account.get();
      if (session) {
        this.currentUser.set({
          id: session.$id,
          name: session.name || session.email.split('@')[0],
          email: session.email,
          createdAt: session.$createdAt
        });
        this.fetchPendingInvitations();
      }
    } catch {
      this.currentUser.set(null);
    }
  }

  async signUp(email: string, pass: string, name: string): Promise<boolean> {
    try {
      await this.account.create(ID.unique(), email, pass, name);
      await this.login(email, pass);
      this.notificationService.success('Welcome to Planzy!', `Account created for ${name}`);
      return true;
    } catch (err: any) {
      this.handleAppwriteError(err, 'Sign Up Failed');
      return false;
    }
  }

  // Alias for backward compatibility
  async signup(email: string, pass: string, name: string): Promise<boolean> {
    return this.signUp(email, pass, name);
  }

  async login(email: string, pass: string): Promise<boolean> {
    try {
      await this.account.createEmailPasswordSession(email, pass);
      await this.checkSession();
      this.closeAuthModal();
      this.notificationService.success('Logged In!', 'Your workspace is synced with Appwrite Cloud.');
      return true;
    } catch (err: any) {
      this.handleAppwriteError(err, 'Login Failed');
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.account.deleteSession('current');
    } catch {
      // Ignore session delete errors on local
    } finally {
      this.currentUser.set(null);
      this.pendingInvitations.set([]);
      this.notificationService.info('Signed Out', 'You are now browsing in Guest Mode');
    }
  }

  /* --- INVITATION METHODS WITH REAL ERROR REPORTING & AUTOMATIC PURGE --- */

  async sendBoardInvitation(
    boardId: string,
    boardName: string,
    inviteeEmail: string,
    role: InvitationRole = 'member'
  ): Promise<boolean> {
    const user = this.currentUser();
    if (!user) {
      this.notificationService.error('Sign In Required', 'Please sign in to send workspace invitations.');
      return false;
    }

    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    try {
      // 1. Delete any existing pending invitations for this same email + board to prevent duplicates
      try {
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
      } catch {
        // If collection doesn't exist yet, proceeding will throw clean error below
      }

      // 2. Create clean single invitation document
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
          status: 'pending'
        }
      );
      this.notificationService.success('Invitation Sent!', `Invited ${normalizedEmail} to ${boardName}`);
      return true;
    } catch (err: any) {
      if (err?.code === 404 || err?.type === 'collection_not_found') {
        this.notificationService.error(
          'Missing "board_invitations" Collection',
          'Create collection "board_invitations" in Appwrite Console with permissions (Any: Create, Read, Delete).'
        );
      } else {
        this.handleAppwriteError(err, 'Failed to Send Invitation');
      }
      return false;
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
        const createdDateStr = doc.$createdAt || new Date().toISOString();
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
    } catch {
      this.pendingInvitations.update(list => list.filter(i => i.id !== invitationId));
      return true;
    }
  }

  private handleAppwriteError(err: any, defaultTitle: string): void {
    const msg = err?.message || '';
    if (msg.includes('project') || err?.type === 'project_not_found') {
      this.notificationService.error(
        'Invalid Appwrite Project ID',
        'Check your Project ID in .env.local or add your Web Platform in Appwrite Console.'
      );
    } else if (msg.includes('CORS') || err?.code === 0 || err?.type === 'general_argument_invalid') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain';
      this.notificationService.error(
        'Appwrite CORS Origin Blocked',
        `Add "${currentHost}" in Appwrite Console -> Overview -> Web Platforms -> + Add Platform -> Web App.`
      );
    } else {
      this.notificationService.error(defaultTitle, msg || 'Could not complete request.');
    }
  }

  async uploadTaskAttachmentFile(file: File): Promise<{ url: string; fileId: string }> {
    const bucketId = this.storageBucketId;
    console.log('[Planzy Storage] Uploading to bucket:', bucketId);
    try {
      const uploaded = await this.storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
      const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
      const projectId = process.env.APPWRITE_PROJECT_ID || '6a6b908c00170e25d2d4';
      const url = `${endpoint}/storage/buckets/${bucketId}/files/${uploaded.$id}/view?project=${projectId}`;
      console.log('[Planzy Storage] Upload success. File ID:', uploaded.$id, 'URL:', url);
      return { url, fileId: uploaded.$id };
    } catch (err: any) {
      const errMsg = err?.message || err?.type || 'Unknown error';
      const errCode = err?.code;
      console.error('[Planzy Storage] Upload failed — bucket:', bucketId, '| Error:', errMsg, '| Code:', errCode, '| Full:', err);
      this.notificationService.error(
        'Attachment Upload Failed',
        `Bucket "${bucketId}": ${errMsg}. Falling back to local storage.`
      );
      // Fallback: store file as Data URL locally
      const dataUrl = await this.readFileAsDataUrl(file);
      return { url: dataUrl, fileId: `local-${Date.now()}` };
    }
  }

  async deleteTaskAttachmentFile(fileId: string): Promise<void> {
    if (!fileId || fileId.startsWith('local-')) return;
    try {
      await this.storage.deleteFile(this.storageBucketId, fileId);
    } catch (err: any) {
      console.warn('Appwrite Storage delete file warning:', err);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
