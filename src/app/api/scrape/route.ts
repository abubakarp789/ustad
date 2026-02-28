import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "Please provide a valid URL" },
                { status: 400 }
            );
        }

        // Fetch the page HTML
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: `Failed to fetch the page (HTTP ${response.status}). Try pasting the lab content directly instead.`,
                },
                { status: 422 }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract lab title
        const labTitle =
            $("h1").first().text().trim() ||
            $(".ql-title-medium").first().text().trim() ||
            $("title").text().trim() ||
            "Untitled Lab";

        // Extract lab description
        const labDescription =
            $(".lab-content p").first().text().trim() ||
            $("meta[name='description']").attr("content") ||
            "";

        // Extract tasks/objectives from the page
        const rawTasks: { title: string; content: string }[] = [];

        // Strategy 1: Look for headings followed by content
        $("h2, h3, .step-title, .ql-headline-small").each((index, element) => {
            const title = $(element).text().trim();
            if (title && title.length > 2) {
                // Gather all sibling content until the next heading
                let content = "";
                let sibling = $(element).next();
                while (
                    sibling.length &&
                    !sibling.is("h2, h3, .step-title, .ql-headline-small")
                ) {
                    content += sibling.text().trim() + "\n";
                    sibling = sibling.next();
                }
                rawTasks.push({ title, content: content.trim() });
            }
        });

        // Strategy 2: If no tasks found, look for ordered lists
        if (rawTasks.length === 0) {
            $("ol > li, .step").each((index, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 10) {
                    rawTasks.push({
                        title: `Step ${index + 1}`,
                        content: text,
                    });
                }
            });
        }

        // Strategy 3: Fallback — grab all substantial paragraphs
        if (rawTasks.length === 0) {
            $("p, .lab-content > div").each((index, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 30) {
                    rawTasks.push({
                        title: `Section ${index + 1}`,
                        content: text,
                    });
                }
            });
        }

        // Extract code snippets from the page
        const codeSnippets: string[] = [];
        $("pre, code, .code-block").each((_, element) => {
            const code = $(element).text().trim();
            if (code && code.length > 5) {
                codeSnippets.push(code);
            }
        });

        return NextResponse.json({
            labTitle,
            labDescription,
            rawTasks: rawTasks.slice(0, 20), // Limit to 20 tasks
            codeSnippets: codeSnippets.slice(0, 30),
            scrapedSuccessfully: rawTasks.length > 0,
        });
    } catch (error) {
        console.error("Scrape error:", error);
        return NextResponse.json(
            {
                error:
                    "Failed to scrape the page. The URL might be blocked or invalid. Try pasting the lab content directly.",
            },
            { status: 500 }
        );
    }
}
