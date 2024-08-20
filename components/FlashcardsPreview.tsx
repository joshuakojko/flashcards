import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Pencil1Icon } from "@radix-ui/react-icons";
import useEmblaCarousel from "embla-carousel-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Flashcard } from '@/lib/data/flashcard';

interface FlashcardsPreviewProps {
  flashcards: Flashcard[];
  updateFlashcards: (flashcards: Flashcard[]) => void;
}

export default function FlashcardsPreview({ flashcards, updateFlashcards }: FlashcardsPreviewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setCurrentCardIndex(emblaApi.selectedScrollSnap());
        setShowAnswer(false);
      });
    }
  }, [emblaApi]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "e" && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === "ArrowRight") {
        emblaApi?.scrollNext();
      }
      if (event.key === "ArrowLeft") {
        emblaApi?.scrollPrev();
      }
    };

    if (flashcards.length > 0) {
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [flashcards, emblaApi, isOpen]);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="relative">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 z-10"
              >
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
                <Button
                  onClick={() => {
                    const updatedFlashcards = flashcards.map((card, index) =>
                      index === currentCardIndex
                        ? {
                            question: editingQuestion || card.question,
                            answer: editingAnswer || card.answer,
                          }
                        : card
                    );
                    updateFlashcards(updatedFlashcards);
                    setEditingQuestion("");
                    setEditingAnswer("");
                    setIsOpen(false);
                  }}
                >
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
            className="absolute top-1/2 left-2 -translate-y-1/2"
            onClick={() => emblaApi?.scrollPrev()}
          >
            &lt;
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            onClick={() => emblaApi?.scrollNext()}
          >
            &gt;
          </Button>
        </div>
      </div>
    </div>
  );
}