import PlaceLinkPage, { placeLinkMetadata } from "../PlaceLinkPage"

// Next reads these literally from the page file, so they are not re-exported.
export const revalidate = 300
export const dynamicParams = true
export const generateMetadata = placeLinkMetadata
export default PlaceLinkPage
