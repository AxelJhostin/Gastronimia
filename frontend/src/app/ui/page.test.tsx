import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComponentCatalog } from "@/components/catalog/component-catalog";

describe("ComponentCatalog", () => {
  it("muestra el catálogo como una herramienta de desarrollo", () => {
    render(<ComponentCatalog />);

    expect(screen.getByRole("heading", { name: "Catálogo de componentes" })).toBeInTheDocument();
    expect(screen.getByText(/solo desarrollo/i)).toBeInTheDocument();
  });
});
