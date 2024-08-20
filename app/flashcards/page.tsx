"use client"

import { useEffect, useState } from 'react'
import { db } from '@/firebase'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { useUser } from '@clerk/nextjs';
import { flashcardSet, Flashcard } from "@/lib/data/flashcard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import FlashcardsPreview from '@/components/FlashcardsPreview'; // Import FlashcardsPreview

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
      } else {
        await setDoc(docRef, { flashcards: [] })
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardSet.map((collection, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{collection.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="mt-4"
                onClick={() => getFlashcard(collection.name)}
              >
                View Flashcard
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}