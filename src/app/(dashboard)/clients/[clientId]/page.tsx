import { ClientPageContent } from "@/components/client-page-content";

interface ClientPageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { clientId } = await params;

  return <ClientPageContent clientId={clientId} />;
}