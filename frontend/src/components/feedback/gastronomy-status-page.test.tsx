import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GastronomyStatusPage } from "./gastronomy-status-page";

describe("GastronomyStatusPage", () => {
  it("diferencia acceso denegado y revela el huevo de Pascua", () => {
    render(<GastronomyStatusPage kind="forbidden" />);

    expect(screen.getByRole("heading", { name: /esta estación no está en tu menú/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Encontrar el ingrediente secreto" }));
    expect(screen.getByText(/axel was here/i)).toBeInTheDocument();
  });
});
