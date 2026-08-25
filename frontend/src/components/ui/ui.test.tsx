import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, DonutChart, EmptyState, Field, HorizontalBarChart, Input, Pagination, PasswordInput, PasswordStrength } from "./index";
import { UnitStatusSummary } from "@/components/domain/inventory";

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

  it("expone valores de gráficos con etiquetas accesibles", () => {
    render(<><HorizontalBarChart data={[{ label: "Cuchillería", value: 8 }]} label="Disponibilidad" /><DonutChart label="Estados" segments={[{ color: "var(--gastro-chart-primary)", label: "Disponible", value: 8 }]} /></>);
    expect(screen.getByRole("progressbar", { name: "Cuchillería: 8" })).toBeInTheDocument();
    expect(screen.getByLabelText("Estados: 8 en total")).toBeInTheDocument();
  });

  it("permite mostrar y ocultar una contraseña sin perder el control", () => {
    render(<PasswordInput aria-label="Contraseña" />);
    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");
  });

  it("explica visualmente los requisitos de contraseña", () => {
    render(<PasswordStrength confirmation="Segura123!" password="Segura123!" />);
    expect(screen.getByText("Al menos 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Las contraseñas coinciden")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /nivel de seguridad: alta/i })).toBeInTheDocument();
  });

  it("expone el resumen de estados de inventario como barras accesibles", () => {
    render(<UnitStatusSummary states={{ AVAILABLE: 2, MAINTENANCE: 1, RESERVED: 1 }} />);
    expect(screen.getByRole("progressbar", { name: "Disponibles: 2 de 4" })).toBeInTheDocument();
  });
});
