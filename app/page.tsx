import { AppShell } from "@/components/AppShell";
import { redirect } from "next/navigation";

export default function Home() {
  redirect('/dashboard');
  return (
    <AppShell>
      {/* Main content goes here */}
    </AppShell>
  );
}