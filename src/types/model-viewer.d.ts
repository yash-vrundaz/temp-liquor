import type {} from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

export {};
