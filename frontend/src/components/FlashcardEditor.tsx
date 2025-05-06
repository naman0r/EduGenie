import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ResourceInfo } from '@/types/resources';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardEditorProps {
  initialContent: any;
  resourceId: string;
  userId: string;
}

const FlashcardEditor: React.FC<FlashcardEditorProps> = ({
  initialContent,
  resourceId,
  userId,
}) => {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [csvInput, setCsvInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize flashcards from content
  useEffect(() => {
    if (initialContent && initialContent.cards) {
      setFlashcards(initialContent.cards);
    }
  }, [initialContent]);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing && flashcards.length > 0) {
        switch (e.key) {
          case ' ':
            e.preventDefault(); // Prevent page scroll
            setShowAnswer(prev => !prev);
            break;
          case 'ArrowLeft':
            prevCard();
            break;
          case 'ArrowRight':
            nextCard();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, flashcards.length]);

  // Parse CSV input
  const handleCsvInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvInput(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvInput(content);
      parseCsvToFlashcards(content);
    };
    reader.readAsText(file);
  };

  const parseCsvToFlashcards = (content?: string) => {
    try {
      const csvContent = content || csvInput;
      if (!csvContent.trim()) {
        setError('Please enter some flashcards or upload a CSV file');
        return;
      }

      const lines = csvContent.trim().split('\n');
      const newFlashcards = lines
        .map(line => {
          const [question, answer] = line.split(',').map(item => item.trim());
          return { question, answer };
        })
        .filter(card => card.question && card.answer); // Only keep valid cards

      if (newFlashcards.length === 0) {
        setError('No valid flashcards found. Please check your format: question,answer');
        return;
      }

      setFlashcards(newFlashcards);
      setError(null);
    } catch (err) {
      setError('Invalid CSV format. Please use format: question,answer');
    }
  };

  const saveFlashcards = async () => {
    if (flashcards.length === 0) {
      setError('Please add some flashcards before saving');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}/resources/${resourceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: { cards: flashcards },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save flashcards');
      }

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Flashcards</h2>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload CSV File:
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Choose File
              </button>
              {csvInput && (
                <span className="ml-2 text-sm text-gray-400">
                  File loaded, click "Parse CSV" to process
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Or enter flashcards in CSV format (question,answer):
              </label>
              <textarea
                value={csvInput}
                onChange={handleCsvInput}
                className="w-full h-32 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="What is the capital of France?,Paris&#10;What is 2+2?,4"
              />
            </div>
          </div>
          
          <button
            onClick={() => parseCsvToFlashcards()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Parse CSV
          </button>

          {error && <p className="text-red-500">{error}</p>}

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Preview:</h3>
            <div className="space-y-2">
              {flashcards.map((card, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded">
                  <p className="font-medium">Q: {card.question}</p>
                  <p className="text-gray-300">A: {card.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={saveFlashcards}
              disabled={isSaving || flashcards.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Flashcards'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Class</span>
          </button>
          <h2 className="text-xl font-semibold">Flashcards</h2>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Flashcards
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No flashcards created yet.</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Flashcards
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
              <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <span className="bg-gray-700 px-2 py-1 rounded">Space</span>
                  <span>Show/Hide Answer</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="bg-gray-700 px-2 py-1 rounded">←</span>
                  <span>Previous</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="bg-gray-700 px-2 py-1 rounded">→</span>
                  <span>Next</span>
                </div>
              </div>
            </div>
            
            <div 
              className="min-h-[200px] flex flex-col justify-center items-center cursor-pointer"
              onClick={() => setShowAnswer(prev => !prev)}
            >
              <p className="text-xl font-medium mb-4">
                {flashcards[currentIndex].question}
              </p>
              
              {showAnswer ? (
                <p className="text-lg text-gray-300">
                  {flashcards[currentIndex].answer}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Press Space or click to show answer
                </p>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={prevCard}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={nextCard}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardEditor; 