import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BottomNav from "@/components/BottomNav";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

afterEach(cleanup);

describe("BottomNav", () => {
  it("links to all three pages", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Täna" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Lisa" }).getAttribute("href")).toBe("/add");
    expect(screen.getByRole("link", { name: "Ajalugu" }).getAttribute("href")).toBe("/history");
  });

  it("marks only the current page as active", () => {
    pathname.value = "/add";
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Lisa" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Täna" }).getAttribute("aria-current")).toBeNull();
  });
});
