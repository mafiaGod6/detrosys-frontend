import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Check,
  Globe2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Country, State, City } from "country-state-city";

import { SettingsNavigation } from "../../components/private/SettingsNavigation";

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional = false,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
        {label}
        {optional && (
          <span className="ml-1 normal-case tracking-normal text-neutral-400">
            (optional)
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white/60 px-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
};

function Select({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: SelectProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={[
          "mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white/60 px-4 text-sm text-neutral-950 outline-none transition-colors",
          "dark:border-white/[0.08] dark:bg-[#141414] dark:text-white",
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-neutral-300 dark:hover:border-white/20",
        ].join(" ")}
      >
        {children}
      </select>
    </label>
  );
}

type HeadingProps = {
  icon: LucideIcon;
  title: string;
  text: string;
};

function Heading({
  icon: Icon,
  title,
  text,
}: HeadingProps) {
  return (
    <div className="flex items-start gap-4 border-b border-neutral-200 pb-4 dark:border-white/[0.08]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
        <Icon size={16} strokeWidth={1.8} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-neutral-400 dark:text-neutral-600">
          {text}
        </p>
      </div>
    </div>
  );
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function SettingsProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessStage, setBusinessStage] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experience, setExperience] = useState("");

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [onboardingComplete, setOnboardingComplete] =
    useState(false);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Full country, state, and city access
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const countryOptions = useMemo(
    () => allCountries.map((c) => c.name),
    [allCountries],
  );

  const selectedCountryObj = useMemo(() => {
    if (!country) return null;
    return (
      allCountries.find(
        (c) =>
          c.name.toLowerCase() === country.toLowerCase() ||
          c.isoCode.toUpperCase() === country.toUpperCase(),
      ) ?? null
    );
  }, [allCountries, country]);

  const availableStates = useMemo(() => {
    if (!selectedCountryObj) return [];
    return State.getStatesOfCountry(selectedCountryObj.isoCode);
  }, [selectedCountryObj]);

  const stateOptions = useMemo(() => {
    if (!availableStates.length) return [];
    return Array.from(new Set(availableStates.map((s) => s.name)));
  }, [availableStates]);

  const selectedStateObj = useMemo(() => {
    if (!state || !availableStates.length) return null;
    return (
      availableStates.find(
        (s) =>
          s.name.toLowerCase() === state.toLowerCase() ||
          s.isoCode.toUpperCase() === state.toUpperCase(),
      ) ?? null
    );
  }, [availableStates, state]);

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
    const loadProfile = async () => {
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

        // Personal information
        setFirstName(user.first_name ?? "");
        setLastName(user.last_name ?? "");
        setPhone(user.phone ?? "");

        // Business information
        setCompanyName(user.company_name ?? "");
        setCompanyUrl(user.company_url ?? "");
        setBusinessType(user.business_type ?? "");
        setBusinessStage(user.business_stage ?? "");
        setCompanySize(user.company_size ?? "");
        setExperience(user.experience ?? "");

        // Location
        setCountry(user.country ?? "");
        setState(user.state ?? "");
        setCity(user.city ?? "");

        // Onboarding status
        setOnboardingComplete(Boolean(user.onboarding_complete));
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const saveChanges = async () => {
    const token = localStorage.getItem("detrosys_access_token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim() || null,
          company_name: companyName,
          company_url: companyUrl || null,
          country,
          state,
          city,
          business_type: businessType,
          business_stage: businessStage,
          company_size: companySize,
          experience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Failed to save profile:", errorData);
        return;
      }

      setOnboardingComplete(true);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1600);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-20">
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-600">
          Settings / Profile
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl dark:text-white">
          Profile
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Your business identity and the information collected during
          onboarding.
        </p>
      </header>

      <div className="mt-8">
        <SettingsNavigation />
      </div>

      {loading ? (
        <div className="mt-10 flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-600">
            Loading profile...
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* PERSONAL INFORMATION */}
          <section>
            <Heading
              icon={UserRound}
              title="Personal information"
              text="The information associated with your Detrosys workspace."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="First name"
                value={firstName}
                onChange={setFirstName}
              />

              <Field
                label="Last name"
                value={lastName}
                onChange={setLastName}
              />

              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="+91 98765 43210"
                type="tel"
                optional
              />
            </div>
          </section>

          {/* BUSINESS */}
          <section>
            <Heading
              icon={Building2}
              title="Business"
              text="The business information used throughout your workspace."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Company name"
                  value={companyName}
                  onChange={setCompanyName}
                />
              </div>

              <Field
                label="Company URL"
                value={companyUrl}
                placeholder="https://"
                onChange={setCompanyUrl}
              />

              <Select
                label="Business type"
                value={businessType}
                onChange={setBusinessType}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Select business type</option>
                <option value="SaaS / Software" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">SaaS / Software</option>
                <option value="E-commerce" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">E-commerce</option>
                <option value="Agency / Services" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Agency / Services</option>
                <option value="Local Business" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Local Business</option>
                <option value="Creator / Personal Brand" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                  Creator / Personal Brand
                </option>
                <option value="Other" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Other</option>
              </Select>

              <Select
                label="Business stage"
                value={businessStage}
                onChange={setBusinessStage}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Select business stage</option>
                <option value="Just getting started" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Just getting started</option>
                <option value="Building" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Building</option>
                <option value="Finding our first customers" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                  Finding our first customers
                </option>
                <option value="Growing" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Growing</option>
                <option value="Scaling" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Scaling</option>
                <option value="Established" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Established</option>
              </Select>

              <Select
                label="Company size"
                value={companySize}
                onChange={setCompanySize}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Select company size</option>
                <option value="No customers yet" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">No customers yet</option>
                <option value="1–100" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">1–100</option>
                <option value="101–1,000" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">101–1,000</option>
                <option value="1,001–10,000" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">1,001–10,000</option>
                <option value="10,001–100,000" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">10,001–100,000</option>
                <option value="100,000+" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">100,000+</option>
              </Select>

              <Select
                label="Marketing / software experience"
                value={experience}
                onChange={setExperience}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Select experience</option>
                <option value="Completely new" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Completely new</option>
                <option value="Some experience" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Some experience</option>
                <option value="Comfortable" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Comfortable</option>
                <option value="Experienced" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Experienced</option>
                <option value="Very experienced" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Very experienced</option>
              </Select>
            </div>
          </section>

          {/* LOCATION (Full Access 3 Cascading Dropdowns) */}
          <section>
            <Heading
              icon={MapPin}
              title="Location"
              text="Your business location."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {/* Country */}
              <Select
                label="Country"
                value={country}
                onChange={(value) => {
                  setCountry(value);
                  setState("");
                  setCity("");
                }}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">Select country</option>
                {countryOptions.map((option) => (
                  <option key={option} value={option} className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                    {option}
                  </option>
                ))}
              </Select>

              {/* State */}
              <Select
                label="State / region"
                value={state}
                onChange={(value) => {
                  setState(value);
                  setCity("");
                }}
                disabled={!country || stateOptions.length === 0}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                  {!country
                    ? "Choose country first"
                    : stateOptions.length === 0
                    ? "No states found"
                    : "Select state"}
                </option>
                {stateOptions.map((option) => (
                  <option key={option} value={option} className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                    {option}
                  </option>
                ))}
              </Select>

              {/* City */}
              <Select
                label="City"
                value={city}
                onChange={setCity}
                disabled={!state || cityOptions.length === 0}
              >
                <option value="" className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                  {!state
                    ? "Choose state first"
                    : cityOptions.length === 0
                    ? "No cities found"
                    : "Select city"}
                </option>
                {cityOptions.map((option) => (
                  <option key={option} value={option} className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          {/* ONBOARDING STATUS */}
          <section className="border-y border-neutral-200 py-5 dark:border-white/[0.08]">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-start gap-3">
                <Globe2
                  size={16}
                  className="mt-0.5 text-neutral-400 dark:text-neutral-600"
                />

                <div>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Onboarding complete
                  </p>

                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
                    Whether the initial onboarding flow has been completed.
                  </p>
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    onboardingComplete ? "bg-emerald-500" : "bg-neutral-400",
                  ].join(" ")}
                />

                {onboardingComplete ? "Yes" : "No"}
              </span>
            </div>
          </section>

          {/* SAVE */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}