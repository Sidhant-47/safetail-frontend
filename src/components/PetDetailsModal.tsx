
import React, { useState, useEffect } from 'react';
import type { Pet } from '../types';
import type { User } from '../types/auth';
import {
  X, MapPin, CheckCircle2, Heart, Shield, Phone, Mail,
  Building2, Send
} from 'lucide-react';

interface PetDetailsModalProps {
  pet: Pet | null;
  onClose: () => void;
  currentUser?: User | null;
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({
  pet,
  onClose,
  currentUser,
}) => {
  const [showAdoptForm, setShowAdoptForm] = useState(false);
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [housingType, setHousingType] = useState('Apartment');
  const [city, setCity] = useState('');
  const [petExperience, setPetExperience] = useState('First-time owner');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setApplicantName(currentUser.name);
      setApplicantEmail(currentUser.email);
    }
  }, [currentUser]);

  if (!pet) return null;

  const handleSubmitAdoption = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !applicantName.trim() ||
      !applicantEmail.trim() ||
      !applicantPhone.trim() ||
      !city.trim() ||
      !reason.trim()
    ) {
      setError('Please complete all required fields.');
      return;
    }
    console.log("Selected pet:", pet.name);
console.log("Pet ID:", pet.id);
console.log("Converted pet ID:", Number(pet.id));
    const petId = Number(pet.id);
    console.log("Pet selected:", pet.name);
console.log("Original ID:", pet.id);
console.log("Numeric ID:", petId);
    if (!Number.isInteger(petId) || petId <= 0) {
      setError('Invalid pet ID. Please close the details and select the pet again.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
  (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/auth')
    .replace('/api/auth', '/api/adoption-requests'),
  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          applicantName: applicantName.trim(),
          email: applicantEmail.trim(),
          phone: applicantPhone.trim(),
          city: city.trim(),
          homeType: housingType,
          petExperience,
          reason: reason.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          (response.status === 409
            ? 'This pet is no longer available for adoption.'
            : 'The application could not be submitted. Please try again.')
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the backend. Please check that the Java server is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-lift overflow-hidden max-h-[90vh] flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-secondary">
          <img src={pet.image} alt={pet.name} className="size-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Close Pet Details"
          >
            <X className="size-5" />
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="rounded-full bg-mint px-3.5 py-1 text-xs font-bold text-mint-foreground shadow-sm">
              {pet.species}
            </span>
            <span className="rounded-full bg-card/90 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-primary shadow-sm flex items-center gap-1">
              <MapPin className="size-3 text-accent" />
              {pet.city}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="pet-modal-title" className="font-display text-3xl text-primary">
                {pet.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pet.breed} · {pet.age} · {pet.gender}
              </p>
            </div>

            {!submitted && (
              <button
                onClick={() => setShowAdoptForm(!showAdoptForm)}
                className="inline-flex items-center gap-2 rounded-full font-semibold transition-all bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 h-10 px-5 text-sm cursor-pointer"
              >
                <Heart className="size-4 fill-accent-foreground" />
                <span>{showAdoptForm ? 'Back to Profile' : 'Apply to Adopt'}</span>
              </button>
            )}
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-mint bg-mint/30 p-6 text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint text-mint-foreground">
                <CheckCircle2 className="size-7" />
              </div>
              <h3 className="font-display text-2xl text-primary">
                Adoption Request Received!
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Thank you, <strong>{applicantName}</strong>! Your application for{' '}
                <strong>{pet.name}</strong> was successfully submitted to the backend.
                The shelter team can now review your request.
              </p>
              <button
                onClick={onClose}
                className="rounded-full bg-primary text-primary-foreground font-semibold px-6 py-2.5 text-xs hover:bg-primary/90 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : showAdoptForm ? (
            <form onSubmit={handleSubmitAdoption} className="space-y-4 rounded-2xl border border-border bg-secondary/30 p-5">
              <h3 className="font-display text-xl text-primary">
                Adoption Application for {pet.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Provide your details so the shelter can review your application.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Full Name *</label>
                  <input
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">City *</label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                    placeholder="Your city"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Housing Type *</label>
                  <select
                    value={housingType}
                    onChange={(e) => setHousingType(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                  >
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Farmhouse">Farmhouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Pet Experience *</label>
                  <select
                    value={petExperience}
                    onChange={(e) => setPetExperience(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                  >
                    <option value="First-time owner">First-time owner</option>
                    <option value="Previously owned pets">Previously owned pets</option>
                    <option value="Currently own pets">Currently own pets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Why would you like to adopt {pet.name}? *
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm"
                  placeholder="Tell the shelter about your home and why you'd like to adopt."
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdoptForm(false);
                    setError('');
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground font-semibold px-5 py-2 text-xs shadow-soft hover:bg-accent/90 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  About {pet.name}
                </h4>
                <p className="mt-2 text-sm text-foreground/90 leading-relaxed">
                  {pet.description}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                  <Shield className="size-4 text-accent" />
                  Medical History
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`size-4 ${pet.vaccinated ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span>{pet.vaccinated ? 'Vaccinated' : 'Vaccination in progress'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`size-4 ${pet.neutered ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span>{pet.neutered ? 'Sterilized / Neutered' : 'Sterilization planned'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Caring Shelter & Location
                </h4>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Building2 className="size-4 text-accent" />
                  <span>{pet.shelter}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {pet.contact || 'Contact details available from shelter'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Contact the shelter for details
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
