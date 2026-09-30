import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy — decyde',
};

export default function PrivacyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen font-sans">
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-xs font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          decyde doesn&apos;t ask for an account, so here&apos;s exactly what that means.
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              What we don&apos;t collect
            </h2>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-relaxed">
              <li>No email, name, or password — there&apos;s no sign-up, ever.</li>
              <li>
                No IP address is stored. Our server briefly holds IPs in memory only, to stop spam —
                never written to a database, and gone on the next restart.
              </li>
              <li>No ad trackers, no analytics pixels, no third-party tracking scripts.</li>
              <li>No cookies used to track you across other sites.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              What we do store
            </h2>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-relaxed">
              <li>The question and options you type when you create a room.</li>
              <li>Your vote (yes / no / meh) on each option.</li>
              <li>
                A random ID generated in your browser&apos;s local storage — not your name, email, or
                anything else that identifies you. It just tells &ldquo;this vote&rdquo; apart from
                &ldquo;that vote.&rdquo;
              </li>
              <li>A small streak counter tied to that same random ID, if you come back and vote again.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              Your random ID
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              That ID lives only in your browser&apos;s local storage. Clear your browser data, or use a
              different device or browser, and it&apos;s gone — a fresh one gets created next time, with
              no link back to the old one.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider">
              The banner you saw
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              The random ID above is strictly necessary — without it, decyde can&apos;t tell one vote
              from another, so it&apos;s not something &ldquo;Decline&rdquo; turns off. The one thing
              that choice does control is the streak counter: pick <span className="text-foreground font-medium">Accept</span> and
              it keeps counting; pick <span className="text-foreground font-medium">Decline</span> and
              decyde stops writing new streak data, though voting itself works exactly the same either
              way.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
