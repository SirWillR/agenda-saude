import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

const getApp = () => (app ??= initializeApp(firebaseConfig));

export const fbAuth = (): Auth => getAuth(getApp());

export const fbDb = (): Firestore =>
  (db ??= initializeFirestore(getApp(), {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  }));
