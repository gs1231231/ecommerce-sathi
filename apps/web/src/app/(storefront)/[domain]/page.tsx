interface StorefrontPageProps {
  params: Promise<{ domain: string }>;
}

export default async function StorefrontPage({
  params,
}: StorefrontPageProps): Promise<React.ReactElement> {
  const { domain } = await params;

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-bold p-8">Store: {domain}</h1>
      {/* Storefront will be implemented in Prompt 8 */}
    </div>
  );
}
