
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { BrowsePets } from './components/BrowsePets';
import { WhatWeOffer } from './components/WhatWeOffer';
import { PetCareResources } from './components/PetCareResources';
import { FeedbackReviews } from './components/FeedbackReviews';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import type { FeedbackSubmission } from './types';
import type { User, AuthMode } from './types/auth';
import { getFeedbackList } from './utils/storage';
import { getCurrentUser, logoutUser } from './utils/auth';

const API_URL = 'http://localhost:8080/api/adoption-requests';
const ADMIN_EMAIL = '25104095@apsit.edu.in';

interface AdoptionRequest {
  request_id: number;
  pet_id: number;
  applicant_name: string;
  email: string;
  phone: string;
  city: string;
  home_type: string;
  pet_experience: string;
  reason: string;
  request_status: string;
  created_at: string;
}

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  const isAdmin =
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      try {
        const list = await getFeedbackList();
        if (!cancelled) setSubmissions(list);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      }
    }

    loadFeedback();

    const user = getCurrentUser();
    if (user) setCurrentUser(user);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAdoptionRequests([]);
      setRequestsError('');
      return;
    }

    let cancelled = false;

    async function loadAdoptionRequests() {
      setRequestsLoading(true);
      setRequestsError('');

      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error('Unable to load adoption requests.');
        }

        const data: AdoptionRequest[] = await response.json();

        if (!cancelled) {
        const userEmail = currentUser?.email?.toLowerCase() ?? '';

const visibleRequests = isAdmin
  ? data
  : data.filter(
      request =>
        request.email?.toLowerCase() === userEmail
    );

          setAdoptionRequests(visibleRequests);
        }
      } catch {
        if (!cancelled) {
          setRequestsError(
            'Could not load adoption requests. Please check that the backend is running.'
          );
        }
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }

    loadAdoptionRequests();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isAdmin]);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleSubmissionAdded = (newSub: FeedbackSubmission) => {
    setSubmissions(prev => [newSub, ...prev]);
  };

  const handleSubmissionsUpdated = (
    updatedList: FeedbackSubmission[]
  ) => {
    setSubmissions(updatedList);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-mint selection:text-mint-foreground">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        reviewCount={submissions.filter(s => s.isPublicReview).length}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Hero
          onBrowsePets={() => handleNavigate('pets')}
          onExploreResources={() => handleNavigate('pet-care')}
          onViewReviews={() => handleNavigate('reviews')}
        />

        <HowItWorks />

        <BrowsePets currentUser={currentUser} />

        <WhatWeOffer />

        <PetCareResources />

        <FeedbackReviews
          submissions={submissions}
          onSubmissionAdded={handleSubmissionAdded}
          currentUser={currentUser}
        />

        {currentUser && (
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {isAdmin
                  ? 'All Adoption Requests'
                  : 'My Adoption Requests'}
              </h2>

              <p className="text-muted-foreground mb-6">
                {isAdmin
                  ? 'Review adoption applications submitted by users.'
                  : 'View the status of your submitted adoption applications.'}
              </p>

              {requestsLoading && <p>Loading adoption requests...</p>}

              {requestsError && (
                <p className="text-red-500">{requestsError}</p>
              )}

              {!requestsLoading &&
                !requestsError &&
                adoptionRequests.length === 0 && (
                  <div className="rounded-lg border p-6">
                    {isAdmin
                      ? 'No adoption requests have been submitted yet.'
                      : 'You have not submitted any adoption requests yet.'}
                  </div>
                )}

              <div className="grid gap-4">
                {adoptionRequests.map(request => (
                  <article
                    key={request.request_id}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Adoption Request #{request.request_id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Pet ID: {request.pet_id}
                        </p>
                      </div>

                      <span className="rounded-full border px-3 py-1 text-sm">
                        {request.request_status}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <p>
                        <strong>Applicant:</strong>{' '}
                        {request.applicant_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {request.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {request.phone}
                      </p>
                      <p>
                        <strong>City:</strong> {request.city}
                      </p>
                      <p>
                        <strong>Home type:</strong> {request.home_type}
                      </p>
                      <p>
                        <strong>Pet experience:</strong>{' '}
                        {request.pet_experience}
                      </p>
                    </div>

                    <div className="mt-4">
                      <strong>Reason for adoption:</strong>
                      <p className="mt-1 text-muted-foreground">
                        {request.reason}
                      </p>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                      Submitted:{' '}
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {isAdmin && (
          <AdminDashboard
            submissions={submissions}
            onSubmissionsUpdated={handleSubmissionsUpdated}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={user => setCurrentUser(user)}
      />
    </div>
  );
};

export default App;