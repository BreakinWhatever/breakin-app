import { describe, expect, it } from "vitest";
import { buildWorkdayJobUrl, normalizeWorkdayJobUrl } from "@/lib/crawler/workday";

describe("workday URL helpers", () => {
  it("builds a valid URL when externalPath already starts with job", () => {
    const url = buildWorkdayJobUrl({
      origin: "https://blackrock.wd1.myworkdayjobs.com",
      tenant: "blackrock",
      site: "BlackRock_Professional",
      externalPath:
        "/job/New-York-NY/Analyst--Capital-Deployment---Liquidity-Management---Private-Financing-Solutions_R261647",
    });

    expect(url).toBe(
      "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/job/New-York-NY/Analyst--Capital-Deployment---Liquidity-Management---Private-Financing-Solutions_R261647"
    );
  });

  it("normalizes malformed workday URLs with duplicated job segments", () => {
    expect(
      normalizeWorkdayJobUrl(
        "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/job//job/New-York-NY/Analyst_R261647"
      )
    ).toBe(
      "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/job/New-York-NY/Analyst_R261647"
    );
  });

  it("keeps already valid workday URLs unchanged", () => {
    const url =
      "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/job/London-Greater-London/Associate_R262371";

    expect(normalizeWorkdayJobUrl(url)).toBe(url);
  });
});
