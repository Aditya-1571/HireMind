import { ErrorState } from "@/components/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      title="Page not found"
      description="The page you are looking for does not exist or may have moved."
      homeHref="/dashboard"
    />
  );
}
