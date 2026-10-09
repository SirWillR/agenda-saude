import { Injectable, signal } from '@angular/core';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { fbAuth } from './firebase';
import { firebaseConfigured } from './firebase.config';

export interface AppUser {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  /** undefined enquanto o Firebase ainda não respondeu; null quando não há sessão. */
  readonly user = signal<AppUser | null | undefined>(undefined);
  readonly error = signal('');
  readonly local = !firebaseConfigured;

  constructor() {
    if (this.local) {
      this.user.set({ name: 'Modo local', email: '' });
      return;
    }
    onAuthStateChanged(fbAuth(), (u) =>
      this.user.set(u ? { name: u.displayName ?? u.email ?? '', email: u.email ?? '' } : null),
    );
  }

  async signIn(): Promise<void> {
    this.error.set('');
    try {
      await signInWithPopup(fbAuth(), new GoogleAuthProvider());
    } catch {
      this.error.set('Não foi possível entrar. Tente de novo.');
    }
  }

  async signOut(): Promise<void> {
    if (!this.local) await signOut(fbAuth());
  }
}
