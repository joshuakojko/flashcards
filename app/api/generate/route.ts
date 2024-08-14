import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const systemPrompt = `You are an expert flashcard creator. Your task is to generate high-quality flashcards based on the given topic or content. Each flashcard should have a clear, concise question on one side and a brief, accurate answer on the other. Follow these guidelines:

1. Create questions that test understanding, not just memorization.
2. Ensure answers are concise but complete.
3. Use clear, unambiguous language.
4. Cover key concepts and important details.
5. Avoid overly complex or trivial information.
6. Maintain a consistent format across all flashcards.
7. If applicable, include a mix of definition, comparison, and application questions.
8. Ensure all information is factually correct and up-to-date.

Your flashcards should be effective learning tools that help users reinforce their knowledge and identify areas for further study.


Output your flashcards in the following JSON format:

{
  "flashcards": [
    {
      "question": str,
      "answer": str
    }
  ]
}
`

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { notes } = await req.json();
        if (!notes) {
            return NextResponse.json({ error: "No notes provided" }, { status: 400 });
        }

        const chatCompletion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: notes },
            ],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });

        const response = chatCompletion.choices[0].message.content;
        if (!response) {
            return NextResponse.json({ error: "Error generating flashcards" }, { status: 500 });
        }

        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
            return NextResponse.json({ error: "Invalid response structure" }, { status: 500 });
        }

        return NextResponse.json(parsedResponse.flashcards);
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}