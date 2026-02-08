import fs from "fs";
import path from "path";

export default function ArgoPage() {
  const filePath = path.join(
    process.cwd(),
    "public/mighty-argo-shuttle/index.html"
  );

  const html = fs.readFileSync(filePath, "utf8");

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
