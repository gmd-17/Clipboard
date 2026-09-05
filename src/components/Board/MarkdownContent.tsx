import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { codeToHtml } from "shiki";

interface MarkdownContentProps {
  content: string;
}

/*
 * Shiki understands many language names and aliases, but users will
 * inevitably type things like "js", "ts", "py", etc. Keeping the small
 * alias map here makes the Markdown syntax a little more forgiving.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  rb: "ruby",
  sh: "shellscript",
  shell: "shellscript",
  yml: "yaml",
  md: "markdown",
  html: "html",
  css: "css",
  json: "json",
  sql: "sql",
};

function getLanguage(className?: string): string {
  /*
   * react-markdown gives fenced code blocks a class like:
   *
   * language-python
   *
   * If there is no language marker, "text" gives us a safe plain-text
   * fallback instead of guessing what the code is.
   */
  const match = className?.match(/language-(\S+)/);

  if (!match) {
    return "text";
  }

  const requestedLanguage = match[1].toLowerCase();

  return LANGUAGE_ALIASES[requestedLanguage] ?? requestedLanguage;
}

interface HighlightedCodeProps {
  code: string;
  className?: string;
}

const HighlightedCode = ({ code, className }: HighlightedCodeProps) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const highlight = async () => {
      try {
        const language = getLanguage(className);

        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: "github-dark",
          transformers: [
            {
              pre(node) {
                node.properties.class = `${node.properties.class ?? ""} px-2 py-1 overflow-x-auto`;
              },
            },
          ],
        });

        if (!cancelled) {
          setHtml(highlighted);
        }
      } catch (error) {
        /*
         * A user can specify a language that Shiki doesn't know.
         * Highlighting should never make the entire card fail, so fall
         * back to ordinary <pre> rendering in that case.
         */
        console.warn("Unable to syntax-highlight code block:", error);

        if (!cancelled) {
          setHtml(null);
        }
      }
    };

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [code, className]);

  if (html) {
    return (
      <div
        data-highlighted-code-html
        className="text-[11px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre
      data-highlighted-code-pre
      className="overflow-x-auto text-[11px] leading-relaxed"
    >
      <code>{code}</code>
    </pre>
  );
};

const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <div className="text-text-primary text-xs leading-relaxed wrap-anywhere">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /*
           * Inline code and fenced code blocks both arrive here.
           *
           * "inline" is true for `something`.
           * A fenced block has no inline prop and gets highlighted by
           * HighlightedCode below.
           */
          code({ className, children, ...props }) {
            const inline = !className?.includes("language-");

            const code = String(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code
                  {...props}
                  className="bg-secondary text-accent rounded px-1 py-0.5 font-mono text-[11px]"
                >
                  {children}
                </code>
              );
            }

            return <HighlightedCode code={code} className={className} />;
          },

          pre({ children }) {
            return (
              <div className="bg-secondary border-border-subtle my-2 overflow-hidden rounded-md border">
                {children}
              </div>
            );
          },

          p({ children }) {
            return (
              <p className="mb-2 whitespace-pre-line last:mb-0">{children}</p>
            );
          },

          ul({ children }) {
            return (
              <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>
            );
          },

          blockquote({ children }) {
            return (
              <blockquote className="border-border-subtle text-text-muted my-2 border-l-2 pl-3 italic">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
