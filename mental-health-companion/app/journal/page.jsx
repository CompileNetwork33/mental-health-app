'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

function truncateText(text, max = 100) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function JournalPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'Please log in to access your journal.');
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error: entriesError } = await supabase
      .from('journals')
      .select('id,title,content,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (entriesError) {
      setError(entriesError.message);
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter((entry) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.content?.toLowerCase().includes(query)
    );
  });

  async function handleSaveEntry(event) {
    event.preventDefault();
    if (!userId) {
      setError('Please log in before saving journal entries.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setError('Please add both a title and content.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    const { error: insertError } = await supabase.from('journals').insert({
      user_id: userId,
      title: cleanTitle,
      content: cleanContent,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setTitle('');
    setContent('');
    setSuccessMessage('Journal entry saved successfully.');
    await loadEntries();
    setSaving(false);
  }

  async function handleDeleteEntry(entryId) {
    const confirmed = window.confirm('Are you sure you want to delete this journal entry?');
    if (!confirmed) return;

    setDeletingId(entryId);
    setError('');
    setSuccessMessage('');

    const { error: deleteError } = await supabase
      .from('journals')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId('');
      return;
    }

    setSuccessMessage('Journal entry deleted.');
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
    }
    await loadEntries();
    setDeletingId('');
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E]">
      <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6">
        <section className="space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <h1 className="text-2xl font-semibold text-[#1A73E8] md:text-3xl">Journal</h1>
            <p className="mt-2 text-sm text-slate-600">
              Write your thoughts, reflect on your day, and revisit your growth over time.
            </p>
            {error ? (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700 font-medium mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            ) : null}
            {successMessage ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#1A73E8]">New journal entry</h2>
              <form onSubmit={handleSaveEntry} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="entry-title" className="mb-2 block text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    id="entry-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give this entry a title"
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#1A73E8] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="entry-content" className="mb-2 block text-sm font-medium text-slate-700">
                    Content
                  </label>
                  <textarea
                    id="entry-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write freely about how you are feeling..."
                    rows={10}
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#1A73E8] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving entry...' : 'Save Entry'}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#00BFA5]">Search entries</h2>
              <div className="mt-4">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title or content..."
                  className="w-full rounded-2xl border border-[#BFEAE3] bg-[#EEF9F7] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#00BFA5] focus:bg-white"
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {search.trim()
                  ? `${filteredEntries.length} matching entr${filteredEntries.length === 1 ? 'y' : 'ies'}`
                  : `${entries.length} total entr${entries.length === 1 ? 'y' : 'ies'}`}
              </p>
            </article>
          </div>

          <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#1A73E8]">Previous journal entries</h2>

            {loading ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F5F7FA] p-4 text-sm text-slate-700">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#CFE4FF] border-t-[#1A73E8]" />
                Loading journal entries...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-[#F5F7FA] border border-[#E6ECF5] p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EAF3FE] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#1A73E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1A73E8] mb-2">
                  {search.trim() ? 'No matching entries' : 'Start your journal journey'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {search.trim()
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Your first journal entry is waiting to be written. Share your thoughts and feelings above.'}
                </p>
                {!search.trim() && (
                  <div className="inline-flex items-center gap-2 text-xs text-[#00BFA5] bg-[#E6F7F4] px-3 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Begin your wellness journey
                  </div>
                )}
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {filteredEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-[#DCE6F2] bg-[#F5F7FA] p-4 text-sm text-slate-700"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800">{entry.title || 'Untitled entry'}</p>
                        <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">{truncateText(entry.content, 100)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#1A73E8] transition hover:bg-[#EAF3FE]"
                        >
                          Read more
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                          className="rounded-xl bg-red-100 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>

      {selectedEntry ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[#1A73E8]">{selectedEntry.title || 'Untitled entry'}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(selectedEntry.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl bg-[#F5F7FA] p-4 text-sm leading-relaxed text-slate-700">
              {selectedEntry.content}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
