"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownProps {
  children: string;
  className?: string;
  compact?: boolean;
}

export function Markdown({ children, className, compact = false }: MarkdownProps) {
  if (!children) return null;

  return (
    <div
      className={cn(
        "prose prose-gray dark:prose-invert max-w-none",
        !compact && "prose-headings:mt-8 prose-headings:mb-4 prose-p:mb-4",
        compact && "prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-2",
        "prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
        "prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed",
        "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
        "prose-em:text-gray-600 dark:prose-em:text-gray-400",
        "prose-code:text-red-600 dark:prose-code:text-red-400",
        "prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono",
        "prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
        "prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:p-4 prose-blockquote:rounded",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
        "prose-hr:border-gray-300 dark:prose-hr:border-gray-600 prose-hr:my-8",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom components for better styling
          ul: ({ children }) => <ul className="space-y-0">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-0">{children}</ol>,
          li: ({ children }) => <li className="my-0">{children}</li>,
          h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg font-semibold mt-6 mb-3">{children}</h4>,
          p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-2 py-1 rounded text-sm font-mono">{children}</code>;
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">{children}</blockquote>,
          hr: () => <hr className="border-gray-300 dark:border-gray-600 my-8" />,
          a: ({ href, children }) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline">{children}</a>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
} 