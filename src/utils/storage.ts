
import type { FeedbackSubmission, FeedbackStatus } from '../types';

const API_URL = 'http://localhost:8080/api/reviews';

type ApiReview = {
  review_id: number;
  title: string;
  author_name: string;
  author_email?: string | null;
  category: FeedbackSubmission['category'];
  review_text: string;
  rating: number;
  visibility: 'public' | 'private';
  status: string;
  created_at: string;
};

function mapApiReview(review: ApiReview): FeedbackSubmission {
  return {
    id: String(review.review_id),
    name: review.author_name,
    email: review.author_email ?? undefined,
    rating: review.rating,
    category: review.category,
    title: review.title,
    message: review.review_text,
    createdAt: review.created_at,
    status: (
      review.status.charAt(0).toUpperCase() + review.status.slice(1)
    ) as FeedbackStatus,
    isPublicReview: review.visibility === 'public',
  };
}

export async function getFeedbackList(): Promise<FeedbackSubmission[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error('Could not load reviews from the backend.');
  }

  const reviews: ApiReview[] = await response.json();
  return reviews.map(mapApiReview);
}

export async function addFeedbackSubmission(
  item: Omit<FeedbackSubmission, 'id' | 'createdAt' | 'status'>
): Promise<FeedbackSubmission> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorName: item.name,
      authorEmail: item.email ?? null,
      title: item.title,
      category: item.category,
      reviewText: item.message,
      rating: item.rating,
      visibility: item.isPublicReview ? 'public' : 'private',
    }),
  });

  if (!response.ok) {
    throw new Error('Could not submit your review. Please try again.');
  }

  const result = await response.json();

  const reviews = await getFeedbackList();
  const savedReview = reviews.find(
    (review) =>
      review.title === item.title &&
      review.name === item.name &&
      review.message === item.message
  );

  if (savedReview) return savedReview;

  return {
    ...item,
    id: String(result.reviewId ?? Date.now()),
    createdAt: new Date().toISOString(),
    status: 'New',
  };
}

export async function updateFeedbackStatus(
  id: string,
  newStatus: FeedbackStatus
): Promise<FeedbackSubmission[]> {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus.toLowerCase() }),
  });

  if (!response.ok) {
    throw new Error('Could not update the review status.');
  }

  return getFeedbackList();
}

export async function deleteFeedbackSubmission(
  id: string
): Promise<FeedbackSubmission[]> {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error('Could not delete the review.');
  }

  return getFeedbackList();
}

export function saveFeedbackList(_data: FeedbackSubmission[]): void {
  // Reviews are stored in MySQL through the backend.
}

export function resetDemoDataToDefault(): FeedbackSubmission[] {
  // Demo reset is disabled because reviews now live in MySQL.
  return [];
}
