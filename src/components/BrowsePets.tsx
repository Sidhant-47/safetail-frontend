
import React, { useState, useMemo, useEffect } from 'react';
import type { Pet } from '../types';
import type { User } from '../types/auth';
import { PETS_DATA } from '../data/petsData';
import { PetDetailsModal } from './PetDetailsModal';
import { Search, MapPin, ChevronDown, Filter, X } from 'lucide-react';

interface BrowsePetsProps {
  currentUser?: User | null;
}

export const BrowsePets: React.FC<BrowsePetsProps> = ({ currentUser }) => {
  const [pets, setPets] = useState<Pet[]>(PETS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  useEffect(() => {
    const loadPets = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/pets');

        if (!response.ok) {
          throw new Error('Failed to load pets');
        }

        const result = await response.json();
        const data = Array.isArray(result) ? result : result.value;

        if (!Array.isArray(data)) {
          throw new Error('Invalid pet data');
        }

        const backendPets: Pet[] = data.map((item: any) => {
          const fallback = PETS_DATA.find(
            (pet) => pet.name.toLowerCase() === String(item.name).toLowerCase()
          );

          const months = Number(item.age_months) || 0;
          const age =
            months >= 12 && months % 12 === 0
              ? `${months / 12} ${months / 12 === 1 ? 'year' : 'years'}`
              : months >= 12
                ? `${Math.floor(months / 12)} years ${months % 12} months`
                : `${months} months`;

          return {
            id: String(item.pet_id),
            name: item.name,
            species: item.species,
            breed: item.breed,
            age,
            gender: item.gender,
            city: item.city,
            image: item.image_url || fallback?.image || '',
            description: item.description || fallback?.description || '',
            vaccinated: Boolean(item.vaccinated),
            neutered: Boolean(item.sterilised),
            shelter: item.shelter_name || fallback?.shelter || 'Local Shelter',
            contact: fallback?.contact || '',
          };
        });

        console.log(
  'Backend pet IDs:',
  backendPets.map((pet) => ({ name: pet.name, id: pet.id }))
);
setPets(backendPets);
      } catch (error) {
        console.error('Could not load pets from backend:', error);
      }
    };

    loadPets();
  }, []);

  const cities = ['All', 'Pune', 'Mumbai', 'Nashik', 'Nagpur'];
  

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch =
        searchQuery === '' ||
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecies =
        selectedSpecies === 'All' ||
        pet.species.toLowerCase() === selectedSpecies.toLowerCase();

      const matchesCity =
        selectedCity === 'All' ||
        pet.city.toLowerCase() === selectedCity.toLowerCase();

      return matchesSearch && matchesSpecies && matchesCity;
    });
  }, [pets, searchQuery, selectedSpecies, selectedCity]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedSpecies !== 'All' ||
    selectedCity !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSpecies('All');
    setSelectedCity('All');
  };

  return (
    <section id="pets" className="border-y border-border bg-secondary/40 py-16 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Available Companions
            </span>
            <h2 className="mt-1 font-display text-3xl md:text-4xl text-primary">
              Pets looking for a home
            </h2>
            <p className="mt-2 text-muted-foreground">
              {filteredPets.length} of {pets.length} pets match your current search.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-accent hover:bg-card transition-colors cursor-pointer border border-accent/20"
            >
              <X className="size-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-soft md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, breed or city"
              aria-label="Search pets"
              className="flex w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring h-11 rounded-full pl-10"
            />
          </div>

          <div className="relative">
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              aria-label="Filter by Species"
              className="w-full appearance-none border border-input bg-card px-4 py-2 text-sm shadow-xs rounded-full h-11 pr-10 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="All">All Species</option>
              <option value="Dog">Dogs 🐕</option>
              <option value="Cat">Cats 🐈</option>
              <option value="Rabbit">Rabbits 🐇</option>
            </select>
            <ChevronDown className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-70" />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filter by City"
              className="w-full appearance-none border border-input bg-card px-4 py-2 text-sm shadow-xs rounded-full h-11 pr-10 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All Cities' : city}
                </option>
              ))}
            </select>
            <MapPin className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-70" />
          </div>
        </div>

        {filteredPets.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-primary">
              No pets found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-full border border-accent/30 px-5 py-2 text-sm font-semibold text-accent hover:bg-card"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => (
              <article
                key={pet.id}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-transform hover:-translate-y-1"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPet(pet)}
                  className="block w-full cursor-pointer text-left"
                  aria-label={`View details for ${pet.name}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-secondary">
                    <img
                      src={pet.image || undefined}
                      alt={pet.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-primary">
                          {pet.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {pet.breed}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                        {pet.species}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border px-3 py-1">
                        {pet.age}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1">
                        {pet.gender}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                        <MapPin className="size-3" />
                        {pet.city}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {pet.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
                      <span className={pet.vaccinated ? 'text-green-700' : 'text-amber-700'}>
                        {pet.vaccinated ? 'Vaccinated' : 'Vaccination pending'}
                      </span>
                      <span className="font-semibold text-accent">
                        View details →
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedPet && (
        <PetDetailsModal
          pet={selectedPet}
          currentUser={currentUser}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </section>
  );
};
