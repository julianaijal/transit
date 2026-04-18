"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles/Home.module.scss";
import { IStation } from "./interfaces/interfaces";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IStation[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stations?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Transit</h1>
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Search station..."
          value={query}
          onChange={handleSearch}
        />
        {loading && <span>Searching...</span>}
      </div>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((station) => (
            <li key={station.code}>
              <Link href={`/departures/${station.code}`}>{station.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
