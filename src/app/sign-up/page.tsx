"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function SignUpPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  React.useEffect(() => { if (isSignedIn) router.replace("/dashboard"); }, [isSignedIn, router]);
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 py-8">
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/dashboard"><ArrowLeft className="size-4" /> Back to workspace</Link>
      <div className="my-auto flex flex-col items-center gap-5 py-10">
        <div className="text-center"><h1 className="text-2xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-muted-foreground">Your account is powered by Clerk.</p></div>
        <SignUp routing="hash" signInUrl="/login" forceRedirectUrl="/dashboard" />
        <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">Your account workspace is separate from guest data on this device. Guest data is not automatically imported.</p>
        <Link className="text-sm underline underline-offset-4" href="/dashboard">Continue without signing in</Link>
      </div>
    </main>
  );
}
