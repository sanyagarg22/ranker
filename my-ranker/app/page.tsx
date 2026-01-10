'use client';

import { useState } from 'react';

type State = 
  | { type: 'ranking'; currentItem: string; sorted: string[]; unsorted: string[]; left: number; right: number }
  | { type: 'complete'; ranking: string[] };

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'compare' | 'rankings'>('compare');
  const [originalItems, setOriginalItems] = useState<string[]>([]);

  const initRanking = (items: string[]) => {
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
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = text.split('\n')
          .map(line => line.split(',')[0].trim())
          .filter(item => item);
        setOriginalItems(items);
        initRanking(items);
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-purple-100 p-4">
        <div className="w-full max-w-3xl">
          {state?.type === 'complete' ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-800 bg-clip-text text-4xl font-bold text-transparent">
                  Final Ranking
                </h1>
                <p className="text-zinc-600">Your items have been ranked!</p>
              </div>
              <div className="mb-8 space-y-3">
                {state.ranking.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-800 text-lg font-bold text-white shadow-md">
                      {i + 1}
                    </div>
                    <div className="text-lg font-medium text-zinc-900">{item}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setState(null)}
                  className="rounded-xl border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md"
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
            <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white/50 p-16 text-center backdrop-blur-sm">
              <label htmlFor="upload" className="cursor-pointer">
                <h2 className="mb-3 bg-gradient-to-r from-blue-600 to-purple-800 bg-clip-text text-3xl font-bold text-transparent">
                  Ranking Tool
                </h2>
                <p className="mb-6 text-zinc-600">Upload a CSV file with items to rank</p>
                <input
                  id="upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={onUpload}
                  className="hidden"
                />
                <div className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-800 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl">
                  Choose File
                </div>
                <p className="mt-4 text-sm text-zinc-500">One item per line (first column used)</p>
              </label>
              {error && (
                <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-purple-100 p-4">
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-4 py-4">
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('compare')}
              className={`rounded-lg px-6 py-3 font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-800'
              }`}
            >
              Compare Items
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`rounded-lg px-6 py-3 font-semibold transition-all ${
                activeTab === 'rankings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-800'
              }`}
            >
              Current Rankings ({state.sorted.length})
            </button>
          </div>
          <button
            onClick={() => {
              if (originalItems.length > 0) {
                initRanking(originalItems);
                setActiveTab('compare');
              }
            }}
            className="absolute right-4 rounded-lg border-2 border-red-300 bg-white px-4 py-2 font-semibold text-red-600 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-700"
          >
            Start Over
          </button>
        </div>
      </div>
      <div className="w-full max-w-5xl pt-24">

        <div className="mb-8">
          <div className="mb-3 flex justify-between text-sm font-medium text-zinc-700">
            <span>Progress: {state.sorted.length} / {total} items</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 shadow-inner">
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
                className="group flex-1 rounded-2xl border-2 border-zinc-200 bg-white p-10 text-left shadow-lg transition-all hover:border-blue-400 hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Option 1
                </div>
                <div className="text-3xl font-bold text-zinc-900 transition-colors group-hover:text-blue-600">
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
                className="group flex-1 rounded-2xl border-2 border-zinc-200 bg-white p-10 text-left shadow-lg transition-all hover:border-purple-800 hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Option 2
                </div>
                <div className="text-3xl font-bold text-zinc-900 transition-colors group-hover:text-purple-800">
                  {state.currentItem}
                </div>
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                className="rounded-xl border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"
              >
                Skip "{state.currentItem}"
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {state.sorted.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center">
                <div className="mb-4 text-4xl">🏆</div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-700">No items ranked yet</h3>
                <p className="text-zinc-600">Switch to Compare Items tab to start ranking</p>
              </div>
            ) : (
              state.sorted.map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-800 text-lg font-bold text-white shadow-md">
                    {i + 1}
                  </div>
                  <div className="text-lg font-medium text-zinc-900">{item}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
