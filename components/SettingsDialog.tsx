"use client";

import { ICON_PACKS, usePrefs, type IconPack } from "@/lib/client/prefs";
import { APP_VERSION, REPO_URL } from "@/lib/config";
import { LOCALES, LOCALE_META, type Locale, type MessageKey } from "@/lib/i18n";
import { placeLabel, placeSecondary } from "@/lib/places";
import { THEMES, THEME_META } from "@/lib/theme";
import type { PrecipUnit, PressureUnit, TemperatureUnit, WindUnit } from "@/lib/types";
import { PROVIDERS, PROVIDER_MAP } from "@/lib/weather/providers";
import type { WeatherKind } from "@/lib/types";
import { Modal } from "./Modal";
import { WeatherIcon } from "./WeatherIcon";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenPlace: () => void;
  kind: WeatherKind;
  isDay: boolean;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? "seg is-active" : "seg"}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsDialog({
  open,
  onClose,
  onOpenPlace,
  kind,
  isDay,
}: SettingsDialogProps) {
  const { prefs, update, t } = usePrefs();

  const activeProvider = PROVIDER_MAP[prefs.provider];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      closeLabel={t("settings.close")}
      size="lg"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {t("settings.done")}
        </button>
      }
    >
      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.place.title")}</h3>
          <p>{t("settings.place.text")}</p>
        </div>
        <div className="place-current">
          <div>
            <span className="eyebrow">{t("settings.place.current")}</span>
            <strong>{placeLabel(prefs.place)}</strong>
            {placeSecondary(prefs.place) ? <small>{placeSecondary(prefs.place)}</small> : null}
          </div>
          <button type="button" className="btn btn-ghost" onClick={onOpenPlace}>
            {t("settings.place.change")}
          </button>
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.provider.title")}</h3>
          <p>{t("settings.provider.text")}</p>
        </div>
        <div className="provider-list" role="radiogroup" aria-label={t("a11y.provider")}>
          {PROVIDERS.map((provider) => {
            const selected = provider.id === prefs.provider;
            return (
              <button
                key={provider.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? "provider is-active" : "provider"}
                onClick={() => update({ provider: provider.id })}
              >
                <span className="provider-main">
                  <strong>{provider.name}</strong>
                  <small>{provider.model}</small>
                </span>
                <span className="provider-side">
                  <span className="chip chip-soft">{t("settings.provider.days", { days: provider.days })}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="provider-desc">
          <p>{t(activeProvider.descriptionKey)}</p>
        </div>
        <p className="hint">{t("settings.provider.free")}</p>
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.language.title")}</h3>
          <p>{t("settings.language.text")}</p>
        </div>
        <div className="option-grid lang-grid" role="radiogroup" aria-label={t("a11y.language")}>
          {LOCALES.map((locale: Locale) => (
            <button
              key={locale}
              type="button"
              role="radio"
              aria-checked={prefs.locale === locale}
              className={prefs.locale === locale ? "option is-active" : "option"}
              onClick={() => update({ locale })}
            >
              <span>{LOCALE_META[locale].nativeName}</span>
              <small>{LOCALE_META[locale].englishName}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.appearance.title")}</h3>
          <p>{t("settings.appearance.iconsText")}</p>
        </div>
        <span className="field-label">{t("settings.appearance.theme")}</span>
        <div className="theme-grid" role="radiogroup" aria-label={t("a11y.theme")}>
          {THEMES.map((theme) => {
            const meta = THEME_META[theme];
            const selected = prefs.theme === theme;
            return (
              <button
                key={theme}
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? "theme-card is-active" : "theme-card"}
                onClick={() => update({ theme })}
                style={{
                  background: meta.preview.bg,
                  borderColor: selected ? meta.preview.accent : meta.preview.line,
                }}
              >
                <span className="theme-swatches" aria-hidden="true">
                  <span style={{ background: meta.preview.card }} />
                  <span style={{ background: meta.preview.accent }} />
                  <span style={{ background: meta.preview.line }} />
                </span>
                <span className="theme-name" style={{ color: meta.scheme === "dark" ? "#f4f6fb" : "#142033" }}>
                  {t(`theme.${theme}` as MessageKey)}
                </span>
                <span
                  className="theme-scheme"
                  style={{ color: meta.scheme === "dark" ? "#aab4c8" : "#5d6b80" }}
                >
                  {meta.scheme}
                </span>
              </button>
            );
          })}
        </div>

        <div className="appearance-row">
          <span className="field-label">{t("settings.appearance.icons")}</span>
          <div className="icon-grid" role="radiogroup" aria-label={t("a11y.iconPack")}>
            {ICON_PACKS.map((pack: IconPack) => (
              <button
                key={pack}
                type="button"
                role="radio"
                aria-checked={prefs.iconPack === pack}
                className={prefs.iconPack === pack ? "icon-card is-active" : "icon-card"}
                onClick={() => update({ iconPack: pack })}
                title={t(`pack.${pack}` as MessageKey)}
              >
                <WeatherIcon
                  kind={kind}
                  isDay={isDay}
                  pack={pack}
                  size={38}
                  motion={prefs.motion}
                />
                <span>{t(`pack.${pack}` as MessageKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <Segmented
          label={t("settings.appearance.motion")}
          value={prefs.motion}
          onChange={(motion) => update({ motion })}
          options={[
            { value: "full", label: t("settings.appearance.motionFull") },
            { value: "calm", label: t("settings.appearance.motionCalm") },
            { value: "off", label: t("settings.appearance.motionOff") },
          ]}
        />
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.units.title")}</h3>
        </div>
        <div className="units-grid">
          <Segmented<TemperatureUnit>
            label={t("settings.units.temperature")}
            value={prefs.temperature}
            onChange={(temperature) => update({ temperature })}
            options={[
              { value: "c", label: "°C" },
              { value: "f", label: "°F" },
            ]}
          />
          <Segmented<WindUnit>
            label={t("settings.units.wind")}
            value={prefs.wind}
            onChange={(wind) => update({ wind })}
            options={[
              { value: "kmh", label: "km/h" },
              { value: "ms", label: "m/s" },
              { value: "mph", label: "mph" },
            ]}
          />
          <Segmented<PressureUnit>
            label={t("settings.units.pressure")}
            value={prefs.pressure}
            onChange={(pressure) => update({ pressure })}
            options={[
              { value: "hpa", label: "hPa" },
              { value: "mmhg", label: "mmHg" },
              { value: "inhg", label: "inHg" },
            ]}
          />
          <Segmented<PrecipUnit>
            label={t("settings.units.precipitation")}
            value={prefs.precipitation}
            onChange={(precipitation) => update({ precipitation })}
            options={[
              { value: "mm", label: "mm" },
              { value: "in", label: "in" },
            ]}
          />
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <h3>{t("settings.about.title")}</h3>
          <p>{t("settings.about.text")}</p>
        </div>
        <div className="about-row">
          <span className="chip chip-soft">{t("settings.about.version", { version: APP_VERSION })}</span>
          <a className="link" href={REPO_URL} target="_blank" rel="noreferrer noopener">
            {t("settings.about.github")}
          </a>
        </div>
      </section>
    </Modal>
  );
}
