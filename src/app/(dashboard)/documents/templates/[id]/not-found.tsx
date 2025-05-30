import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center flex-1">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
          </div>
          <h1 className="text-2xl font-bold text-headline mb-2">Template Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The template you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/documents">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 