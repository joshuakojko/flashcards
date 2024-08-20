"use client"

import { useEffect, useState } from 'react'
import { db } from '@/firebase'
import { collection, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { useUser } from '@clerk/nextjs';
import { flashcardSet, Flashcard } from "@/lib/data/flashcard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react';
import FlashcardsPreview from '@/components/FlashcardsPreview';

export default function Flashcards() {
  const { user } = useUser()
  const [flashcardSet, setFlashcardSet] = useState<flashcardSet[]>([]);
  const [flashcard, setFlashcard] = useState<Flashcard[] | null>(null);

  useEffect(() => {
    async function getFlashcardSet() {
      if (!user) return
      const docRef = doc(collection(db, 'users'), user?.id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const collections = docSnap.data().flashcardSets || []
        setFlashcardSet(collections)
      } 
    }
    getFlashcardSet()
  }, [user])

  const getFlashcard = async (flashcardName: string) => {
    if (!user) return
    const docRef = doc(collection(db, 'users'), user?.id)
    const flashcardRef = doc(collection(docRef, 'flashcardSets'), flashcardName)
    const flashcardSnap = await getDoc(flashcardRef)
    if (flashcardSnap.exists()) {
      const flashcardData = flashcardSnap.data().flashcards
      setFlashcard(flashcardData);
    }
  };

  if (flashcard) {
    return (
      <>
        <FlashcardsPreview
          flashcards={flashcard}
          updateFlashcards={() => { }}
        />
        <div className="flex justify-center"> 
          <Button
            onClick={() => setFlashcard(null)}
          >
            Back
          </Button>
        </div>
      </>
    );
  }

  const deleteFlashcard = async (flashcardName: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const flashcardSetRef = doc(collection(userDocRef, 'flashcardSets'), flashcardName);
      const batch = writeBatch(db);
      batch.delete(flashcardSetRef);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedSets = userData.flashcardSets.filter((set: flashcardSet) => set.name !== flashcardName);
        batch.update(userDocRef, { flashcardSets: updatedSets });
      }
      await batch.commit();
      setFlashcardSet(flashcardSet => flashcardSet.filter(set => set.name !== flashcardName));
    } catch (error) {
      console.error("Error deleting flashcard set:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardSet.map((collection, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{collection.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Button
                  className="mt-4"
                  onClick={() => getFlashcard(collection.name)}
                >
                  View Flashcard
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="mt-4">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the flashcard set.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteFlashcard(collection.name)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}