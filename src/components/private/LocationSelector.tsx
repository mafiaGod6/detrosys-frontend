import { useMemo } from "react";
import { Country, State, City, type ICountry, type IState, type ICity } from "country-state-city";

type LocationSelectorProps = {
  country: string; // Country Name or ISO Code
  state: string;   // State Name or Code
  city: string;    // City Name
  onChange: (updates: { country?: string; state?: string; city?: string }) => void;
  disabled?: boolean;
};

export function LocationSelector({
  country,
  state,
  city,
  onChange,
  disabled = false,
}: LocationSelectorProps) {
  // 1. All Countries (Loaded once)
  const countries = useMemo(() => Country.getAllCountries(), []);

  // 2. Resolve Selected Country Object (handles match by name or isoCode)
  const selectedCountryObj = useMemo(() => {
    if (!country) return null;
    return (
      countries.find(
        (c) =>
          c.name.toLowerCase() === country.toLowerCase() ||
          c.isoCode.toUpperCase() === country.toUpperCase()
      ) ?? null
    );
  }, [countries, country]);

  // 3. States for Selected Country
  const availableStates = useMemo(() => {
    if (!selectedCountryObj) return [];
    return State.getStatesOfCountry(selectedCountryObj.isoCode);
  }, [selectedCountryObj]);

  // 4. Resolve Selected State Object
  const selectedStateObj = useMemo(() => {
    if (!state || !selectedCountryObj) return null;
    return (
      availableStates.find(
        (s) =>
          s.name.toLowerCase() === state.toLowerCase() ||
          s.isoCode.toUpperCase() === state.toUpperCase()
      ) ?? null
    );
  }, [availableStates, state, selectedCountryObj]);

  // 5. Cities for Selected State
  const availableCities = useMemo(() => {
    if (!selectedCountryObj || !selectedStateObj) return [];
    return City.getCitiesOfState(
      selectedCountryObj.isoCode,
      selectedStateObj.isoCode
    );
  }, [selectedCountryObj, selectedStateObj]);

  // Handler: Country Changed -> Resets State & City
  const handleCountryChange = (isoCode: string) => {
    const targetCountry = countries.find((c) => c.isoCode === isoCode);
    if (!targetCountry) {
      onChange({ country: "", state: "", city: "" });
      return;
    }
    onChange({
      country: targetCountry.name, // Storing clean name: "United States", "India", etc.
      state: "",
      city: "",
    });
  };

  // Handler: State Changed -> Resets City
  const handleStateChange = (isoCode: string) => {
    const targetState = availableStates.find((s) => s.isoCode === isoCode);
    if (!targetState) {
      onChange({ state: "", city: "" });
      return;
    }
    onChange({
      state: targetState.name,
      city: "",
    });
  };

  // Handler: City Changed
  const handleCityChange = (cityName: string) => {
    onChange({ city: cityName });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* COUNTRY SELECT */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Country
        </label>
        <select
          disabled={disabled}
          value={selectedCountryObj?.isoCode ?? ""}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white disabled:opacity-50"
        >
          <option value="">Select Country</option>
          {countries.map((c: ICountry) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* STATE SELECT */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          State / Province
        </label>
        <select
          disabled={disabled || !selectedCountryObj || availableStates.length === 0}
          value={selectedStateObj?.isoCode ?? ""}
          onChange={(e) => handleStateChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white disabled:opacity-50"
        >
          <option value="">
            {!selectedCountryObj
              ? "Select country first"
              : availableStates.length === 0
              ? "No states available"
              : "Select State"}
          </option>
          {availableStates.map((s: IState) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* CITY SELECT */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          City
        </label>
        {availableCities.length > 0 ? (
          <select
            disabled={disabled || !selectedStateObj}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white disabled:opacity-50"
          >
            <option value="">Select City</option>
            {availableCities.map((c: ICity, index) => (
              <option key={`${c.name}-${index}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            disabled={disabled || !selectedCountryObj}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder={
              !selectedCountryObj
                ? "Select country first"
                : "Enter city manually"
            }
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white disabled:opacity-50"
          />
        )}
      </div>
    </div>
  );
}