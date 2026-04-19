import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        code: ({ children, className }) =>
          className?.includes('language-') ? (
            <pre className="my-2 overflow-x-auto rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">
              {children}
            </code>
          ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
