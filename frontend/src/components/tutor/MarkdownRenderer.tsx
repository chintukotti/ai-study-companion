import React from 'react';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  if (!content) return null;

  // Split by code blocks first (```code```)
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
      {parts.map((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3);
          const lines = inner.split('\n');
          let language = '';
          let code = '';
          if (lines.length > 1 && /^[a-zA-Z0-9_#-]+$/.test(lines[0].trim())) {
            language = lines[0].trim();
            code = lines.slice(1).join('\n');
          } else {
            code = inner;
          }

          return (
            <div key={partIdx} className="my-2 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900 text-slate-100">
              {language && (
                <div className="bg-slate-800/80 px-3 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-700/50">
                  {language}
                </div>
              )}
              <pre className="p-3.5 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render regular markdown text
        return <TextMarkdownBlock key={partIdx} text={part} isUser={isUser} />;
      })}
    </div>
  );
};

const TextMarkdownBlock: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const rawLines = text.split('\n');

  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (keyPrefix: number) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="space-y-1 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start">
              <span className={`mr-2.5 mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? 'bg-white' : 'bg-blue-600'}`} />
              <div className="flex-1">{renderInline(item, isUser)}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${keyPrefix}`} className="space-y-1 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start">
              <span className={`mr-2 font-bold text-xs min-w-4 shrink-0 ${isUser ? 'text-blue-100' : 'text-blue-600'}`}>
                {idx + 1}.
              </span>
              <div className="flex-1">{renderInline(item, isUser)}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check for unordered list (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(idx);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      return;
    }

    // Check for ordered list (1. 2. etc)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(idx);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[1]);
      return;
    }

    // Not a list item, flush existing list
    flushList(idx);

    if (!trimmed) {
      elements.push(<div key={`spacer-${idx}`} className="h-1.5" />);
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h5 key={`h3-${idx}`} className={`font-bold text-sm mt-2.5 mb-1 ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {renderInline(trimmed.slice(4), isUser)}
        </h5>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h4 key={`h2-${idx}`} className={`font-bold text-base mt-3 mb-1 ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {renderInline(trimmed.slice(3), isUser)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h1-${idx}`} className={`font-bold text-lg mt-3.5 mb-1.5 ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {renderInline(trimmed.slice(2), isUser)}
        </h3>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote 
          key={`quote-${idx}`} 
          className={`border-l-4 pl-3 py-1 my-2 italic ${
            isUser ? 'border-blue-200 text-blue-50' : 'border-blue-500 text-gray-700 bg-blue-50/50 rounded-r-lg'
          }`}
        >
          {renderInline(trimmed.slice(2), isUser)}
        </blockquote>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {renderInline(trimmed, isUser)}
      </p>
    );
  });

  flushList(rawLines.length);

  return <>{elements}</>;
};

/**
 * Parses inline tokens: **bold**, *italic*, `code`, and [Page X] citations.
 */
function renderInline(text: string, isUser: boolean): React.ReactNode {
  // Regex matches:
  // 1. **bold** or __bold__
  // 2. `code`
  // 3. [Page X]
  // 4. *italic* or _italic_
  const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\[Page\s+\d+\]|\*[^*]+?\*)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold (**text** or __text__)
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={index} className={`font-bold ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline code (`code`)
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-pink-600 border border-slate-200/60'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Citation badge ([Page X])
    const pageMatch = part.match(/^\[Page\s+(\d+)\]$/i);
    if (pageMatch) {
      const pageNum = pageMatch[1];
      return (
        <span
          key={index}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold mx-0.5 ${
            isUser
              ? 'bg-white/20 text-white'
              : 'bg-orange-100 text-orange-800 border border-orange-200'
          }`}
        >
          Page {pageNum}
        </span>
      );
    }

    // Italic (*text*)
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Plain text
    return <span key={index}>{part}</span>;
  });
}
