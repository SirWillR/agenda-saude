import { Injectable, computed, signal } from '@angular/core';
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { fbDb } from './firebase';
import { firebaseConfigured } from './firebase.config';
import { ExamRecord, ExamType, Member } from './models';
import { SEED_EXAM_TYPES, SEED_MEMBERS } from './seed';

type Col = 'members' | 'examTypes' | 'records';
type Item = { id: string };
type Entry = { col: Col; item: Item };

interface Backend {
  watch(col: Col, next: (items: Item[]) => void, error: (e: unknown) => void): () => void;
  set(col: Col, item: Item): Promise<void>;
  setMany(entries: Entry[]): Promise<void>;
  remove(col: Col, id: string): Promise<void>;
}

const firestoreBackend: Backend = {
  watch: (col, next, error) =>
    onSnapshot(
      collection(fbDb(), col),
      (snap) => next(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      error,
    ),
  set: (col, { id, ...data }) => setDoc(doc(fbDb(), col, id), data),
  setMany: (entries) => {
    const batch = writeBatch(fbDb());
    for (const { col, item } of entries) {
      const { id, ...data } = item;
      batch.set(doc(fbDb(), col, id), data);
    }
    return batch.commit();
  },
  remove: (col, id) => deleteDoc(doc(fbDb(), col, id)),
};

/** Usado enquanto o Firebase não está configurado: guarda tudo no localStorage deste navegador. */
function localBackend(): Backend {
  const listeners = new Map<Col, (items: Item[]) => void>();
  const key = (col: Col) => `agenda-saude:${col}`;
  const read = (col: Col): Item[] => JSON.parse(localStorage.getItem(key(col)) ?? '[]');
  const write = (col: Col, items: Item[]) => {
    localStorage.setItem(key(col), JSON.stringify(items));
    listeners.get(col)?.(items);
  };
  const upsert = (col: Col, item: Item) =>
    write(col, [...read(col).filter((i) => i.id !== item.id), item]);
  return {
    watch: (col, next) => {
      listeners.set(col, next);
      next(read(col));
      return () => listeners.delete(col);
    },
    set: async (col, item) => upsert(col, item),
    setMany: async (entries) => entries.forEach(({ col, item }) => upsert(col, item)),
    remove: async (col, id) =>
      write(
        col,
        read(col).filter((i) => i.id !== id),
      ),
  };
}

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly backend = firebaseConfigured ? firestoreBackend : localBackend();
  private readonly ready = signal<Record<Col, boolean>>({
    members: false,
    examTypes: false,
    records: false,
  });
  private unsubscribe: (() => void)[] = [];

  private readonly rawMembers = signal<Member[]>([]);
  readonly members = computed(() => [...this.rawMembers()].sort((a, b) => a.order - b.order));
  readonly examTypes = signal<ExamType[]>([]);
  readonly records = signal<ExamRecord[]>([]);

  readonly loaded = computed(() => Object.values(this.ready()).every(Boolean));
  /** A conta entrou, mas as regras do banco não liberam o e-mail dela. */
  readonly denied = signal(false);
  readonly error = signal('');

  start(): void {
    if (this.unsubscribe.length) return;
    const fail = (e: unknown) => {
      if ((e as { code?: string }).code === 'permission-denied') this.denied.set(true);
      else this.error.set('Não foi possível carregar os dados.');
    };
    const watch = (col: Col, next: (items: Item[]) => void) =>
      this.backend.watch(
        col,
        (items) => {
          next(items);
          this.ready.update((r) => ({ ...r, [col]: true }));
        },
        fail,
      );
    this.unsubscribe = [
      watch('members', (items) => this.rawMembers.set(items as Member[])),
      watch('examTypes', (items) => this.examTypes.set(items as ExamType[])),
      watch('records', (items) => this.records.set(items as ExamRecord[])),
    ];
  }

  stop(): void {
    this.unsubscribe.forEach((fn) => fn());
    this.unsubscribe = [];
    this.ready.set({ members: false, examTypes: false, records: false });
    this.rawMembers.set([]);
    this.examTypes.set([]);
    this.records.set([]);
    this.denied.set(false);
    this.error.set('');
  }

  // As gravações não são aguardadas pelas telas: offline, o Firestore só resolve a
  // promise quando reconecta, mas a alteração já aparece nos listeners na hora.
  saveExamType(item: ExamType): void {
    this.run(this.backend.set('examTypes', item));
  }

  saveRecord(item: ExamRecord): void {
    this.run(this.backend.set('records', item));
  }

  removeExamType(id: string): void {
    this.run(this.backend.remove('examTypes', id));
  }

  removeRecord(id: string): void {
    this.run(this.backend.remove('records', id));
  }

  seed(): void {
    this.run(
      this.backend.setMany([
        ...SEED_MEMBERS.map((item) => ({ col: 'members' as const, item })),
        ...SEED_EXAM_TYPES.map((item) => ({ col: 'examTypes' as const, item })),
      ]),
    );
  }

  private run(op: Promise<void>): void {
    this.error.set('');
    op.catch(() => this.error.set('Não foi possível salvar. Confira a conexão e tente de novo.'));
  }
}
