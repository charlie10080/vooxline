import React from 'react';
import { parseBody } from '@/lib/updates';
import type { Inline } from '@/lib/updates';

const InlineText: React.FC<{ parts: Inline[] }> = ({ parts }) => (
  <>
    {parts.map((p, i) =>
      p.bold ? (
        <strong key={i} className="font-semibold text-vx-text">
          {p.text}
        </strong>
      ) : (
        <React.Fragment key={i}>{p.text}</React.Fragment>
      ),
    )}
  </>
);

/** Cuerpo del aviso: párrafos, listas y negritas como elementos de React (nunca HTML crudo) */
export const UpdateBody: React.FC<{ body: string }> = ({ body }) => (
  <div className="space-y-3 text-sm leading-relaxed text-vx-text-2">
    {parseBody(body).map((block, i) =>
      block.kind === 'list' ? (
        <ul key={i} className="space-y-1.5 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vx-accent" aria-hidden="true" />
              <span>
                <InlineText parts={item} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p key={i}>
          {block.lines.map((line, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              <InlineText parts={line} />
            </React.Fragment>
          ))}
        </p>
      ),
    )}
  </div>
);
