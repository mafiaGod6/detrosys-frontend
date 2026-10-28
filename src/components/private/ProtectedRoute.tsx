import { useEffect, useState, type ReactNode } from "react";

type User = {
  id: string;
  email: string;
  email_verified: boolean;
  onboarding_complete: boolean;
};

type ProtectedRouteProps = {
  children: ReactNode;
  requireOnboarding?: boolean;
  onboardingRoute?: boolean;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function ProtectedRoute({
  children,
  requireOnboarding = false,
  onboardingRoute = false,
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("detrosys_access_token");

      if (!token) {
        window.location.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          localStorage.removeItem("detrosys_access_token");
          localStorage.removeItem("detrosys_refresh_token");

          window.location.replace("/login");
          return;
        }

        const currentUser: User = await response.json();

        setUser(currentUser);

        if (onboardingRoute && currentUser.onboarding_complete) {
          window.location.replace("/app");
          return;
        }

        if (
          requireOnboarding &&
          !currentUser.onboarding_complete
        ) {
          window.location.replace("/onboarding");
          return;
        }

        setLoading(false);
      } catch {
        window.location.replace("/login");
      }
    };

    loadUser();
  }, [requireOnboarding, onboardingRoute]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] dark:bg-[#0d0d0d]">
        <div className="text-sm text-neutral-500">
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}