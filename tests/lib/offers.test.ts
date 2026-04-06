import { describe, it, expect } from "vitest";
import { detectContractType } from "@/lib/offers";

describe("detectContractType", () => {
  describe("title detection (priority)", () => {
    it("detects Stage from title", () => {
      expect(detectContractType("Analyste Stage Private Credit", "")).toBe("Stage");
    });

    it("detects Stage from 'internship' in title", () => {
      expect(detectContractType("Investment Banking Internship", "")).toBe("Stage");
    });

    it("detects Alternance from title", () => {
      expect(detectContractType("Analyste en alternance LevFin", "")).toBe("Alternance");
    });

    it("detects Alternance from 'apprenti' in title", () => {
      expect(detectContractType("Apprenti Analyste Credit", "")).toBe("Alternance");
    });

    it("detects VIE from title", () => {
      expect(detectContractType("Analyste VIE M&A Dubai", "")).toBe("VIE");
    });

    it("detects CDD from title", () => {
      expect(detectContractType("Analyste CDD 6 mois", "")).toBe("CDD");
    });
  });

  describe("description fallback (when title is ambiguous)", () => {
    it("detects Alternance from description when title is just 'Analyste'", () => {
      expect(
        detectContractType(
          "Analyste Crédit",
          "Nous recherchons un analyste en alternance pour rejoindre notre équipe Private Credit."
        )
      ).toBe("Alternance");
    });

    it("detects Stage from description", () => {
      expect(
        detectContractType(
          "Analyste M&A",
          "This is a 6-month internship position in our Paris office."
        )
      ).toBe("Stage");
    });

    it("detects Alternance from 'apprentissage' in description", () => {
      expect(
        detectContractType(
          "Chargé d'affaires",
          "Dans le cadre d'un contrat d'apprentissage, vous rejoindrez notre équipe LevFin."
        )
      ).toBe("Alternance");
    });

    it("defaults to CDI when no keywords found", () => {
      expect(
        detectContractType(
          "Analyste Credit Senior",
          "Nous recrutons un professionnel expérimenté pour un poste permanent."
        )
      ).toBe("CDI");
    });
  });

  describe("raw ATS type fallback", () => {
    it("maps 'permanent' to CDI", () => {
      expect(detectContractType("Analyst", "Some description", "permanent")).toBe("CDI");
    });

    it("maps 'contract' to CDD", () => {
      expect(detectContractType("Analyst", "Some description", "contract")).toBe("CDD");
    });
  });

  describe("title beats description", () => {
    it("uses VIE from title even if description says permanent", () => {
      expect(
        detectContractType(
          "Analyste VIE London",
          "permanent full-time role"
        )
      ).toBe("VIE");
    });
  });
});
