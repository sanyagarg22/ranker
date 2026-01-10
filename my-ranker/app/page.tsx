'use client';

import { useState, useEffect } from 'react';

type State = 
  | { type: 'ranking'; currentItem: string; sorted: string[]; unsorted: string[]; left: number; right: number }
  | { type: 'complete'; ranking: string[] };

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'compare' | 'rankings'>('compare');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = text.split('\n')
          .map(line => line.split(',')[0].trim())
          .filter(item => item);

        if (items.length === 0) {
          setError('CSV file is empty');
          return;
        }

        if (items.length === 1) {
          setState({ type: 'complete', ranking: items });
          return;
        }

        const shuffled = [...items].sort(() => Math.random() - 0.5);
        const [first, ...rest] = shuffled;

        setState({
          type: 'ranking',
          currentItem: rest[0],
          sorted: [first],
          unsorted: rest.slice(1),
          left: 0,
          right: 0,
        });
        setError('');
      } catch (err) {
        setError('Error reading file');
      }
    };
    reader.readAsText(file);
  };

  const handleSelect = (preferCurrent: boolean) => {
    if (!state || state.type !== 'ranking') return;

    const { currentItem, sorted, unsorted, left, right } = state;
    const mid = Math.floor((left + right) / 2);
    const newLeft = preferCurrent ? left : mid + 1;
    const newRight = preferCurrent ? mid - 1 : right;

    if (newLeft > newRight) {
      const newSorted = [...sorted];
      newSorted.splice(newLeft, 0, currentItem);

      if (unsorted.length > 0) {
        setState({
          type: 'ranking',
          currentItem: unsorted[0],
          sorted: newSorted,
          unsorted: unsorted.slice(1),
          left: 0,
          right: newSorted.length - 1,
        });
      } else {
        setState({ type: 'complete', ranking: newSorted });
      }
    } else {
      setState({ ...state, left: newLeft, right: newRight });
    }
  };

  const handleSkip = () => {
    if (!state || state.type !== 'ranking') return;

    const { sorted, unsorted } = state;

    if (unsorted.length > 0) {
      setState({
        type: 'ranking',
        currentItem: unsorted[0],
        sorted,
        unsorted: unsorted.slice(1),
        left: 0,
        right: sorted.length - 1,
      });
    } else {
      setState({ type: 'complete', ranking: sorted });
    }
  };

  if (!state || state.type === 'complete') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-blue-50 p-4 pt-24 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-4">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <div className="w-full max-w-3xl">
          {state?.type === 'complete' ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-800 bg-clip-text text-4xl font-bold text-transparent">
                  Final Ranking
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">Your items have been ranked!</p>
              </div>
              <div className="mb-8 space-y-3">
                {state.ranking.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-800 text-lg font-bold text-white shadow-md">
                      {i + 1}
                    </div>
                    <div className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{item}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setState(null)}
                  className="rounded-xl border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500"
                >
                  Rank Another
                </button>
                <button
                  onClick={() => {
                    const csv = state.ranking.map((item, i) => `${i + 1},${item}`).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ranking.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-800 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-800 hover:shadow-xl"
                >
                  Download CSV
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-16 text-center backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <label htmlFor="upload" className="cursor-pointer">
                <div className="mb-6 text-6xl">📊</div>
                <h2 className="mb-3 bg-gradient-to-r from-blue-600 to-purple-800 bg-clip-text text-3xl font-bold text-transparent">
                  Ranking Tool
                </h2>
                <p className="mb-6 text-zinc-600 dark:text-zinc-400">Upload a CSV file with items to rank</p>
                <input
                  id="upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-800 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl">
                  Choose File
                </div>
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">One item per line (first column used)</p>
              </label>
              {error && (
                <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const mid = Math.floor((state.left + state.right) / 2);
  const item1 = state.sorted[mid];
  const total = state.sorted.length + state.unsorted.length + 1;
  const progress = ((state.sorted.length / total) * 100).toFixed(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-blue-50 p-4 pt-24 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => setActiveTab('compare')}
              className={`rounded-lg px-6 py-3 font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Compare Items
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`rounded-lg px-6 py-3 font-semibold transition-all ${
                activeTab === 'rankings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Current Rankings ({state.sorted.length})
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      <div className="w-full max-w-5xl">

        <div className="mb-8">
          <div className="mb-3 flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span>Progress: {state.sorted.length} / {total} items</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 shadow-inner dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-800 transition-all duration-500 shadow-md"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {activeTab === 'compare' ? (
          <>
            <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:gap-8">
              <button
                onClick={() => handleSelect(false)}
                className="group flex-1 rounded-2xl border-2 border-zinc-200 bg-white p-10 text-left shadow-lg transition-all hover:border-blue-400 hover:shadow-2xl hover:scale-[1.02] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Option 1
                </div>
                <div className="text-3xl font-bold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {item1}
                </div>
              </button>

              <div className="flex items-center justify-center">
                <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-800 px-4 py-2 text-xl font-bold text-white shadow-lg">
                  vs
                </div>
              </div>

              <button
                onClick={() => handleSelect(true)}
                className="group flex-1 rounded-2xl border-2 border-zinc-200 bg-white p-10 text-left shadow-lg transition-all hover:border-purple-800 hover:shadow-2xl hover:scale-[1.02] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-purple-800"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Option 2
                </div>
                <div className="text-3xl font-bold text-zinc-900 transition-colors group-hover:text-purple-800 dark:text-zinc-100 dark:group-hover:text-purple-400">
                  {state.currentItem}
                </div>
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                className="rounded-xl border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500"
              >
                Skip This Item ({state.currentItem})
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {state.sorted.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-4 text-4xl">🏆</div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-700 dark:text-zinc-300">No items ranked yet</h3>
                <p className="text-zinc-600 dark:text-zinc-400">Switch to Compare Items tab to start ranking</p>
              </div>
            ) : (
              state.sorted.map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-800 text-lg font-bold text-white shadow-md">
                    {i + 1}
                  </div>
                  <div className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{item}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
