// RM20773: the site footer (components/site/SiteFooter.tsx) is rendered once for every page by
// app/[locale]/layout.tsx, so pages outside the rebuilt set get it too. Pages that still render <Footer />
// get nothing here, which keeps each page to exactly one footer.
export default function Footer() {
  return null
}
