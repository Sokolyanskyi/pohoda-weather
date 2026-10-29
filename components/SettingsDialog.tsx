"use client";

import { useState } from "react";
import { ICON_PACKS, usePrefs, type IconPack } from "@/lib/client/prefs";
import {
  DEFAULT_CUSTOM_THEME,
  type CustomTheme,
} from "@/lib/client/custom-theme";
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

function SettingsToggle({
  title,
  sub,
  open,
  controls,
  showLabel,
  hideLabel,
  onToggle,
}: {
  title: string;
  sub: string;
  open: boolean;
  controls: string;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="settings-toggle"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <span className="settings-toggle-text">
        <span className="settings-toggle-title">{title}</span>
        <span className="settings-toggle-sub">{sub}</span>
      </span>
      <span className="settings-toggle-action">{open ? hideLabel : showLabel}</span>
      <svg className="settings-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
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
  // Themes, icon packs and providers are long lists, so every one of them
  // starts folded and the summary line still shows what is selected.
  const [themesOpen, setThemesOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [iconsOpen, setIconsOpen] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(false);

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
        <SettingsToggle
          title={t("settings.appearance.theme")}
          sub={t(`theme.${prefs.theme}` as MessageKey)}
          open={themesOpen}
          controls="settings-themes"
          showLabel={t("settings.toggle.show")}
          hideLabel={t("settings.toggle.hide")}
          onToggle={() => setThemesOpen((value) => !value)}
        />
        {themesOpen ? (
          <div id="settings-themes" className="settings-collapse">
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
                    <span
                      className="theme-name"
                      style={{ color: meta.scheme === "dark" ? "#f4f6fb" : "#142033" }}
                    >
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
          </div>
        ) : null}
      </section>

      <section className="settings-block">
        <SettingsToggle
          title={t("settings.appearance.customTheme")}
          sub={
            prefs.theme === "custom"
              ? t("settings.appearance.customThemeText")
              : t(`theme.${prefs.theme}` as MessageKey)
          }
          open={customOpen}
          controls="settings-custom"
          showLabel={t("settings.toggle.show")}
          hideLabel={t("settings.toggle.hide")}
          onToggle={() => setCustomOpen((value) => !value)}
        />
        {customOpen ? (
          <div id="settings-custom" className="settings-collapse">
            <p className="hint">{t("settings.appearance.customThemeText")}</p>
            <div className="custom-theme-grid">
              {(["bg", "accent", "card"] as const).map((key) => {
                const fallback = DEFAULT_CUSTOM_THEME;
                const value =
                  prefs.customTheme?.[key] ??
                  (key === "bg" ? fallback.bg : key === "accent" ? fallback.accent : fallback.card);
                const label =
                  key === "bg"
                    ? t("settings.appearance.customBg")
                    : key === "accent"
                      ? t("settings.appearance.customAccent")
                      : t("settings.appearance.customCard");
                return (
                  <label key={key} className="custom-theme-field">
                    <span>{label}</span>
                    <div className="custom-color-row">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          const base = prefs.customTheme ?? DEFAULT_CUSTOM_THEME;
                          const next: CustomTheme = { ...base, [key]: e.target.value };
                          update({ customTheme: next, theme: "custom" });
                          if (!customName) setCustomName("Моя тема");
                        }}
                      />
                      <input
                        type="text"
                        className="custom-hex"
                        value={value}
                        maxLength={7}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
                          const base = prefs.customTheme ?? DEFAULT_CUSTOM_THEME;
                          const next: CustomTheme = { ...base, [key]: v };
                          update({ customTheme: next, theme: "custom" });
                        }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="custom-theme-name-row">
              <input
                type="text"
                className="custom-name-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t("settings.appearance.customTheme")}
                maxLength={40}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const draft = prefs.customTheme ?? DEFAULT_CUSTOM_THEME;
                  if (editingId) {
                    const next = prefs.savedThemes.map((th) =>
                      th.id === editingId
                        ? { ...th, name: customName.trim() || th.name, bg: draft.bg, accent: draft.accent, card: draft.card }
                        : th,
                    );
                    update({ savedThemes: next });
                  } else {
                    const id = `custom-${Date.now()}`;
                    const name = customName.trim() || "Моя тема";
                    update({
                      savedThemes: [...prefs.savedThemes, { id, name, bg: draft.bg, accent: draft.accent, card: draft.card }],
                    });
                    setEditingId(id);
                  }
                }}
              >
                {editingId ? "Сохранить изменения" : "Сохранить тему"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingId(null);
                    setCustomName("");
                  }}
                >
                  Новая
                </button>
              ) : null}
            </div>
            <div
              className="custom-theme-preview"
              style={{
                background: prefs.customTheme?.bg ?? DEFAULT_CUSTOM_THEME.bg,
                borderColor: prefs.customTheme?.accent ?? DEFAULT_CUSTOM_THEME.accent,
              }}
            >
              <span style={{ color: prefs.customTheme?.accent ?? DEFAULT_CUSTOM_THEME.accent }}>
                Акцент
              </span>
              <span style={{ background: prefs.customTheme?.card ?? DEFAULT_CUSTOM_THEME.card }} />
            </div>
            {prefs.savedThemes.length > 0 ? (
              <div className="saved-themes">
                <h4 className="saved-themes-title">Сохранённые</h4>
                {prefs.savedThemes.map((theme) => (
                  <div key={theme.id} className="saved-theme-row">
                    <span
                      className="saved-theme-swatch"
                      style={{
                        background: theme.bg,
                        borderColor: theme.accent,
                      }}
                    >
                      <span style={{ background: theme.card }} />
                    </span>
                    <span className="saved-theme-name">{theme.name}</span>
                    <div className="saved-theme-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          update({ customTheme: { bg: theme.bg, accent: theme.accent, card: theme.card }, theme: "custom" });
                          setCustomName(theme.name);
                          setEditingId(theme.id);
                        }}
                      >
                        Применить
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          update({ customTheme: { bg: theme.bg, accent: theme.accent, card: theme.card }, theme: "custom" });
                          setCustomName(theme.name);
                          setEditingId(theme.id);
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          update({ savedThemes: prefs.savedThemes.filter((t) => t.id !== theme.id) });
                          if (editingId === theme.id) {
                            setEditingId(null);
                            setCustomName("");
                          }
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      `<section className="settings-block">
        <SettingsToggle
          title={t("settings.appearance.icons")}
          sub={t(`pack.${prefs.iconPack}` as MessageKey)}
          open={iconsOpen}
          controls="settings-icons"
          showLabel={t("settings.toggle.show")}
          hideLabel={t("settings.toggle.hide")}
          onToggle={() => setIconsOpen((value) => !value)}
        />
        {iconsOpen ? (
          <div id="settings-icons" className="settings-collapse">
            <p className="hint">{t("settings.appearance.iconsText")}</p>
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
        ) : null}
      </section>

      <section className="settings-block">
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
        <SettingsToggle
          title={t("settings.provider.title")}
          sub={
            providersOpen
              ? t("settings.provider.text")
              : `${activeProvider.name} · ${activeProvider.model}`
          }
          open={providersOpen}
          controls="settings-providers"
          showLabel={t("settings.toggle.show")}
          hideLabel={t("settings.toggle.hide")}
          onToggle={() => setProvidersOpen((value) => !value)}
        />
        {providersOpen ? (
          <div id="settings-providers" className="settings-collapse">
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
                    title={`${provider.name} · ${provider.model}`}
                  >
                    <span className="provider-main">
                      <strong>{provider.model}</strong>
                      <small>{provider.name}</small>
                    </span>
                    <span className="provider-side">
                      <span className="chip chip-soft">
                        {t("settings.provider.days", { days: provider.days })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="provider-desc">
              <p>{t(activeProvider.descriptionKey)}</p>
            </div>
            <p className="hint">{t("settings.provider.free")}</p>
          </div>
        ) : null}
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
