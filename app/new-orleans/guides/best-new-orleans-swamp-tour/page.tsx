import { permanentRedirect } from "next/navigation";

export default function LegacyBestSwampTourRedirect() {
  permanentRedirect("/swamp-tours");
}
