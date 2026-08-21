#!/usr/bin/env python3
"""Generate Sam's Discount Liquor — client progress & roadmap PDF."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Sams-Discount-Liquor-Progress-Report.pdf"
FONT_DIR = Path("C:/Windows/Fonts")

# Brand palette
GOLD = colors.HexColor("#C9A962")
GOLD_DIM = colors.HexColor("#8A7340")
CREAM = colors.HexColor("#F2EBE0")
CHARCOAL = colors.HexColor("#141414")
INK = colors.HexColor("#1A1816")
MUTED = colors.HexColor("#6B6560")
SUCCESS = colors.HexColor("#4A7C59")
PHASE2 = colors.HexColor("#5B7FA6")
PHASE3 = colors.HexColor("#8B6B8E")
WHITE = colors.white
LIGHT_LINE = colors.HexColor("#E8E0D4")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Georgia", str(FONT_DIR / "georgia.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Bold", str(FONT_DIR / "georgiab.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Italic", str(FONT_DIR / "georgiai.ttf")))
    pdfmetrics.registerFont(TTFont("Calibri", str(FONT_DIR / "calibri.ttf")))
    pdfmetrics.registerFont(TTFont("Calibri-Bold", str(FONT_DIR / "calibrib.ttf")))


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Georgia-Bold",
            fontSize=34,
            leading=40,
            textColor=CREAM,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=14,
            leading=20,
            textColor=GOLD,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#B8AEA0"),
            alignment=TA_LEFT,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Georgia-Bold",
            fontSize=22,
            leading=28,
            textColor=INK,
            spaceBefore=0,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Georgia-Bold",
            fontSize=15,
            leading=20,
            textColor=GOLD_DIM,
            spaceBefore=16,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Calibri-Bold",
            fontSize=11,
            leading=14,
            textColor=INK,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#2A2623"),
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#2A2623"),
            leftIndent=14,
            bulletIndent=0,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=9,
            leading=12,
            textColor=MUTED,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "toc": ParagraphStyle(
            "toc",
            parent=base["Normal"],
            fontName="Calibri",
            fontSize=11,
            leading=18,
            textColor=INK,
            leftIndent=8,
        ),
    }


def draw_cover(canvas, doc) -> None:
    w, h = A4
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 8 * mm, w, 3 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD_DIM)
    canvas.rect(0, 0, w, 2 * mm, fill=1, stroke=0)
    canvas.restoreState()


def draw_content_page(canvas, doc) -> None:
    w, h = A4
    canvas.saveState()
    canvas.setStrokeColor(LIGHT_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(2 * cm, 1.6 * cm, w - 2 * cm, 1.6 * cm)
    canvas.setFont("Calibri", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2 * cm, 1.1 * cm, "Sam's Discount Liquor — Progress & Roadmap Report")
    canvas.drawRightString(w - 2 * cm, 1.1 * cm, f"Page {doc.page}")
    canvas.restoreState()


def bullet_list(items: list[str], styles: dict) -> list:
    flow = []
    for item in items:
        flow.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["bullet"]))
    return flow


def status_table(rows: list[tuple[str, str, str]], col_widths=None) -> Table:
    data = [["Module / Feature", "Status", "Description"]] + rows
    t = Table(data, colWidths=col_widths or [5.5 * cm, 2.2 * cm, 9.3 * cm], repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("TEXTCOLOR", (0, 0), (-1, 0), CREAM),
                ("FONTNAME", (0, 0), (-1, 0), "Calibri-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTNAME", (0, 1), (-1, -1), "Calibri"),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF7F2")]),
                ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def phase_box(title: str, subtitle: str, items: list[str], styles: dict, accent) -> list:
    flow = [
        Paragraph(f'<font color="{accent.hexval()}">{title}</font>', styles["h2"]),
        Paragraph(subtitle, styles["body"]),
    ]
    flow.extend(bullet_list(items, styles))
    flow.append(Spacer(1, 6))
    return flow


def build_document() -> list:
    s = build_styles()
    story: list = []

    # Cover content
    story.append(Spacer(1, 4.5 * cm))
    story.append(Paragraph("Sam's Discount Liquor", s["cover_title"]))
    story.append(Paragraph("Immersive Commerce Platform", s["cover_sub"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(
        Paragraph(
            "Progress Report &amp; Phased Roadmap",
            ParagraphStyle(
                "cover_doc",
                parent=s["cover_sub"],
                fontSize=18,
                textColor=CREAM,
                fontName="Georgia-Bold",
            ),
        )
    )
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("Prepared for client review", s["cover_meta"]))
    story.append(Paragraph(f"Report date: {date.today().strftime('%B %d, %Y')}", s["cover_meta"]))
    story.append(Paragraph("Engagement: Premium AR liquor storefront &amp; operations platform", s["cover_meta"]))
    story.append(Paragraph("Document classification: Confidential — for stakeholder use", s["cover_meta"]))
    story.append(PageBreak())

    # TOC
    story.append(Paragraph("Contents", s["h1"]))
    toc_items = [
        "1. Executive Summary",
        "2. Research &amp; Industry Benchmarking",
        "3. Platform Overview &amp; Technology Stack",
        "4. Phase 1 — Implemented (Current Delivery)",
        "5. Phase 2 — Depth &amp; Fidelity (Next Cycle)",
        "6. Phase 3 — Production Platform (Future)",
        "7. Feature Matrix — Implemented vs Planned",
        "8. Recommendations &amp; Next Steps",
    ]
    for item in toc_items:
        story.append(Paragraph(item, s["toc"]))
    story.append(PageBreak())

    # 1 Executive Summary
    story.append(Paragraph("1. Executive Summary", s["h1"]))
    story.append(
        Paragraph(
            "Sam's Discount Liquor is a premium digital commerce experience built on Next.js 15, "
            "combining a cinematic brand storefront, walkable 3D virtual showroom, AR bottle viewing, "
            "multi-branch inventory, and a full staff operations dashboard backed by PostgreSQL.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Phase 1 (current delivery)</b> delivers a production-grade frontend prototype with real "
            "database persistence, role-based access control, live inventory management, order processing, "
            "and immersive 3D/AR shopping surfaces. The platform is ready for stakeholder demo, user "
            "acceptance testing, and informed Phase 2 investment decisions.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Phase 2</b> focuses on catalog depth, photoreal bottle assets, loyalty program polish, "
            "and stronger branch/cart resolution. <b>Phase 3</b> adds live payment processing, legal "
            "compliance (age verification, alcohol shipping rules), CMS integration, and enterprise "
            "analytics for a full go-live.",
            s["body"],
        )
    )

    metrics = [
        ["Metric", "Value"],
        ["Product catalog (seeded SKUs)", "32 bottles across 13 categories"],
        ["Store locations", "3 New York branches (Downtown, Waterfront, Uptown)"],
        ["In-store events", "4 tastings &amp; launch events with seat booking"],
        ["API endpoints", "16 REST routes (auth, catalog, inventory, orders, users)"],
        ["User roles", "Customer, Staff, Admin, Owner (28 granular permissions)"],
        ["3D bottle models", "17 procedurally generated GLB assets + AR support"],
        ["Tech stack", "Next.js 15 · React 19 · PostgreSQL · Prisma · Three.js"],
    ]
    mt = Table(metrics, colWidths=[7 * cm, 10 * cm])
    mt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GOLD_DIM),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Calibri-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Calibri"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF7F2")]),
                ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(Spacer(1, 8))
    story.append(mt)
    story.append(PageBreak())

    # 2 R&D
    story.append(Paragraph("2. Research &amp; Industry Benchmarking", s["h1"]))
    story.append(
        Paragraph(
            "Before and during development, we benchmarked premium spirits commerce patterns to ensure "
            "Sam's platform follows proven industry approaches while differentiating through immersion.",
            s["body"],
        )
    )

    story.append(Paragraph("2.1 Competitive Landscape", s["h2"]))
    story.extend(
        bullet_list(
            [
                "<b>ByondXR (Bacardi, Dewar's, Patrón):</b> Walkable 3D virtual stores with shelf density, "
                "click-to-product, and AI-driven personalization. Brands report up to 94% conversion lift "
                "when adding 3D content to e-commerce.",
                "<b>Obsess:</b> Experiential 3D storefronts for alcohol &amp; spirits with in-scene "
                "video, gamification, and 3D analytics dashboards.",
                "<b>Premium brand sites (Glenfiddich, Woodford, Macallan):</b> Photography-led catalogs "
                "with CGI bottle viewers and model-viewer AR on product detail pages.",
                "<b>Shopify / model-viewer pattern:</b> Upload GLB + USDZ assets; rotate, zoom, and "
                "'View in Your Space' on mobile — the industry standard for web AR.",
            ],
            s,
        )
    )

    story.append(Paragraph("2.2 Key Research Insights", s["h2"]))
    insights = [
        (
            "Photography leads; 3D enhances",
            "High-end liquor commerce wins trust with studio product imagery. 3D and AR earn their place "
            "when they help customers inspect presence and place a bottle in real space — not when they "
            "replace the catalog.",
        ),
        (
            "Showroom before photoreal interiors",
            "Brand walkable stores succeed on atmosphere, shelf density, and click-to-product. Full physics "
            "and photoreal interiors are Phase 3 spend — not Phase 1 proof.",
        ),
        (
            "AR must be platform-native",
            "Customers expect 'view in your space' via model-viewer (iOS Quick Look / Android Scene Viewer). "
            "Prototype models can be temporary; the delivery architecture cannot.",
        ),
        (
            "Local stock is core product",
            "Neighborhood liquor retail converts on branch truth, events, and pickup — not only shipping. "
            "Multi-store UX is a differentiator, not an afterthought.",
        ),
        (
            "Compliance is a production gate",
            "US alcohol e-commerce requires defensible age verification (not checkbox gates), adult "
            "signature at delivery, state-by-state shipping permits, and excise tax remittance before go-live.",
        ),
    ]
    for title, body in insights:
        story.append(Paragraph(title, s["h3"]))
        story.append(Paragraph(body, s["body"]))

    story.append(Paragraph("2.3 Customer Journey Mapped", s["h2"]))
    journey = Table(
        [
            ["Step", "Stage", "Experience"],
            ["01", "Discover", "Cinematic landing, brand atmosphere, floating 3D bottles"],
            ["02", "Browse", "Photo-first catalog with search, filters, and category navigation"],
            ["03", "Inspect", "Product detail with 360° viewer, tasting notes, cocktails, reviews"],
            ["04", "Place", "AR preview — view bottle in real space via phone camera"],
            ["05", "Locate", "Branch stock visibility, pickup/delivery, other-store availability"],
            ["06", "Commit", "Cart, coupons, checkout with atomic stock deduction"],
        ],
        colWidths=[1.5 * cm, 2.5 * cm, 13 * cm],
    )
    journey.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("TEXTCOLOR", (0, 0), (-1, 0), CREAM),
                ("FONTNAME", (0, 0), (-1, 0), "Calibri-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Calibri"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF7F2")]),
                ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(journey)
    story.append(PageBreak())

    # 3 Stack
    story.append(Paragraph("3. Platform Overview &amp; Technology Stack", s["h1"]))
    story.append(
        Paragraph(
            "The platform is a full-stack Next.js 15 application with PostgreSQL persistence, "
            "designed for both customer-facing commerce and staff operations from a single codebase.",
            s["body"],
        )
    )
    stack_rows = [
        ["Frontend", "Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, GSAP"],
        ["3D / AR", "Three.js, React Three Fiber, Drei, Google model-viewer, procedural GLB generation"],
        ["Backend", "Next.js Route Handlers, Prisma 6 ORM, PostgreSQL, Zod validation, bcrypt + JWT sessions"],
        ["State", "Zustand (cart, wishlist, inventory, user), TanStack Query, Fuse.js search"],
        ["Dashboard", "Recharts analytics, role-permission matrix, activity audit log, image uploads"],
        ["Database", "10 models: Products, Categories, Locations, Inventory, Orders, Users, Events, Reviews, Activity, Ledger"],
    ]
    st = Table([["Layer", "Technologies"]] + stack_rows, colWidths=[3.5 * cm, 13.5 * cm])
    st.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GOLD_DIM),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Calibri-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Calibri"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF7F2")]),
                ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(st)
    story.append(PageBreak())

    # 4 Phase 1
    story.append(Paragraph("4. Phase 1 — Implemented (Current Delivery)", s["h1"]))
    story.append(
        Paragraph(
            "<font color='#4A7C59'><b>STATUS: COMPLETE — Ready for stakeholder review &amp; UAT</b></font>",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Phase 1 delivers a fully clickable, database-backed commerce platform that proves the "
            "immersive brand direction, multi-branch story, and operational tooling without production "
            "payment or compliance risk.",
            s["body"],
        )
    )

    phase1_sections = [
        (
            "4.1 Brand &amp; Storefront Experience",
            [
                "Cinematic landing page with scroll storytelling, floating 3D bottle carousel, and premium visual system",
                "13 product categories (Whiskey, Scotch, Bourbon, Vodka, Gin, Rum, Tequila, Brandy, Cognac, Wine, Beer, Champagne, Liqueur)",
                "32 seeded SKUs with rich product data: tasting notes, food pairings, cocktail recipes, brand stories, nutrition",
                "Shop catalog with Fuse.js fuzzy search, category filters, brand/country/price/rating/ABV sorting, pagination",
                "Product detail pages: photo gallery, 3D bottle tab, reviews, similar products, branch stock strip",
                "Global header with branch selector, voice search, live product search, cart badge, account menu",
                "Wishlist with persistent local storage",
                "Responsive luxury UI with glass morphism, gold accent palette, and mobile-first layout",
            ],
        ),
        (
            "4.2 Immersive 3D &amp; AR",
            [
                "Walkable virtual showroom (/virtual-store): WASD movement, mouse look, reflective floors, dense glass shelves",
                "Click bottles on shelves to open product drawer with add-to-cart, branch stock, and AR link",
                "17 procedurally generated GLB bottle models (lathe silhouettes, PBR glass, foil labels) via npm script",
                "Interactive 3D viewer on product pages (React Three Fiber, studio HDR lighting, contact shadows)",
                "AR preview page (/ar/[slug]): model-viewer with 'View in Your Space' on iOS/Android",
                "Asset swap path documented — replace GLB files per SKU without code changes",
            ],
        ),
        (
            "4.3 Multi-Branch Commerce",
            [
                "3 New York locations: Downtown (SoHo), Waterfront (Brooklyn), Uptown (Madison Ave)",
                "Per-branch inventory with seed stock, live on-hand counts, promo pricing, and featured flags",
                "Branch-aware cart: stock validation, conflict detection, 'other branch' availability panel",
                "Location pages with gallery, staff profiles, services, hours, and 'Shop this branch' action",
                "Pickup and delivery fulfillment modes with radius-based delivery logic",
                "Cart: save for later, coupon codes (SAMS10, GOLD15, WELCOME20), tax calculation (8.875% NY)",
            ],
        ),
        (
            "4.4 Checkout &amp; Orders",
            [
                "Guest and logged-in checkout flows with email, name, address, and card validation (Zod)",
                "Server-side order placement with atomic stock deduction in PostgreSQL transaction",
                "Inventory ledger tracking every stock change with reason codes and order references",
                "Order cancellation with stock restoration",
                "Server-side price recalculation — client totals cannot be tampered with",
                "Demo payment UI (Stripe-style card field — simulated, not live processing)",
            ],
        ),
        (
            "4.5 Authentication &amp; User Management",
            [
                "Password-based login/signup with bcrypt hashing and JWT session cookies (7-day expiry)",
                "4 roles: Customer, Staff, Admin, Owner with 28 granular permissions",
                "Per-user permission grants/revokes beyond role defaults",
                "Per-staff location access scoping (restrict to specific branches)",
                "Customer account page: profile edit, avatar upload, loyalty points/tier display, order history",
                "Demo accounts seeded for all roles (password: Liquor123!)",
            ],
        ),
        (
            "4.6 Staff Dashboard &amp; Operations",
            [
                "Analytics overview: revenue charts, category spend, branch performance, order status, fulfillment breakdown",
                "Interactive chart drill-down with order detail panels",
                "Inventory management: per-SKU stock adjust, bulk restock, store reset, low/out-of-stock alerts",
                "Catalog CRUD: add/edit/delete bottles with image upload, category assignment, pricing",
                "User management: create/edit/deactivate accounts, role assignment, password reset, permission editor",
                "Location management: add/edit/remove stores with full detail forms",
                "Events management: create/edit/delete tastings and festivals with seat counts",
                "Activity audit log: searchable trail of all account, stock, and catalog changes",
                "Staff profile panel with password change and avatar upload",
            ],
        ),
        (
            "4.7 Events &amp; Engagement",
            [
                "4 seeded events: Speyside Evening, Champagne Salon, Caribbean Rum Festival, Louis XIII Launch",
                "Event listing and detail pages with seat availability and booking flow",
                "Live seat deduction on booking (persisted in database)",
                "Homepage events showcase and location-specific event listings",
                "Loyalty points and tier system (Member → Connoisseur → Collector → VIP)",
            ],
        ),
        (
            "4.8 API &amp; Database Layer",
            [
                "16 REST API routes: bootstrap, products, categories, locations, inventory, orders, events, reviews, activity, users, auth (login/signup/logout/me), uploads",
                "PostgreSQL schema with 10 models and full relational integrity",
                "Prisma seed script: upserts catalog, preserves live stock/orders/loyalty on re-seed",
                "Zod request validation on all mutation endpoints",
                "Role-gated API access (staff+ for inventory, admin+ for users, owner for full access)",
                "Image upload endpoint for staff (4 MB limit, JPG/PNG/WebP)",
            ],
        ),
    ]

    for title, items in phase1_sections:
        story.append(Paragraph(title, s["h2"]))
        story.extend(bullet_list(items, s))

    story.append(PageBreak())

    # 5 Phase 2
    story.append(Paragraph("5. Phase 2 — Depth &amp; Fidelity (Next Cycle)", s["h1"]))
    story.append(
        Paragraph(
            f"<font color='{PHASE2.hexval()}'><b>STATUS: PLANNED — Next development cycle</b></font>",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Phase 2 fills assortment gaps and raises artifact fidelity where demos feel thin, "
            "without the cost and complexity of production payment/compliance systems.",
            s["body"],
        )
    )

    phase2_sections = [
        (
            "5.1 Catalog Expansion",
            [
                "Fill empty categories with real SKUs: wine, gin, rum, tequila, brandy, cognac, beer, champagne, liqueur",
                "Expand from 32 to 100+ bottles with distributor/brand partner data",
                "Import real product photography for all SKUs (replace Unsplash placeholders)",
                "Add subcategory navigation and collection curations (gift sets, rare allocations, new arrivals)",
                "Customer-submitted product reviews (currently read-only seeded reviews)",
            ],
        ),
        (
            "5.2 3D &amp; AR Asset Upgrade",
            [
                "Commission photoreal branded GLB models for hero SKUs (10–15 priority bottles)",
                "Generate matching USDZ files for iOS Quick Look AR",
                "Align 3D bottle silhouettes to actual brand packaging (labels, foil, bottle shapes)",
                "Enhanced virtual store environment: denser shelf layouts, branded signage, ambient audio",
                "Product configurator: gift wrap, engraving, custom message options in 3D preview",
            ],
        ),
        (
            "5.3 Commerce &amp; Loyalty Polish",
            [
                "Persistent wishlist synced to user account (currently browser-local only)",
                "Loyalty program rules engine: earn/redeem points, tier progression notifications",
                "Saved addresses and payment methods for returning customers",
                "Order tracking page with status updates and delivery ETA",
                "Email notifications: order confirmation, ready for pickup, event reminders",
                "Stronger branch/cart conflict resolution with smart branch suggestions",
            ],
        ),
        (
            "5.4 Events &amp; Community",
            [
                "Event payment integration (currently free booking without charge)",
                "Waitlist management for sold-out tastings",
                "Event calendar with iCal export and social sharing",
                "VIP allocation lottery system for rare bottles (Louis XIII, Macallan 25)",
                "In-store event check-in via QR code",
            ],
        ),
        (
            "5.5 Dashboard Enhancements",
            [
                "Export reports (CSV/PDF) for inventory, sales, and activity logs",
                "Automated low-stock email alerts to store managers",
                "Bulk product import via CSV/spreadsheet upload",
                "Promotional campaign manager (time-limited discounts, featured product rotation)",
                "Multi-store comparison dashboard for owners",
            ],
        ),
    ]

    for title, items in phase2_sections:
        story.append(Paragraph(title, s["h2"]))
        story.extend(bullet_list(items, s))

    story.append(PageBreak())

    # 6 Phase 3
    story.append(Paragraph("6. Phase 3 — Production Platform (Future)", s["h1"]))
    story.append(
        Paragraph(
            f"<font color='{PHASE3.hexval()}'><b>STATUS: VISION — Production go-live requirements</b></font>",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Phase 3 replaces demo systems with live commerce infrastructure, legal compliance, "
            "and enterprise-grade content operations for a full public launch.",
            s["body"],
        )
    )

    phase3_sections = [
        (
            "6.1 Payment Processing",
            [
                "Stripe (or equivalent) integration for live card processing",
                "Apple Pay / Google Pay support",
                "Alcohol-specific payment compliance (MCC codes, age-verified transactions)",
                "Refund and partial refund workflows",
                "Subscription billing for wine club memberships",
            ],
        ),
        (
            "6.2 Legal &amp; Compliance",
            [
                "Defensible age verification at checkout (third-party service: Veratad, IDology, or Persona)",
                "Legal age-gate on site entry with DOB verification (not checkbox-only)",
                "State-by-state shipping compliance matrix and geofence enforcement",
                "Adult signature requirement at delivery (carrier integration)",
                "Excise tax calculation and remittance by destination state",
                "TTB and state liquor license documentation and audit trail",
            ],
        ),
        (
            "6.3 Content Management &amp; Integrations",
            [
                "Headless CMS (Sanity, Contentful, or Strapi) for catalog, locations, events, and pages",
                "POS/inventory sync with existing store systems (Square, Lightspeed, or custom)",
                "ERP integration for purchase orders, receiving, and supplier management",
                "Email marketing platform (Klaviyo, Mailchimp) for campaigns and loyalty",
                "Google Analytics 4 + Meta Pixel + conversion tracking",
            ],
        ),
        (
            "6.4 Enterprise Features",
            [
                "Corporate gifting portal with bulk ordering and invoicing",
                "Wine/spirits club subscription management",
                "Allocation lottery and VIP member portal",
                "Multi-language support for international visitors",
                "Advanced analytics: cohort analysis, LTV, branch ROI, product affinity",
                "Mobile app (React Native or PWA) for push notifications and AR",
            ],
        ),
        (
            "6.5 Infrastructure &amp; DevOps",
            [
                "Production hosting (Vercel/AWS) with CDN, SSL, and auto-scaling",
                "CI/CD pipeline with automated testing and staging environments",
                "Database backups, disaster recovery, and monitoring (Sentry, Datadog)",
                "Rate limiting, DDoS protection, and security audit",
                "SOC 2 / PCI DSS compliance path for payment data",
            ],
        ),
    ]

    for title, items in phase3_sections:
        story.append(Paragraph(title, s["h2"]))
        story.extend(bullet_list(items, s))

    story.append(PageBreak())

    # 7 Feature Matrix
    story.append(Paragraph("7. Feature Matrix — Implemented vs Planned", s["h1"]))
    story.append(
        Paragraph(
            "Summary view of every major capability across the three phases.",
            s["body"],
        )
    )

    matrix_rows = [
        ["Landing page &amp; brand experience", "Done", "Phase 1 complete"],
        ["Product catalog &amp; search", "Done", "32 SKUs, 13 categories, Fuse.js search"],
        ["Virtual 3D showroom", "Done", "WASD walk, shelf click, product drawer"],
        ["AR bottle preview", "Done", "model-viewer, demo GLB assets"],
        ["Multi-branch inventory", "Done", "3 locations, live stock, branch selector"],
        ["Cart &amp; checkout", "Done", "Coupons, tax, pickup/delivery, demo payment"],
        ["Order processing", "Done", "Atomic stock deduction, ledger, cancel"],
        ["User auth &amp; roles", "Done", "4 roles, 28 permissions, JWT sessions"],
        ["Staff dashboard", "Done", "Analytics, inventory, users, events, activity"],
        ["Events &amp; booking", "Done", "4 events, seat booking, live counts"],
        ["Loyalty points/tiers", "Done", "Display + tier thresholds (basic)"],
        ["Wishlist", "Done", "Browser-local persistence"],
        ["Reviews", "Partial", "Seeded read-only; customer submit in Phase 2"],
        ["Product photography", "Partial", "Mix of real + Unsplash; full set in Phase 2"],
        ["3D bottle models", "Partial", "Procedural GLBs; branded assets in Phase 2"],
        ["Category assortment", "Partial", "Whiskey-heavy; other categories in Phase 2"],
        ["Live payments", "Planned", "Stripe integration — Phase 3"],
        ["Age verification", "Planned", "Third-party ID check — Phase 3"],
        ["Shipping compliance", "Planned", "State matrix + geofence — Phase 3"],
        ["CMS integration", "Planned", "Headless CMS — Phase 3"],
        ["POS sync", "Planned", "Real-time inventory sync — Phase 3"],
        ["Email notifications", "Planned", "Transactional email — Phase 2/3"],
        ["Mobile app", "Planned", "PWA or native — Phase 3"],
        ["Corporate gifting", "Planned", "Bulk portal — Phase 3"],
    ]
    story.append(status_table(matrix_rows))
    story.append(PageBreak())

    # 8 Recommendations
    story.append(Paragraph("8. Recommendations &amp; Next Steps", s["h1"]))

    recs = [
        (
            "Approve Phase 1 as the product direction",
            "Confirm cinematic brand, virtual showroom, AR preview, and multi-branch stock as "
            "the core differentiators before increasing assortment or CGI spend.",
        ),
        (
            "Schedule stakeholder demo &amp; UAT",
            "Walk through all customer journeys (discover → browse → 3D/AR → cart → checkout) "
            "and staff workflows (inventory, users, events) with key decision-makers.",
        ),
        (
            "Choose one Phase 2 primary investment",
            "Either fill empty categories first, or commission photoreal hero bottles first. "
            "Doing both at equal priority blurs the next review milestone.",
        ),
        (
            "Name production owners early",
            "Inventory truth, merchandising content, and alcohol-retail payment compliance "
            "should have named owners before Phase 3 architecture begins.",
        ),
        (
            "Plan compliance consultation",
            "Engage a beverage-alcohol attorney to map NY retail license requirements, "
            "DTC shipping rules, and age-verification obligations before Phase 3 payment go-live.",
        ),
    ]

    for i, (title, detail) in enumerate(recs, 1):
        story.append(Paragraph(f"8.{i} {title}", s["h2"]))
        story.append(Paragraph(detail, s["body"]))

    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "<i>This report reflects the platform state as of the report date. "
            "For a live demo, visit the deployed application or run locally with "
            "<font face='Courier'>npm run db:setup &amp;&amp; npm run dev</font>.</i>",
            s["small"],
        )
    )
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "<i>Demo accounts: owner@samsdiscountliquor.com · admin@samsdiscountliquor.com · "
            "staff@samsdiscountliquor.com · alex.reed@email.com — Password: Liquor123!</i>",
            s["small"],
        )
    )

    return story


def main() -> None:
    register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.2 * cm,
        title="Sam's Discount Liquor — Progress Report",
        author="Development Team",
        subject="Client progress report and phased roadmap",
    )

    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="content",
    )
    cover_frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="cover",
    )

    doc.addPageTemplates(
        [
            PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="Content", frames=[frame], onPage=draw_content_page),
        ]
    )

    story = build_document()
    story.insert(0, NextPageTemplate("Content"))
    doc.build(story)
    print(f"PDF generated: {OUT}")
    print(f"Size: {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
