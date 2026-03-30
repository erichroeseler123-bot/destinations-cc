import { redirect } from "next/navigation";

export default function Page() {
  redirect("/plan?intent=compare&topic=swamp-tours&subtype=types&context=first-time");
}
