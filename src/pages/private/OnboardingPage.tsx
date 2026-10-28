import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  MapPin,
  UserRound,
} from "lucide-react";
import { Country, State, City } from "country-state-city";

type OnboardingForm = {
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  country: string;
  state: string;
  city: string;
  businessType: string;
  businessStage: string;
  customerSize: string;
  experience: string;
};

type FormErrors = Partial<Record<keyof OnboardingForm, string>>;

const TOTAL_STEPS = 7;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const initialForm: OnboardingForm = {
  firstName: "",
  lastName: "",
  phone: "",
  companyName: "",
  companyWebsite: "",
  country: "",
  state: "",
  city: "",
  businessType: "",
  businessStage: "",
  customerSize: "",
  experience: "",
};

const businessTypes = [
  "SaaS / Software",
  "E-commerce",
  "Agency / Services",
  "Local Business",
  "Creator / Personal Brand",
  "Other",
];

const businessStages = [
  "Just getting started",
  "Building",
  "Finding our first customers",
  "Growing",
  "Scaling",
  "Established",
];

const customerSizes = [
  "No customers yet",
  "1–100",
  "101–1,000",
  "1,001–10,000",
  "10,001–100,000",
  "100,000+",
];

const experienceLevels = [
  "Completely new",
  "Some experience",
  "Comfortable",
  "Experienced",
  "Very experienced",
];

const stepCopy = [
  {
    eyebrow: "01 / INTRODUCE YOURSELF",
    title: "Let’s start with the person behind the business.",
    body: "A little context helps Detrosys make the workspace feel like it belongs to you.",
  },
  {
    eyebrow: "02 / YOUR COMPANY",
    title: "Now give the business a little shape.",
    body: "We use this information to understand the environment you’re building in.",
  },
  {
    eyebrow: "03 / WHERE YOU OPERATE",
    title: "Context changes how a business operates.",
    body: "Tell us where your business is based. This will help us keep future recommendations relevant.",
  },
  {
    eyebrow: "04 / BUSINESS TYPE",
    title: "Every business has a different rhythm.",
    body: "Choose the description that feels closest to what you do today.",
  },
  {
    eyebrow: "05 / BUSINESS STAGE",
    title: "Where are you in the journey?",
    body: "There’s no right answer here. We simply want to understand where things stand today.",
  },
  {
    eyebrow: "06 / CUSTOMER SIZE",
    title: "Tell us about the people you serve.",
    body: "Your customer base gives us useful context for the scale of your current operation.",
  },
  {
    eyebrow: "07 / EXPERIENCE",
    title: "One last thing: how familiar is this world?",
    body: "This helps us understand how much guidance and context the workspace should provide.",
  },
];

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">
        {label}
        {required && (
          <span className="ml-1 text-[var(--detrosys-accent,#e4572e)]">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={[
          "w-full rounded-2xl border bg-white/70 px-4 py-3.5 text-[15px]",
          "text-neutral-950 placeholder:text-neutral-400",
          "outline-none transition-all duration-200",
          "dark:bg-white/[0.04] dark:text-white dark:placeholder:text-neutral-500",
          error
            ? "border-red-500/80 focus:border-red-500"
            : "border-neutral-300 focus:border-neutral-900 dark:border-white/15 dark:focus:border-white/50",
        ].join(" ")}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">
        {label}
        <span className="ml-1 text-[var(--detrosys-accent,#e4572e)]">*</span>
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={[
          "w-full appearance-none rounded-2xl border bg-white/70 px-4 py-3.5 text-[15px]",
          "text-neutral-950 outline-none transition-all duration-200",
          "dark:bg-white/[0.04] dark:text-white",
          disabled ? "cursor-not-allowed opacity-40" : "",
          error
            ? "border-red-500/80 focus:border-red-500"
            : "border-neutral-300 focus:border-neutral-900 dark:border-white/15 dark:focus:border-white/50",
        ].join(" ")}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-white text-neutral-950"
          >
            {option}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
  error,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option, index) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={[
                "group relative min-h-[62px] rounded-2xl border px-4 py-3.5 text-left",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30",
                "dark:focus-visible:ring-white/30",
                selected
                  ? "border-[var(--detrosys-accent,#e4572e)] bg-[var(--detrosys-accent,#e4572e)]/10"
                  : "border-neutral-300 bg-white/50 hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-white",
                "dark:border-white/15 dark:bg-white/[0.025] dark:hover:border-white/35 dark:hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    "transition-all duration-200",
                    selected
                      ? "border-[var(--detrosys-accent,#e4572e)] bg-[var(--detrosys-accent,#e4572e)] text-white"
                      : "border-neutral-300 text-neutral-400 dark:border-white/20 dark:text-neutral-500",
                  ].join(" ")}
                >
                  {selected ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    index + 1
                  )}
                </span>

                <span
                  className={[
                    "text-sm font-medium",
                    selected
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-700 dark:text-neutral-200",
                  ].join(" ")}
                >
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function HeptagonProgress({ step }: { step: number }) {
  const points = [
    [50, 5],
    [88, 22],
    [94, 61],
    [72, 93],
    [28, 93],
    [6, 61],
    [12, 22],
  ];

  return (
    <div
      className="relative h-24 w-24 shrink-0"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={step + 1}
      aria-label={`Onboarding progress: step ${step + 1} of ${TOTAL_STEPS}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <polygon
          points={points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-neutral-300 dark:text-white/10"
        />

        {points.map(([x1, y1], index) => {
          const [x2, y2] = points[(index + 1) % points.length];
          const active = index < step + 1;

          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={
                active
                  ? "text-[var(--detrosys-accent,#e4572e)]"
                  : "text-transparent"
              }
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">
          {step + 1}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-500">
          / {TOTAL_STEPS}
        </span>
      </div>
    </div>
  );
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white/60 text-neutral-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200">
      {children}
    </div>
  );
}

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saving, setSaving] = useState(false);

  // Full country, state, and city access
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const countryOptions = useMemo(
    () => allCountries.map((c) => c.name),
    [allCountries],
  );

  const selectedCountryObj = useMemo(() => {
    if (!form.country) return null;
    return (
      allCountries.find(
        (c) =>
          c.name.toLowerCase() === form.country.toLowerCase() ||
          c.isoCode.toUpperCase() === form.country.toUpperCase(),
      ) ?? null
    );
  }, [allCountries, form.country]);

  const availableStates = useMemo(() => {
    if (!selectedCountryObj) return [];
    return State.getStatesOfCountry(selectedCountryObj.isoCode);
  }, [selectedCountryObj]);

  const stateOptions = useMemo(() => {
    if (!availableStates.length) return [];
    return Array.from(new Set(availableStates.map((s) => s.name)));
  }, [availableStates]);

  const selectedStateObj = useMemo(() => {
    if (!form.state || !availableStates.length) return null;
    return (
      availableStates.find(
        (s) =>
          s.name.toLowerCase() === form.state.toLowerCase() ||
          s.isoCode.toUpperCase() === form.state.toUpperCase(),
      ) ?? null
    );
  }, [availableStates, form.state]);

  const availableCities = useMemo(() => {
    if (!selectedCountryObj || !selectedStateObj) return [];
    return City.getCitiesOfState(
      selectedCountryObj.isoCode,
      selectedStateObj.isoCode,
    );
  }, [selectedCountryObj, selectedStateObj]);

  const cityOptions = useMemo(() => {
    if (!availableCities.length) return [];
    return Array.from(new Set(availableCities.map((c) => c.name)));
  }, [availableCities]);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("detrosys_access_token");

      if (!token) {
        window.location.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          window.location.replace("/login");
          return;
        }

        const user = await response.json();

        if (user.onboarding_complete) {
          window.location.replace("/app");
          return;
        }

        setForm({
          firstName: user.first_name ?? "",
          lastName: user.last_name ?? "",
          phone: user.phone ?? "",
          companyName: user.company_name ?? "",
          companyWebsite: user.company_url ?? "",
          country: user.country ?? "",
          state: user.state ?? "",
          city: user.city ?? "",
          businessType: user.business_type ?? "",
          businessStage: user.business_stage ?? "",
          customerSize: user.company_size ?? "",
          experience: user.experience ?? "",
        });
      } catch (error) {
        console.error("Failed to load onboarding data:", error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  const updateField = <K extends keyof OnboardingForm>(
    field: K,
    value: OnboardingForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const validateStep = (currentStep: number): FormErrors => {
    const nextErrors: FormErrors = {};

    if (currentStep === 0) {
      if (!form.firstName.trim()) {
        nextErrors.firstName = "First name is required.";
      }

      if (!form.lastName.trim()) {
        nextErrors.lastName = "Last name is required.";
      }
    }

    if (currentStep === 1) {
      if (!form.companyName.trim()) {
        nextErrors.companyName = "Company name is required.";
      }

      if (form.companyWebsite.trim()) {
        try {
          const url = new URL(form.companyWebsite.trim());

          if (url.protocol !== "http:" && url.protocol !== "https:") {
            nextErrors.companyWebsite = "Enter a valid website URL.";
          }
        } catch {
          nextErrors.companyWebsite = "Enter a valid website URL.";
        }
      }
    }

    if (currentStep === 2) {
      if (!form.country) {
        nextErrors.country = "Country is required.";
      }

      if (!form.state) {
        nextErrors.state = "State or region is required.";
      }

      if (!form.city) {
        nextErrors.city = "City is required.";
      }
    }

    if (currentStep === 3 && !form.businessType) {
      nextErrors.businessType = "Choose an option to continue.";
    }

    if (currentStep === 4 && !form.businessStage) {
      nextErrors.businessStage = "Choose an option to continue.";
    }

    if (currentStep === 5 && !form.customerSize) {
      nextErrors.customerSize = "Choose an option to continue.";
    }

    if (currentStep === 6 && !form.experience) {
      nextErrors.experience = "Choose an option to continue.";
    }

    return nextErrors;
  };

  const saveOnboarding = async (): Promise<boolean> => {
    const token = localStorage.getItem("detrosys_access_token");

    if (!token) {
      window.location.replace("/login");
      return false;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone || null,
          company_name: form.companyName,
          company_url: form.companyWebsite || null,
          country: form.country,
          state: form.state,
          city: form.city,
          business_type: form.businessType,
          business_stage: form.businessStage,
          company_size: form.customerSize,
          experience: form.experience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Failed to save onboarding:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to save onboarding:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeStep = (nextStep: number) => {
    if (transitioning || saving || nextStep < 0 || nextStep >= TOTAL_STEPS) {
      return;
    }

    if (reducedMotion) {
      setStep(nextStep);
      setContentVisible(true);
      return;
    }

    setTransitioning(true);
    setContentVisible(false);

    window.setTimeout(() => {
      setStep(nextStep);

      window.requestAnimationFrame(() => {
        setContentVisible(true);

        window.setTimeout(() => {
          setTransitioning(false);
        }, 300);
      });
    }, 180);
  };

  const handleContinue = async (event: FormEvent) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors = validateStep(step);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (step === TOTAL_STEPS - 1) {
      const saved = await saveOnboarding();

      if (!saved) {
        return;
      }

      setShowCompletion(true);
      return;
    }

    changeStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0 || transitioning || saving) {
      return;
    }

    setErrors({});
    changeStep(step - 1);
  };

  const copy = stepCopy[step];

  return (
    <main className="min-h-screen min-w-[320px] bg-[#f3f1eb] text-neutral-950 dark:bg-[#0b0b0b] dark:text-white">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[40%_60%] lg:grid-cols-[45%_55%]">
        {/* LEFT / EDITORIAL SIDE */}
        <section className="relative flex min-h-[390px] flex-col justify-between overflow-hidden bg-[#e7e2d8] px-7 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12 dark:bg-[#151515]">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-neutral-900/10 dark:border-white/[0.06]"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full border border-neutral-900/[0.06] dark:border-white/[0.04]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-white dark:bg-white dark:text-neutral-950">
              D
            </div>

            <span className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
              detrosys
            </span>
          </div>

          <div
            className={[
              "relative z-10 max-w-xl py-12 transition-all duration-300 ease-out",
              contentVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0",
            ].join(" ")}
          >
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
              {copy.eyebrow}
            </p>

            <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[3.35rem] dark:text-white">
              {copy.title}
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600 sm:text-base dark:text-neutral-400">
              {copy.body}
            </p>
          </div>

          <div className="relative z-10 flex items-end justify-between">
            <div className="hidden max-w-[220px] text-xs leading-5 text-neutral-500 sm:block dark:text-neutral-500">
              Your answers shape the starting point for your Detrosys workspace.
            </div>

            <div className="ml-auto">
              <HeptagonProgress step={step} />
            </div>
          </div>
        </section>

        {/* RIGHT / FUNCTIONAL SIDE */}
        <section className="flex min-h-[620px] flex-col bg-[#f5f3ee] px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-16 lg:py-12 dark:bg-[#0d0d0d]">
          <form
            onSubmit={handleContinue}
            className="mx-auto flex w-full max-w-2xl flex-1 flex-col"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
                <span>Getting started</span>
                <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span>Step {step + 1}</span>
              </div>

              <div className="text-xs text-neutral-400 dark:text-neutral-600">
                {step + 1} of {TOTAL_STEPS}
              </div>
            </div>

            <div
              className={[
                "flex flex-1 flex-col justify-center py-10 transition-all duration-300 ease-out lg:py-12",
                contentVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0",
              ].join(" ")}
            >
              {/* STEP 1 */}
              {step === 0 && (
                <div className="space-y-8">
                  <div>
                    <SectionIcon>
                      <UserRound size={20} strokeWidth={1.8} />
                    </SectionIcon>

                    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      About you
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      What’s your name?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      Start with the basics. We’ll use your name throughout your
                      workspace.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="First name"
                      value={form.firstName}
                      onChange={(value) => updateField("firstName", value)}
                      placeholder="First name"
                      error={errors.firstName}
                      required
                      autoComplete="given-name"
                    />

                    <Field
                      label="Last name"
                      value={form.lastName}
                      onChange={(value) => updateField("lastName", value)}
                      placeholder="Last name"
                      error={errors.lastName}
                      required
                      autoComplete="family-name"
                    />

                    <div className="sm:col-span-2">
                      <Field
                        label="Phone number (optional)"
                        value={form.phone}
                        onChange={(value) => updateField("phone", value)}
                        placeholder="+91 98765 43210"
                        type="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <SectionIcon>
                      <Globe2 size={20} strokeWidth={1.8} />
                    </SectionIcon>

                    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Your company
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      Tell us about your company.
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      This information gives Detrosys a little more context
                      about the business you’re working on.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <Field
                      label="Company name"
                      value={form.companyName}
                      onChange={(value) => updateField("companyName", value)}
                      placeholder="Your company"
                      error={errors.companyName}
                      required
                      autoComplete="organization"
                    />

                    <Field
                      label="Company website"
                      value={form.companyWebsite}
                      onChange={(value) =>
                        updateField("companyWebsite", value)
                      }
                      placeholder="https://example.com"
                      error={errors.companyWebsite}
                      type="url"
                      autoComplete="url"
                    />

                    <p className="text-xs text-neutral-400 dark:text-neutral-600">
                      Optional — leave this empty if your company doesn’t have a
                      website.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3 (3 Cascading Dropdowns - Complete Lists) */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <SectionIcon>
                      <MapPin size={20} strokeWidth={1.8} />
                    </SectionIcon>

                    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Location
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      Where is your business based?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      Select your location in order. Changing a higher-level
                      location resets the selections below it.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <SelectField
                      label="Country"
                      value={form.country}
                      options={countryOptions}
                      onChange={(value) => {
                        updateField("country", value);
                        updateField("state", "");
                        updateField("city", "");
                      }}
                      placeholder="Select country"
                      error={errors.country}
                    />

                    <SelectField
                      label="State / region"
                      value={form.state}
                      options={stateOptions}
                      onChange={(value) => {
                        updateField("state", value);
                        updateField("city", "");
                      }}
                      placeholder={
                        !form.country
                          ? "Choose country first"
                          : stateOptions.length === 0
                          ? "No states found"
                          : "Select state"
                      }
                      error={errors.state}
                      disabled={!form.country || stateOptions.length === 0}
                    />

                    <SelectField
                      label="City"
                      value={form.city}
                      options={cityOptions}
                      onChange={(value) => updateField("city", value)}
                      placeholder={
                        !form.state
                          ? "Choose state first"
                          : cityOptions.length === 0
                          ? "No cities found"
                          : "Select city"
                      }
                      error={errors.city}
                      disabled={!form.state || cityOptions.length === 0}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Business profile
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      What type of business do you run?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      Pick the category that best represents your business
                      today.
                    </p>
                  </div>

                  <ChoiceGrid
                    options={businessTypes}
                    value={form.businessType}
                    onChange={(value) => updateField("businessType", value)}
                    error={errors.businessType}
                  />
                </div>
              )}

              {/* STEP 5 */}
              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Business profile
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      Where is your business right now?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      Choose the stage that feels closest to your current
                      situation.
                    </p>
                  </div>

                  <ChoiceGrid
                    options={businessStages}
                    value={form.businessStage}
                    onChange={(value) => updateField("businessStage", value)}
                    error={errors.businessStage}
                  />
                </div>
              )}

              {/* STEP 6 */}
              {step === 5 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Customer profile
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      How large is your customer base?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      A rough estimate is enough. You don’t need to provide an
                      exact number.
                    </p>
                  </div>

                  <ChoiceGrid
                    options={customerSizes}
                    value={form.customerSize}
                    onChange={(value) => updateField("customerSize", value)}
                    error={errors.customerSize}
                  />
                </div>
              )}

              {/* STEP 7 */}
              {step === 6 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                      Experience
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-[2.7rem] dark:text-white">
                      How experienced are you with marketing and business
                      software?
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      There’s no wrong answer. This simply helps us understand
                      how much context may be useful.
                    </p>
                  </div>

                  <ChoiceGrid
                    options={experienceLevels}
                    value={form.experience}
                    onChange={(value) => updateField("experience", value)}
                    error={errors.experience}
                  />
                </div>
              )}
            </div>

            {/* NAVIGATION */}
            <div className="border-t border-neutral-200 pt-5 dark:border-white/[0.08]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={transitioning || saving}
                      className="group flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium text-neutral-600 transition-all duration-200 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-white"
                    >
                      <ArrowLeft
                        size={17}
                        className="transition-transform duration-200 group-hover:-translate-x-0.5"
                      />
                      Back
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={transitioning || saving}
                  className="group flex min-w-[126px] items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  {saving
                    ? "Saving..."
                    : step === TOTAL_STEPS - 1
                      ? "Finish"
                      : "Continue"}

                  {!saving &&
                    (step === TOTAL_STEPS - 1 ? (
                      <Check size={17} strokeWidth={2.4} />
                    ) : (
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    ))}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* COMPLETION POPUP */}
      {showCompletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-complete-title"
        >
          <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl sm:p-9 dark:border-white/10 dark:bg-[#151515]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--detrosys-accent,#e4572e)] text-white">
              <Check size={27} strokeWidth={2.4} />
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
              Setup complete
            </p>

            <h2
              id="onboarding-complete-title"
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 dark:text-white"
            >
              You’re ready to go.
            </h2>

            <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Your onboarding is complete. Head into your workspace to start
              using Detrosys.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.assign("/app");
              }}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Go to Dashboard
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}