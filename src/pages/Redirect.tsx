import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { resolveAndTrack } from "@/lib/link-shortener";
import { Loader2 } from "lucide-react";

export default function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shortCode) { setError(true); return; }
    resolveAndTrack(shortCode).then((url) => {
      if (url) window.location.href = url;
      else setError(true);
    });
  }, [shortCode]);

  if (error) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
