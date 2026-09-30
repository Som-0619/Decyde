import Link from 'next/link';

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <Link
        href="/privacy"
        className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 transition hover:underline"
      >
        Privacy — what we don&apos;t store
      </Link>
    </div>
  );
}
