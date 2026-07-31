import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Read-only markdown study content, styled for the dark mobile layout. */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[15px] leading-relaxed text-muted-foreground",
        "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[17px] [&_h1]:font-bold [&_h1]:text-foreground",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-1.5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]",
        "[&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
