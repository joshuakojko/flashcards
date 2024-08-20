export interface flashcardSet {
  name: string;
  flashcards: {
    answer: string;
    question: string;
  }[];
}

export interface Flashcard {
  answer: string;
  question: string;
}