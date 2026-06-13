export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  category: 'Classici' | 'Poesia' | 'Romanzi' | 'Filosofia';
  description: string;
  status?: 'Preferiti' | 'Letti' | 'Da Leggere';
  sourceType?: 'internal' | 'external';
  filePath?: string;
  externalUrl?: string;
  extraLabel?: string; // e.g. "GENNAIO 2024"
  notesCount?: number;
  chapters?: string[];
  duration?: string; // total audio length e.g. "44:55"
}

export interface AudioTrack {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  chapter: string;
  chapterIndex: number;
  durationSeconds: number;
  audioUrl?: string; // fallback
  transcript: {
    time: number; // seconds
    text: string;
    speaker?: string;
  }[];
}

export interface PersonalNote {
  id: string;
  bookTitle: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
}
