import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("muestra el nombre del sistema", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        name: /gestión de inventario, préstamos y trazabilidad/i,
      }),
    ).toBeInTheDocument();
  });
});
