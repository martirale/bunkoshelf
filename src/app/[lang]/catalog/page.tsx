interface CatalogPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  await params;

  return <div />;
}
