import config from "@payload-config";
import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

export const dynamic = "force-dynamic";

interface LexicalNode {
  type?: string;
  text?: string;
  tag?: string;
  language?: string;
  children?: LexicalNode[];
}

interface LexicalContent {
  root?: LexicalNode;
}

interface DocRecord {
  id: string | number;
  slug: string;
  title: string;
  content?: LexicalContent;
  parent?: string | { id: string | number } | null;
}

/**
 * Extract formatted text from Lexical content preserving structure
 */
function extractTextFromLexical(content: LexicalContent): string {
  if (!content?.root) {
    return "";
  }

  function extractTextContent(node: LexicalNode): string {
    if (!node) {
      return "";
    }

    if (node.type === "text") {
      return node.text || "";
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractTextContent).join("");
    }

    return "";
  }

  function extractFromNode(node: LexicalNode): string {
    if (!node) {
      return "";
    }

    // Handle root node
    if (node.type === "root") {
      return (node.children || [])
        .map((child) => extractFromNode(child))
        .join("\n\n");
    }

    // Handle headings
    if (node.type === "heading") {
      const tag = node.tag || "h2";
      const depth = Number.parseInt(tag.substring(1), 10);
      const hashes = "#".repeat(depth);
      const text = extractTextContent(node);
      return `${hashes} ${text}`;
    }

    // Handle paragraphs
    if (node.type === "paragraph") {
      return extractTextContent(node);
    }

    // Handle lists
    if (node.type === "list") {
      return (node.children || [])
        .map((child) => extractFromNode(child))
        .join("\n");
    }

    if (node.type === "listitem") {
      const text = extractTextContent(node);
      return `- ${text}`;
    }

    // Handle quote
    if (node.type === "quote") {
      const text = extractTextContent(node);
      return `> ${text}`;
    }

    // Handle code block
    if (node.type === "code") {
      const text = extractTextContent(node);
      const language = node.language || "";
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }

    // Handle text node
    if (node.type === "text") {
      return node.text || "";
    }

    // Handle line break
    if (node.type === "linebreak") {
      return "\n";
    }

    // Fallback: extract children if they exist
    if (node.children && Array.isArray(node.children)) {
      return (node.children || [])
        .map((child) => extractFromNode(child))
        .join("\n\n");
    }

    return "";
  }

  return extractFromNode(content.root);
}

function buildDocPath(doc: DocRecord, byId: Map<string, DocRecord>): string[] {
  const segs: string[] = [];
  let current: DocRecord | undefined = doc;
  while (current) {
    if (current.slug !== "index") {
      segs.unshift(String(current.slug));
    }
    const parent = current.parent;
    if (parent && typeof parent === "object" && parent.id) {
      current = byId.get(String(parent.id));
    } else if (typeof parent === "string") {
      current = byId.get(String(parent));
    } else {
      current = undefined;
    }
  }
  return segs;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    notFound();
  }

  const payload = await getPayload({ config });

  // Extract category slug and doc path (supports nested docs like the /docs route)
  const [categorySlug, ...docSlugParts] = slug;
  const docPath = docSlugParts.join("/");

  // Find category first
  const { docs: categories } = await payload.find({
    collection: "categories",
    where: {
      slug: {
        equals: categorySlug,
      },
    },
    limit: 1,
    pagination: false,
    depth: 0,
  });

  const category = categories[0];
  if (!category) {
    notFound();
  }

  // Fetch all docs in the category and resolve by computed full path
  const { docs: catDocs } = await payload.find({
    collection: "docs",
    where: {
      category: {
        equals: category.id,
      },
    },
    limit: 1000,
    pagination: false,
    depth: 0,
  });

  const byId = new Map<string, DocRecord>();
  for (const d of catDocs) {
    byId.set(String(d.id), d as DocRecord);
  }

  const doc = catDocs.find(
    (d) => buildDocPath(d as DocRecord, byId).join("/") === docPath
  );
  if (!doc) {
    notFound();
  }

  const url = docPath
    ? `/docs/${categorySlug}/${docPath}`
    : `/docs/${categorySlug}`;
  const content = extractTextFromLexical(doc.content);

  const llmText = `# ${doc.title}
URL: ${url}

${content}`;

  return new NextResponse(llmText);
}
