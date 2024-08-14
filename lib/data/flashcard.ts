export interface flashcardSet {
    name: string;
    flashcards: {
      answer: string;
      question: string;
    }[];
  }