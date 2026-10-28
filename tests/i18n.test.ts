import { describe, expect, it } from "vitest";
import { LOCALES, messages, translate, errorMessage, localeIntl } from "@/lib/i18n";
import { en } from "@/lib/i18n/messages/en";

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("message catalogues", () => {
  const keys = Object.keys(en) as Array<keyof typeof en>;

  it("covers all six languages", () => {
    expect(LOCALES).toEqual(["en", "uk", "ru", "pl", "de", "es"]);
  });

  it("has every key in every language", () => {
    for (const locale of LOCALES) {
      const dict = messages[locale];
      const missing = keys.filter((key) => !dict[key]?.trim());
      expect(missing, `${locale} is missing keys`).toEqual([]);
      const extra = Object.keys(dict).filter((key) => !(key in en));
      expect(extra, `${locale} has unknown keys`).toEqual([]);
    }
  });

  it("keeps the same placeholders as English", () => {
    for (const locale of LOCALES) {
      if (locale === "en") continue;
      for (const key of keys) {
        expect(
          placeholders(messages[locale][key]),
          `${locale}.${key} placeholders`,
        ).toEqual(placeholders(en[key]));
      }
    }
  });
});

describe("translate", () => {
  it("interpolates variables", () => {
    expect(translate("en", "hero.high", { temp: "12°" })).toBe("High 12°");
    expect(translate("uk", "hero.high", { temp: "12°" })).toBe("Макс. 12°");
  });

  it("keeps unknown placeholders intact", () => {
    expect(translate("en", "hero.high", {})).toBe("High {temp}");
  });

  it("falls back to English for unknown locales", () => {
    expect(translate("xx", "tab.today")).toBe("Today");
  });
});

describe("errors", () => {
  it("maps provider codes to readable messages", () => {
    expect(errorMessage("en", "rate_limit")).toMatch(/too many/i);
    expect(errorMessage("de", "timeout")).toMatch(/langsam/i);
    expect(errorMessage("en", "something-else")).toBe(translate("en", "error.unknown"));
  });
});

describe("intl locales", () => {
  it("exposes BCP 47 tags", () => {
    expect(localeIntl("uk")).toBe("uk-UA");
    expect(localeIntl("es")).toBe("es-ES");
    expect(localeIntl("nope")).toBe("en-GB");
  });
});
