import { Layout } from "@/components/layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-8xl font-display font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">We couldn't find what you were looking for.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-foreground text-background rounded-xl font-bold">
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
