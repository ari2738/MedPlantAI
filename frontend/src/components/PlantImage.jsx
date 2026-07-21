import { useState } from "react";
import { Leaf } from "lucide-react";

/**
 * Renders /plants/{slug}.jpg from the public folder.
 * Falls back to a placeholder leaf icon if the image is missing or fails to load,
 * so one missing/misnamed file doesn't break the page.
 */
export default function PlantImage({ slug, alt, className = "" }) {
  const [errored, setErrored] = useState(false);

  if (errored || !slug) {
    return (
      <div className={`bg-sage-100 flex items-center justify-center ${className}`}>
        <Leaf size={26} className="text-forest-500/40" />
      </div>
    );
  }

  return (
    <img
      src={`/plants/${slug}.jpg`}
      alt={alt || "Plant photo"}
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  );
}