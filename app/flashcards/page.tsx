"use client"

import { useEffect, useState } from 'react'
import { db } from '@/firebase'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { useUser } from '@clerk/nextjs';
import { flashcardSet } from "@/lib/data/flashcard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function Flashcards() {
  const { user } = useUser()
  const [flashcards, setFlashcards] = useState<flashcardSet[]>([]);

  useEffect(() => {
    async function getFlashcards() {
      if (!user) return
      const docRef = doc(collection(db, 'users'), user?.id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const collections = docSnap.data().flashcardSets || []
        setFlashcards(collections)
      } else {
        await setDoc(docRef, { flashcards: [] })
      }
    }
    getFlashcards()
  }, [user])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((collection, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{collection.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="mt-4">
                {/* TODO */}
                <Link href={`/flashcards`}>View Flashcard</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}