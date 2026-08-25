import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, EmptyState, Field, Input, Pagination } from "./index";

describe("componentes de interfaz", () => {
  it("deshabilita el botón mientras muestra una carga", () => {
    render(<Button isLoading>Guardar</Button>);
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("relaciona la etiqueta de un campo con su entrada", () => {
    render(<Field htmlFor="correo" label="Correo institucional" required><Input id="correo" required type="email" /></Field>);
    expect(screen.getByLabelText(/correo institucional/i)).toBeRequired();
  });

  it("expone estados reutilizables con texto accesible", () => {
    render(<><Badge tone="success">Disponible</Badge><EmptyState description="No existen registros todavía." title="Sin registros" /></>);
    expect(screen.getByRole("heading", { name: "Sin registros" })).toBeInTheDocument();
  });

  it("mantiene la navegación de paginación dentro de sus límites", () => {
    render(<Pagination currentPage={1} onPageChange={() => undefined} totalPages={3} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });
});
