import { notFound } from "next/navigation";
import { BookReader } from "@/components/books/BookReader";
import { BOOKS, getBook } from "@/lib/curriculum/books";

/** Jedna trasa na książeczkę — lista w lib/curriculum/books.ts. */
export function generateStaticParams() {
  return BOOKS.map((book) => ({ bookId: book.id }));
}

/** Build statyczny: żadnych tras poza wygenerowanymi wyżej. */
export const dynamicParams = false;

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getBook(bookId);

  if (!book) notFound();

  return <BookReader book={book} />;
}
