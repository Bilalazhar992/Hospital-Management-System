import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      <main className="container mx-auto px-6 py-12 flex-1">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Hospital Management System</h1>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              A clean, secure, and easy-to-use platform to manage patients, appointments,
              medical records, billing and more. Built with Next.js, Better Auth and Drizzle.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/appointments">Book Appointment</Link>
              </Button>
            </div>
          </div>

          <div className="w-full rounded-lg overflow-hidden shadow-md">
            <Image
              src="/hospital-hero.jpg"
              alt="Hospital front"
              width={1200}
              height={800}
              className="object-cover w-full h-64 md:h-80"
              priority
            />
          </div>
        </section>

        {/* Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Core features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard title="Appointments" desc="Schedule and manage patient appointments." />
            <FeatureCard title="Medical Records" desc="Secure patient records and doctor notes." />
            <FeatureCard title="Billing" desc="Generate invoices and manage payments." />
            <FeatureCard title="Lab Tests" desc="Track lab requests and results." />
          </div>
        </section>

        {/* Departments preview */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Departments</h2>
            <Link href="/departments" className="text-sm text-muted-foreground hover:underline">View all</Link>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <DepartmentCard name="Cardiology" desc="Heart specialists and treatments." />
            <DepartmentCard name="Radiology" desc="Imaging and diagnostics." />
            <DepartmentCard name="Emergency" desc="24/7 emergency care." />
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Hospital Management System — Crafted with care.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function DepartmentCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="p-4 rounded-lg border hover:shadow-sm transition">
      <h4 className="font-medium mb-1">{name}</h4>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
