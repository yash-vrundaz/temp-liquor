import { MetadataRoute } from "next";
import { SITE } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/cart", "/dashboard"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
