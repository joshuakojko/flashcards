"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil1Icon } from "@radix-ui/react-icons";
import useEmblaCarousel from 'embla-carousel-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";
import { useUser } from "@clerk/nextjs"
import { doc, collection, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([]);
  const [flashcardName, setFlashcardName] = useState<string>("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setCurrentCardIndex(emblaApi.selectedScrollSnap())
        setShowAnswer(false)
      })
    }
  }, [emblaApi])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent handling when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'e') {
        setIsOpen(true);
      }
      if (event.key === 'ArrowRight') {
        emblaApi?.scrollNext();
      }
      if (event.key === 'ArrowLeft') {
        emblaApi?.scrollPrev();
      }
    };

    if (flashcards.length > 0) {
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [flashcards, emblaApi]);

  const handleGenerateQuestions = useCallback(async (notes?: string) => {
    if (!user?.id) {
      showAlert('Please sign in to generate flashcards.');
      return
    }
    setIsLoading(true);
    console.log('Generating flashcards...');
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      setFlashcards(await response.json());
      setNotes("");
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [notes]);

  const saveFlashcards = async () => {
    if (!flashcardName.trim()) {
      setIsOpen(false);
      showAlert('Please enter a name for your flashcard set.');
      return
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user?.id)
      const userDocSnap = await getDoc(userDocRef)

      const batch = writeBatch(db)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const updatedSets = [...(userData.flashcardSets || []), { name: flashcardName }]
        batch.update(userDocRef, { flashcardSets: updatedSets })
      } else {
        batch.set(userDocRef, { flashcardSets: [{ name: flashcardName }] })
      }

      const setDocRef = doc(collection(userDocRef, 'flashcardSets'), flashcardName)
      batch.set(setDocRef, { flashcards })

      await batch.commit()

      showAlert('Flashcards saved successfully!');
      setFlashcardName("");
      setFlashcards([]);
    } catch (error) {
      console.error('Error saving flashcards:', error)
      setIsOpen(false);
      showAlert('An error occurred while saving flashcards. Please try again.')
    }
  }

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 2000); // Dismiss after 5 seconds
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Generate flashcards easily with AI</h1>
      {flashcards.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Upload or paste your notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".pdf, .docx, .pptx"
              className="cursor-pointer"
              onChange={(e) => {
                const files = e.target.files;
                if (files) setFile(files[0]);
              }}
            />
            <Textarea placeholder="Paste your notes" className="min-h-[150px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button className="w-full" onClick={() => handleGenerateQuestions(notes)} disabled={isLoading}>Generate Flashcards</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="relative">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute top-2 right-2 z-10">
                      <Pencil1Icon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Flashcard</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      placeholder={flashcards[currentCardIndex].question}
                      className="min-h-[150px]"
                      value={editingQuestion}
                      onChange={(e) => setEditingQuestion(e.target.value)}
                    />
                    <Textarea
                      placeholder={flashcards[currentCardIndex].answer}
                      className="min-h-[150px]"
                      value={editingAnswer}
                      onChange={(e) => setEditingAnswer(e.target.value)}
                    />
                    <DialogClose asChild>
                      <Button onClick={() => {
                        setFlashcards(flashcards.map((card, index) =>
                          index === currentCardIndex
                            ? {
                              question: editingQuestion || card.question,
                              answer: editingAnswer || card.answer
                            }
                            : card
                        ));
                        setEditingQuestion("");
                        setEditingAnswer("");
                      }}>
                        Save
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {flashcards.map((flashcard, index) => (
                      <div key={index} className="flex-[0_0_100%]">
                        <div className="m-4">
                          <Card
                            className="cursor-pointer aspect-[4/3] flex flex-col"
                            onClick={() => setShowAnswer(!showAnswer)}
                          >
                            <CardHeader className="flex justify-center items-center pt-4">
                              <CardTitle className="text-center">{`${index + 1}/${flashcards.length}`}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center p-6 text-center">
                              <span className="text-lg md:text-xl lg:text-2xl font-semibold">
                                {showAnswer ? flashcard.answer : flashcard.question}
                              </span>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 left-4 -translate-y-1/2"
                  onClick={() => emblaApi?.scrollPrev()}
                >
                  &lt;
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 right-4 -translate-y-1/2"
                  onClick={() => emblaApi?.scrollNext()}
                >
                  &gt;
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Save</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Save Flashcard</DialogTitle>
                  <DialogDescription>
                    Add your flashcard name. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      className="col-span-3"
                      onChange={(e) => setFlashcardName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={saveFlashcards}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}
      {alertMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}