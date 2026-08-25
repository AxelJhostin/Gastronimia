import { notFound } from "next/navigation";

import { ComponentCatalog } from "@/components/catalog/component-catalog";

export default function ComponentCatalogPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ComponentCatalog />;
}
