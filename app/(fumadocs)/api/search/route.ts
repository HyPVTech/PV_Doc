import { createSearchAPI } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

interface LexicalNode {
  type?: string;
  text?: string;
  children?: LexicalNode[];
}

interface LexicalContent {
  root?: LexicalNode;
}

/**
 * Extract plain text from Lexical content for search indexing
 */
function extractTextFromLexical(content: LexicalContent): string {
  if (!content?.root) {
    return "";
  }

  function extractFromNode(node: LexicalNode): string {
    if (!node) {
      return "";
    }

    if (node.type === "text") {
      return node.text || "";
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractFromNode).join(" ");
    }

    return "";
  }

  return extractFromNode(content.root);
}

async function getSearchIndexes() {
  const pages = await source.getPages();

  const entries = pages.map((page) => {
    const contentText = extractTextFromLexical(page.data.content);

    return {
      title: page.data.title,
      description: page.data.description || "",
      url: page.url,
      id: page.url,
      structuredData: {
        headings: [],
        contents: [
          {
            heading: page.data.title,
            content: contentText,
          },
        ],
      },
    };
  });

  return entries;
}

export const GET = async (request: Request) => {
  const indexes = await getSearchIndexes();
  const server = createSearchAPI("advanced", {
    indexes,
  });
  return server.GET(request);
};
