
import React, { useState, useMemo } from 'react';
import type { FeedbackSubmission, FeedbackStatus, FeedbackCategory } from '../types';
import {
  updateFeedbackStatus,
  deleteFeedbackSubmission,
} from '../utils/storage';
import {
  LayoutDashboard,
  Star,
  Search,
  Filter,
  Trash2,
  Eye,
  Mail,
  Lock,
  Globe,
  X,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  submissions: FeedbackSubmission[];
  onSubmissionsUpdated: (newSubmissions: FeedbackSubmission[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  onSubmissionsUpdated,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | FeedbackStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectModalSub, setInspectModalSub] = useState<FeedbackSubmission | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const metrics = useMemo(() => {
    const total = submissions.length;
    const avgRating = total > 0
      ? (submissions.reduce((sum, item) => sum + item.rating, 0) / total).toFixed(1)
      : '0.0';

    const newCount = submissions.filter((item) => item.status === 'New').length;
    const reviewedCount = submissions.filter((item) => item.status === 'Reviewed').length;
    const resolvedCount = submissions.filter((item) => item.status === 'Resolved').length;
    const publicCount = submissions.filter((item) => item.isPublicReview).length;
    const privateCount = total - publicCount;

    const catCounts: Record<FeedbackCategory, number> = {
      'Adoption Experience': 0,
      'Pet-Care Resources': 0,
      'Shelter & Staff Support': 0,
      'Website & Accessibility': 0,
      'General Feedback': 0,
    };

    submissions.forEach((item) => {
      if (catCounts[item.category] !== undefined) {
        catCounts[item.category]++;
      }
    });

    return {
      total,
      avgRating,
      newCount,
      reviewedCount,
      resolvedCount,
      publicCount,
      privateCount,
      catCounts,
    };
  }, [submissions]);

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return submissions.filter((item) => {
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;

      const matchSearch =
        query === '' ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        (item.email ?? '').toLowerCase().includes(query);

      return matchStatus && matchCategory && matchSearch;
    });
  }, [submissions, statusFilter, categoryFilter, searchQuery]);

  const handleStatusChange = async (
    id: string,
    newStatus: FeedbackStatus
  ) => {
    const original = submissions.find((item) => item.id === id);
    if (!original || original.status === newStatus || busyId !== null) return;

    setBusyId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await updateFeedbackStatus(id, newStatus);
      onSubmissionsUpdated(updated);

      setInspectModalSub((current) =>
        current?.id === id ? { ...current, status: newStatus } : current
      );

      setSuccessMessage('Review status updated successfully.');
    } catch (error) {
      console.error('Failed to update review status:', error);
      setErrorMessage(
        'Could not update the review. Check the backend and try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const item = submissions.find((submission) => submission.id === id);
    if (!item || busyId !== null) return;

    const confirmed = window.confirm(
      `Permanently delete "${item.title || 'this review'}" from the database?`
    );

    if (!confirmed) return;

    setBusyId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await deleteFeedbackSubmission(id);
      onSubmissionsUpdated(updated);

      if (inspectModalSub?.id === id) {
        setInspectModalSub(null);
      }

      setSuccessMessage('Review deleted successfully.');
    } catch (error) {
      console.error('Failed to delete review:', error);
      setErrorMessage(
        'Could not delete the review. Check the backend and try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section id="admin" className="mx-auto max-w-6xl px-5 py-16 scroll-mt-20">
      <div className="mb-10 flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <LayoutDashboard className="size-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">
              Database Connected
            </span>
            <h3 className="font-display text-lg font-bold text-primary">
              Shelter Operations & Feedback Portal
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Review records currently loaded from the backend. Private feedback
            requires a separate authenticated admin endpoint.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="mb-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Submissions Loaded
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-display text-3xl font-black text-primary">
              {metrics.total}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {metrics.publicCount} Public · {metrics.privateCount} Private
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Average Rating
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="flex items-center gap-1.5 font-display text-3xl font-black text-primary">
              {metrics.avgRating}
              <Star className="size-5 fill-amber-400 text-amber-500" />
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            New Submissions
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-display text-3xl font-black text-amber-600">
              {metrics.newCount}
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Requires Action
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Reviewed & Resolved
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-display text-3xl font-black text-emerald-700">
              {metrics.reviewedCount + metrics.resolvedCount}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {metrics.total > 0
                ? Math.round(
                    ((metrics.reviewedCount + metrics.resolvedCount) /
                      metrics.total) *
                      100
                  )
                : 0}
              % Complete
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h4 className="mb-3 font-display text-base font-bold text-primary">
          Category Distribution
        </h4>
        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(metrics.catCounts).map(([cat, count]) => {
            const pct = metrics.total > 0
              ? Math.round((count / metrics.total) * 100)
              : 0;

            return (
              <div key={cat} className="space-y-2 rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                <div className="flex items-center justify-between gap-2 font-bold text-primary">
                  <span className="truncate">{cat}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {pct}% of loaded submissions
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Filter className="size-3.5" />
              Status:
            </span>
            {(['All', 'New', 'Reviewed', 'Resolved'] as const).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  statusFilter === status
                    ? status === 'New'
                      ? 'bg-amber-500 text-white'
                      : status === 'Reviewed'
                        ? 'bg-sky-600 text-white'
                        : status === 'Resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {status}
                {status === 'New' && metrics.newCount > 0
                  ? ` (${metrics.newCount})`
                  : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold text-primary focus:outline-none"
            >
              <option value="All">All Categories</option>
              {Object.keys(metrics.catCounts).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, author name, or email..."
            aria-label="Search feedback submissions"
            className="w-full rounded-full border border-input bg-card py-2 pl-10 pr-4 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filteredList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No feedback submissions match your current filters.
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-primary">
                      {item.title || '(Untitled review)'}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'New'
                          ? 'border-amber-300 bg-amber-100 text-amber-800'
                          : item.status === 'Reviewed'
                            ? 'border-sky-300 bg-sky-100 text-sky-800'
                            : 'border-emerald-300 bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.isPublicReview ? (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <Globe className="size-3 text-accent" />
                        Public Review
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold text-blush-foreground">
                        <Lock className="size-3" />
                        Private Feedback
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    {item.email && (
                      <span className="flex items-center gap-1 text-primary">
                        <Mail className="size-3 text-accent" />
                        {item.email}
                      </span>
                    )}
                    <span>{item.category}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${
                          star <= item.rating
                            ? 'fill-current'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>

                  <select
                    value={item.status}
                    disabled={busyId !== null}
                    onChange={(e) =>
                      handleStatusChange(
                        item.id,
                        e.target.value as FeedbackStatus
                      )
                    }
                    aria-label={`Change status for ${item.title || 'review'}`}
                    className="cursor-pointer rounded-xl border border-input bg-card px-2.5 py-1 pr-6 text-xs font-bold text-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="New">Status: New</option>
                    <option value="Reviewed">Status: Reviewed</option>
                    <option value="Resolved">Status: Resolved</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setInspectModalSub(item)}
                    disabled={busyId !== null}
                    className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
                    title="Inspect Feedback"
                    aria-label="Inspect feedback details"
                  >
                    <Eye className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={busyId !== null}
                    className="cursor-pointer rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    title="Delete Submission"
                    aria-label="Delete submission"
                  >
                    {busyId === item.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="rounded-2xl bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>

      {inspectModalSub && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setInspectModalSub(null)}
        >
          <div
            className="w-full max-w-xl space-y-5 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="rounded-full bg-sand px-3 py-0.5 text-[10px] font-bold uppercase text-sand-foreground">
                  Feedback Inspection
                </span>
                <h3 id="inspect-modal-title" className="mt-1 font-display text-xl text-primary">
                  {inspectModalSub.title || '(Untitled review)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalSub(null)}
                className="cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-secondary"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-secondary/40 p-3.5">
                <div>
                  <span className="block font-bold text-muted-foreground">Author:</span>
                  <span className="font-semibold text-primary">{inspectModalSub.name}</span>
                </div>
                <div>
                  <span className="block font-bold text-muted-foreground">Email:</span>
                  <span className="font-semibold text-primary">
                    {inspectModalSub.email || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-muted-foreground">Category:</span>
                  <span className="font-semibold text-primary">{inspectModalSub.category}</span>
                </div>
                <div>
                  <span className="block font-bold text-muted-foreground">Submitted:</span>
                  <span className="font-semibold text-primary">
                    {new Date(inspectModalSub.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-muted-foreground">Visibility:</span>
                  <span className="font-semibold text-primary">
                    {inspectModalSub.isPublicReview ? 'Public' : 'Private'}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-muted-foreground">Rating:</span>
                  <span className="font-semibold text-primary">
                    {inspectModalSub.rating}/5
                  </span>
                </div>
              </div>

              <div>
                <span className="mb-1 block font-bold text-muted-foreground">Detailed Message:</span>
                <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                  {inspectModalSub.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">Status:</span>
                  <select
                    value={inspectModalSub.status}
                    disabled={busyId !== null}
                    onChange={(e) =>
                      handleStatusChange(
                        inspectModalSub.id,
                        e.target.value as FeedbackStatus
                      )
                    }
                    className="cursor-pointer rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold text-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="New">New</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectModalSub(null)}
                  className="cursor-pointer rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
