import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "About | Bible in a Year",
};

export default function InfoPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 px-4 py-10 flex justify-center">
        <article className="max-w-2xl w-full space-y-10">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-leather-accent hover:text-leather-body transition-colors"
          >
            &larr; Back to reading
          </Link>

          {/* Hero */}
          <section className="text-center space-y-4">
            <Image
              src="/logo.png"
              alt="Bible in a Year"
              width={120}
              height={120}
              className="rounded-lg mx-auto"
            />
            <h1 className="font-cinzel text-3xl text-leather-accent">
              Bible in a Year
            </h1>
            <p className="font-serif text-leather-muted text-lg">
              A companion for Fr. Mike Schmitz&apos;s Bible in a Year podcast
            </p>
          </section>

          <hr className="border-leather-border" />

          {/* What is Bible in a Year? */}
          <section className="space-y-3">
            <h2 className="font-cinzel text-xl text-leather-accent">
              What is Bible in a Year?
            </h2>
            <div className="font-serif text-leather-body/90 space-y-3 leading-relaxed">
              <p>
                Bible in a Year is a podcast by Fr. Mike Schmitz, produced by
                Ascension, that walks you through the entire Bible in 365 days.
                Each episode includes the day&apos;s scripture readings followed by
                Fr. Mike&apos;s reflection and prayer.
              </p>
              <p>
                The reading plan is built on Jeff Cavins&apos; Great Adventure Bible
                Timeline, organizing scripture into 15 historical periods — from
                the Early World through the life of the Church. This narrative
                approach helps the Bible come alive as one continuous story
                rather than a collection of disconnected books.
              </p>
            </div>
          </section>

          <hr className="border-leather-border" />

          {/* What does this app do? */}
          <section className="space-y-3">
            <h2 className="font-cinzel text-xl text-leather-accent">
              What Does This App Do?
            </h2>
            <p className="font-serif text-leather-body/90 leading-relaxed">
              This app is a companion that brings together everything you need
              for each day&apos;s reading in one place:
            </p>
            <ul className="font-serif text-leather-body/90 space-y-2 leading-relaxed list-none">
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Bible Text</strong> — The full scripture for each day&apos;s readings, right alongside the podcast</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Podcast Player</strong> — Listen to Fr. Mike&apos;s episode for the day without leaving the app</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Discussion Transcripts</strong> — Follow along with the episode&apos;s commentary, with interactive links that jump to the exact verses being discussed</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Personal Notes</strong> — Write reflections for each day, saved automatically in your browser</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Words of Jesus</strong> — Highlighted with golden illumination so they stand out as you read</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span><strong className="text-leather-body">Progress Tracking</strong> — Pick up where you left off; the app remembers your last visited day</span>
              </li>
            </ul>
          </section>

          <hr className="border-leather-border" />

          {/* How to use it */}
          <section className="space-y-3">
            <h2 className="font-cinzel text-xl text-leather-accent">
              How to Use It
            </h2>
            <ul className="font-serif text-leather-body/90 space-y-2 leading-relaxed list-none">
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span>Use the arrow buttons to move between days, or open the period dropdown to jump to any day in the plan</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span>Click highlighted text in the discussion panel to jump directly to the Bible verse being referenced</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span>Use the notes panel to journal your thoughts — everything is saved in your browser automatically</span>
              </li>
              <li className="flex gap-3">
                <span className="text-leather-accent shrink-0">&#9702;</span>
                <span>Your progress is remembered, so you can close the app and pick up right where you left off</span>
              </li>
            </ul>
          </section>

          <hr className="border-leather-border" />

          {/* The Reading Plan */}
          <section className="space-y-3">
            <h2 className="font-cinzel text-xl text-leather-accent">
              The Reading Plan
            </h2>
            <p className="font-serif text-leather-body/90 leading-relaxed">
              The reading plan is available from Ascension Press. You can get
              your own copy at{" "}
              <a
                href="https://ascensionpress.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-leather-accent underline underline-offset-2 hover:text-leather-body transition-colors"
              >
                ascensionpress.com
              </a>
              .
            </p>
          </section>

          {/* Bottom spacer */}
          <div className="h-8" />
        </article>
      </main>
    </>
  );
}
