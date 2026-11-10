import { getProfile } from "@/lib/db";
import { StudioShell } from "@/components/studio-shell";

export const dynamic = "force-dynamic";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = getProfile();
  return (
    <StudioShell
      profile={{
        email: profile.email,
        plan: profile.plan,
        credits: profile.credits,
      }}
    >
      {children}
    </StudioShell>
  );
}
